using DukaanOS.API.Core.Entities;
using DukaanOS.API.Core.Enums;
using DukaanOS.API.Core.Services;
using DukaanOS.API.Data;
using DukaanOS.API.DTOs;
using Microsoft.EntityFrameworkCore;

namespace DukaanOS.API.Services;

public interface IInventoryService
{
    Task<List<InventoryBatchDto>> GetBatchesAsync(int? productId = null, int? storeId = null);
    Task<InventoryBatchDto> CreateBatchAsync(CreateBatchRequest request, int userId, int storeId = 1);
    Task<bool> AdjustStockAsync(StockAdjustmentRequest request, int userId);
    Task<List<InventoryMovementDto>> GetMovementsAsync(int? productId = null, int limit = 100, int? storeId = null);
}

public class InventoryService : IInventoryService
{
    private readonly DukaanDbContext _db;

    public InventoryService(DukaanDbContext db)
    {
        _db = db;
    }

    public async Task<List<InventoryBatchDto>> GetBatchesAsync(int? productId = null, int? storeId = null)
    {
        var query = _db.InventoryBatches
            .Include(b => b.Product)
            .Include(b => b.Supplier)
            .AsNoTracking();

        if (storeId.HasValue && storeId.Value > 0)
        {
            query = query.Where(b => b.StoreId == storeId.Value);
        }

        if (productId.HasValue)
        {
            query = query.Where(b => b.ProductId == productId.Value);
        }

        var batches = await query
            .OrderByDescending(b => b.ReceivedDate)
            .ToListAsync();

        return batches.Select(b =>
        {
            var majorRemaining = b.Product != null
                ? UnitConverter.ConvertToMajorUnit(b.Product, b.RemainingQuantityBaseUnit)
                : b.RemainingQuantityBaseUnit;

            return new InventoryBatchDto(
                b.Id,
                b.BatchNumber,
                b.ProductId,
                b.Product?.Name ?? "Unknown",
                b.Supplier?.Name,
                b.InitialQuantityBaseUnit,
                b.RemainingQuantityBaseUnit,
                majorRemaining,
                b.CostPricePerMajorUnit,
                b.ReceivedDate,
                b.ExpiryDate,
                b.Notes,
                b.IsExhausted
            );
        }).ToList();
    }

    public async Task<InventoryBatchDto> CreateBatchAsync(CreateBatchRequest request, int userId, int storeId = 1)
    {
        using var transaction = await _db.Database.BeginTransactionAsync();

        var product = await _db.Products.FindAsync(request.ProductId)
            ?? throw new ArgumentException($"Product ID {request.ProductId} not found.");

        var quantityBaseUnit = request.QuantityMajorUnit * product.BaseUnitRatio;

        var batch = new InventoryBatch
        {
            StoreId = storeId,
            BatchNumber = string.IsNullOrWhiteSpace(request.BatchNumber)
                ? $"BATCH-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..6].ToUpper()}"
                : request.BatchNumber.Trim(),
            ProductId = product.Id,
            SupplierId = request.SupplierId,
            InitialQuantityBaseUnit = quantityBaseUnit,
            RemainingQuantityBaseUnit = quantityBaseUnit,
            CostPricePerMajorUnit = request.CostPricePerMajorUnit,
            ReceivedDate = DateTime.UtcNow,
            ExpiryDate = request.ExpiryDate,
            Notes = request.Notes
        };

        _db.InventoryBatches.Add(batch);

        // Update product stock
        product.CurrentStockBaseUnit += quantityBaseUnit;
        product.UpdatedAt = DateTime.UtcNow;

        // Record movement
        _db.InventoryMovements.Add(new InventoryMovement
        {
            Batch = batch,
            ProductId = product.Id,
            MovementType = MovementType.StockIn,
            QuantityBaseUnit = quantityBaseUnit,
            BalanceAfterBaseUnit = product.CurrentStockBaseUnit,
            ReferenceId = batch.BatchNumber,
            Reason = "Supplier shipment received",
            Notes = request.Notes,
            UserId = userId,
            CreatedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
        await transaction.CommitAsync();

        var majorRemaining = UnitConverter.ConvertToMajorUnit(product, batch.RemainingQuantityBaseUnit);
        return new InventoryBatchDto(
            batch.Id,
            batch.BatchNumber,
            batch.ProductId,
            product.Name,
            null,
            batch.InitialQuantityBaseUnit,
            batch.RemainingQuantityBaseUnit,
            majorRemaining,
            batch.CostPricePerMajorUnit,
            batch.ReceivedDate,
            batch.ExpiryDate,
            batch.Notes,
            batch.IsExhausted
        );
    }

    public async Task<bool> AdjustStockAsync(StockAdjustmentRequest request, int userId)
    {
        using var transaction = await _db.Database.BeginTransactionAsync();

        var product = await _db.Products.FindAsync(request.ProductId);
        if (product == null) return false;

        var deltaBaseUnit = request.QuantityMajorUnit * product.BaseUnitRatio;

        // Record adjustment entity
        var adjustment = new StockAdjustment
        {
            ProductId = product.Id,
            BatchId = request.BatchId,
            QuantityBaseUnit = deltaBaseUnit,
            Reason = request.Reason,
            Notes = request.Notes,
            UserId = userId,
            CreatedAt = DateTime.UtcNow
        };
        _db.StockAdjustments.Add(adjustment);

        // If batch specified, adjust that batch
        if (request.BatchId.HasValue)
        {
            var batch = await _db.InventoryBatches.FindAsync(request.BatchId.Value);
            if (batch != null)
            {
                batch.RemainingQuantityBaseUnit += deltaBaseUnit;
                if (batch.RemainingQuantityBaseUnit < 0) batch.RemainingQuantityBaseUnit = 0;
            }
        }

        // Adjust running product stock
        product.CurrentStockBaseUnit += deltaBaseUnit;
        if (product.CurrentStockBaseUnit < 0) product.CurrentStockBaseUnit = 0;
        product.UpdatedAt = DateTime.UtcNow;

        var movementType = request.Reason switch
        {
            AdjustmentReason.Damaged => MovementType.Damaged,
            AdjustmentReason.Expired => MovementType.Expired,
            AdjustmentReason.Lost => MovementType.Lost,
            AdjustmentReason.SupplierReturn => MovementType.SupplierReturn,
            _ => MovementType.ManualCorrection
        };

        _db.InventoryMovements.Add(new InventoryMovement
        {
            BatchId = request.BatchId,
            ProductId = product.Id,
            MovementType = movementType,
            QuantityBaseUnit = deltaBaseUnit,
            BalanceAfterBaseUnit = product.CurrentStockBaseUnit,
            ReferenceId = $"ADJ-{adjustment.Id}",
            Reason = request.Reason.ToString(),
            Notes = request.Notes,
            UserId = userId,
            CreatedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
        await transaction.CommitAsync();

        return true;
    }

    public async Task<List<InventoryMovementDto>> GetMovementsAsync(int? productId = null, int limit = 100, int? storeId = null)
    {
        var query = _db.InventoryMovements
            .Include(m => m.Product)
            .AsNoTracking();

        if (storeId.HasValue && storeId.Value > 0)
        {
            query = query.Where(m => m.Product != null && m.Product.StoreId == storeId.Value);
        }

        if (productId.HasValue)
        {
            query = query.Where(m => m.ProductId == productId.Value);
        }

        var movements = await query
            .OrderByDescending(m => m.CreatedAt)
            .Take(limit)
            .ToListAsync();

        var users = await _db.Users.ToDictionaryAsync(u => u.Id, u => u.FullName);

        return movements.Select(m =>
        {
            var majorQty = m.Product != null
                ? UnitConverter.ConvertToMajorUnit(m.Product, m.QuantityBaseUnit)
                : m.QuantityBaseUnit;

            var majorBalance = m.Product != null
                ? UnitConverter.ConvertToMajorUnit(m.Product, m.BalanceAfterBaseUnit)
                : m.BalanceAfterBaseUnit;

            return new InventoryMovementDto(
                m.Id,
                m.ProductId,
                m.Product?.Name ?? "Unknown",
                m.MovementType.ToString(),
                m.QuantityBaseUnit,
                majorQty,
                majorBalance,
                m.ReferenceId,
                m.Reason,
                m.Notes,
                users.TryGetValue(m.UserId, out var name) ? name : "Staff",
                m.CreatedAt
            );
        }).ToList();
    }
}
