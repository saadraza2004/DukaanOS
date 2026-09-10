using System.Text.Json;
using DukaanOS.API.Core.Entities;
using DukaanOS.API.Core.Enums;
using DukaanOS.API.Core.Services;
using DukaanOS.API.Data;
using DukaanOS.API.DTOs;
using Microsoft.EntityFrameworkCore;

namespace DukaanOS.API.Services;

public interface ISaleService
{
    Task<SaleDto> ProcessSaleAsync(CreateSaleRequest request, int cashierUserId, int storeId = 1);
    Task<SaleDto?> GetSaleByIdAsync(Guid saleId, int? storeId = null);
    Task<List<SaleDto>> GetRecentSalesAsync(int limit = 50, int? storeId = null);
}

public class SaleService : ISaleService
{
    private readonly DukaanDbContext _db;

    public SaleService(DukaanDbContext db)
    {
        _db = db;
    }

    public async Task<SaleDto> ProcessSaleAsync(CreateSaleRequest request, int cashierUserId, int storeId = 1)
    {
        // 1. Idempotency Check: If sale with this ClientSaleId already exists, return it immediately
        var saleId = request.ClientSaleId ?? Guid.NewGuid();
        var existingSale = await GetSaleByIdAsync(saleId, storeId);
        if (existingSale != null)
        {
            return existingSale;
        }

        // 2. Begin Atomic Database Transaction
        using var transaction = await _db.Database.BeginTransactionAsync();

        var invoiceNumber = $"INV-{DateTime.UtcNow:yyyyMMddHHmmss}-{new Random().Next(100, 999)}";
        var saleItems = new List<SaleItem>();
        decimal calculatedSubtotal = 0m;
        decimal calculatedTotalCost = 0m;

        // Fetch products for all items
        var productIds = request.Items.Select(i => i.ProductId).Distinct().ToList();
        var products = await _db.Products
            .Where(p => productIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id);

        foreach (var itemReq in request.Items)
        {
            if (!products.TryGetValue(itemReq.ProductId, out var product))
            {
                throw new InvalidOperationException($"Product with ID {itemReq.ProductId} not found.");
            }

            var quantityInBaseUnit = UnitConverter.ConvertToBaseUnit(product, itemReq.QuantityEntered, itemReq.UnitEntered);
            var lineTotal = UnitConverter.CalculateLineTotal(product, quantityInBaseUnit, product.CurrentSellingPrice);

            calculatedSubtotal += lineTotal;

            // FIFO Batch Allocation
            var activeBatches = await _db.InventoryBatches
                .Where(b => b.ProductId == product.Id && b.RemainingQuantityBaseUnit > 0)
                .OrderBy(b => b.ReceivedDate)
                .ThenBy(b => b.Id)
                .ToListAsync();

            decimal remainingToAllocate = quantityInBaseUnit;
            decimal itemCostTotal = 0m;
            var batchAllocations = new List<object>();

            foreach (var batch in activeBatches)
            {
                if (remainingToAllocate <= 0) break;

                var deductQty = Math.Min(batch.RemainingQuantityBaseUnit, remainingToAllocate);
                batch.RemainingQuantityBaseUnit -= deductQty;
                remainingToAllocate -= deductQty;

                var deductedMajorUnits = deductQty / (product.BaseUnitRatio > 0 ? product.BaseUnitRatio : 1m);
                var batchCost = Math.Round(deductedMajorUnits * batch.CostPricePerMajorUnit, 2);
                itemCostTotal += batchCost;

                batchAllocations.Add(new
                {
                    BatchId = batch.Id,
                    BatchNumber = batch.BatchNumber,
                    DeductedBaseUnit = deductQty,
                    DeductedMajorUnit = deductedMajorUnits,
                    CostPricePerMajorUnit = batch.CostPricePerMajorUnit,
                    LineBatchCost = batchCost
                });
            }

            // If stock depleted past batches, calculate remaining cost using the latest batch or 0
            if (remainingToAllocate > 0)
            {
                var fallbackBatch = activeBatches.LastOrDefault();
                var fallbackCostPerUnit = fallbackBatch?.CostPricePerMajorUnit ?? (product.CurrentSellingPrice * 0.75m);
                var overflowMajor = remainingToAllocate / (product.BaseUnitRatio > 0 ? product.BaseUnitRatio : 1m);
                itemCostTotal += Math.Round(overflowMajor * fallbackCostPerUnit, 2);
            }

            calculatedTotalCost += itemCostTotal;

            // Reduce product running stock
            product.CurrentStockBaseUnit -= quantityInBaseUnit;
            product.UpdatedAt = DateTime.UtcNow;

            // Record Movement
            _db.InventoryMovements.Add(new InventoryMovement
            {
                ProductId = product.Id,
                MovementType = MovementType.Sale,
                QuantityBaseUnit = -quantityInBaseUnit,
                BalanceAfterBaseUnit = product.CurrentStockBaseUnit,
                ReferenceId = invoiceNumber,
                Reason = $"POS Sale {invoiceNumber}",
                UserId = cashierUserId,
                CreatedAt = DateTime.UtcNow
            });

            var saleItem = new SaleItem
            {
                SaleId = saleId,
                ProductId = product.Id,
                ProductName = product.Name,
                QuantityEntered = itemReq.QuantityEntered,
                UnitEntered = itemReq.UnitEntered.ToUpperInvariant(),
                QuantityInBaseUnit = quantityInBaseUnit,
                SellingPricePerMajorUnit = product.CurrentSellingPrice,
                LineTotal = lineTotal,
                AllocatedCostTotal = itemCostTotal,
                BatchAllocationJson = JsonSerializer.Serialize(batchAllocations)
            };

            saleItems.Add(saleItem);
        }

        // Apply arbitrary discount (e.g. Subtotal 1853, Discount 73 => Grand Total 1780)
        var discount = Math.Max(0m, request.DiscountAmount);
        var grandTotal = Math.Max(0m, calculatedSubtotal - discount);

        decimal amountPaid = request.AmountPaid;
        decimal changeReturned = 0m;
        decimal udhaarAmount = 0m;

        if (request.PaymentMethod == PaymentMethod.UdhaarCredit)
        {
            udhaarAmount = grandTotal;
            amountPaid = 0m;
        }
        else if (amountPaid >= grandTotal)
        {
            changeReturned = amountPaid - grandTotal;
        }
        else
        {
            udhaarAmount = grandTotal - amountPaid;
        }

        var profit = grandTotal - calculatedTotalCost;

        var sale = new Sale
        {
            Id = saleId,
            StoreId = storeId,
            InvoiceNumber = invoiceNumber,
            CustomerId = request.CustomerId,
            Subtotal = calculatedSubtotal,
            DiscountAmount = discount,
            GrandTotal = grandTotal,
            PaymentMethod = request.PaymentMethod,
            PaymentStatus = udhaarAmount > 0 ? (amountPaid > 0 ? PaymentStatus.Pending : PaymentStatus.Pending) : PaymentStatus.Success,
            AmountPaid = amountPaid,
            ChangeReturned = changeReturned,
            UdhaarAmount = udhaarAmount,
            TotalCostAmount = calculatedTotalCost,
            ProfitAmount = profit,
            CashierUserId = cashierUserId,
            CreatedAt = DateTime.UtcNow,
            Items = saleItems
        };

        _db.Sales.Add(sale);

        // Record Payment
        if (amountPaid > 0)
        {
            _db.Payments.Add(new Payment
            {
                SaleId = saleId,
                CustomerId = request.CustomerId,
                PaymentMethod = request.PaymentMethod,
                Status = PaymentStatus.Success,
                Amount = Math.Min(amountPaid, grandTotal),
                ReferenceNumber = request.PaymentReference,
                ReceivedByUserId = cashierUserId,
                CreatedAt = DateTime.UtcNow
            });
        }

        // Update Customer Ledger if Udhaar
        if (udhaarAmount > 0)
        {
            if (!request.CustomerId.HasValue)
            {
                throw new InvalidOperationException("Customer must be selected for Udhaar (Credit) purchases.");
            }

            var customer = await _db.Customers.FindAsync(request.CustomerId.Value);
            if (customer == null)
            {
                throw new InvalidOperationException($"Customer ID {request.CustomerId} not found.");
            }

            customer.CurrentBalance += udhaarAmount;

            _db.CustomerLedgers.Add(new CustomerLedger
            {
                CustomerId = customer.Id,
                TransactionType = LedgerTransactionType.SaleDebit,
                Amount = udhaarAmount,
                BalanceAfter = customer.CurrentBalance,
                ReferenceId = invoiceNumber,
                Notes = $"Credit purchase - Invoice {invoiceNumber}",
                CreatedByUserId = cashierUserId,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _db.SaveChangesAsync();
        await transaction.CommitAsync();

        return (await GetSaleByIdAsync(saleId))!;
    }

    public async Task<SaleDto?> GetSaleByIdAsync(Guid saleId, int? storeId = null)
    {
        var query = _db.Sales
            .Include(s => s.Customer)
            .Include(s => s.Items)
            .Where(s => s.Id == saleId);

        if (storeId.HasValue && storeId.Value > 0)
        {
            query = query.Where(s => s.StoreId == storeId.Value);
        }

        var sale = await query.AsNoTracking().FirstOrDefaultAsync();

        if (sale == null) return null;

        var cashier = await _db.Users.FindAsync(sale.CashierUserId);

        return new SaleDto(
            sale.Id,
            sale.InvoiceNumber,
            sale.CustomerId,
            sale.Customer?.Name,
            sale.Subtotal,
            sale.DiscountAmount,
            sale.GrandTotal,
            sale.PaymentMethod.ToString(),
            sale.PaymentStatus.ToString(),
            sale.AmountPaid,
            sale.ChangeReturned,
            sale.UdhaarAmount,
            sale.TotalCostAmount,
            sale.ProfitAmount,
            cashier?.FullName ?? "Counter Cashier",
            sale.CreatedAt,
            sale.Items.Select(i => new SaleItemDto(
                i.Id,
                i.ProductId,
                i.ProductName,
                i.QuantityEntered,
                i.UnitEntered,
                i.QuantityInBaseUnit,
                i.SellingPricePerMajorUnit,
                i.LineTotal,
                i.AllocatedCostTotal
            )).ToList()
        );
    }

    public async Task<List<SaleDto>> GetRecentSalesAsync(int limit = 50, int? storeId = null)
    {
        var query = _db.Sales
            .Include(s => s.Customer)
            .Include(s => s.Items)
            .AsQueryable();

        if (storeId.HasValue && storeId.Value > 0)
        {
            query = query.Where(s => s.StoreId == storeId.Value);
        }

        var sales = await query
            .OrderByDescending(s => s.CreatedAt)
            .Take(limit)
            .AsNoTracking()
            .ToListAsync();

        var users = await _db.Users.ToDictionaryAsync(u => u.Id, u => u.FullName);

        return sales.Select(s => new SaleDto(
            s.Id,
            s.InvoiceNumber,
            s.CustomerId,
            s.Customer?.Name,
            s.Subtotal,
            s.DiscountAmount,
            s.GrandTotal,
            s.PaymentMethod.ToString(),
            s.PaymentStatus.ToString(),
            s.AmountPaid,
            s.ChangeReturned,
            s.UdhaarAmount,
            s.TotalCostAmount,
            s.ProfitAmount,
            users.TryGetValue(s.CashierUserId, out var name) ? name : "Cashier",
            s.CreatedAt,
            s.Items.Select(i => new SaleItemDto(
                i.Id,
                i.ProductId,
                i.ProductName,
                i.QuantityEntered,
                i.UnitEntered,
                i.QuantityInBaseUnit,
                i.SellingPricePerMajorUnit,
                i.LineTotal,
                i.AllocatedCostTotal
            )).ToList()
        )).ToList();
    }
}
