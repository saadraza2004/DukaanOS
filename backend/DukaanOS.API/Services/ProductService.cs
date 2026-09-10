using DukaanOS.API.Core.Entities;
using DukaanOS.API.Core.Enums;
using DukaanOS.API.Core.Services;
using DukaanOS.API.Data;
using DukaanOS.API.DTOs;
using Microsoft.EntityFrameworkCore;

namespace DukaanOS.API.Services;

public interface IProductService
{
    Task<List<ProductDto>> GetProductsAsync(string? search = null, int? categoryId = null, bool lowStockOnly = false, int? storeId = null);
    Task<ProductDto?> GetProductByIdAsync(int id, int? storeId = null);
    Task<ProductDto> CreateProductAsync(CreateProductRequest request, int userId, int storeId = 1);
    Task<ProductDto?> UpdateSellingPriceAsync(int productId, decimal newPrice, int userId, int? storeId = null);
    Task<List<PriceHistoryDto>> GetPriceHistoryAsync(int productId);
    Task<List<Category>> GetCategoriesAsync(int? storeId = null);
}

public class ProductService : IProductService
{
    private readonly DukaanDbContext _db;

    public ProductService(DukaanDbContext db)
    {
        _db = db;
    }

    public async Task<List<ProductDto>> GetProductsAsync(string? search = null, int? categoryId = null, bool lowStockOnly = false, int? storeId = null)
    {
        var query = _db.Products
            .Include(p => p.Category)
            .Where(p => p.IsActive)
            .AsNoTracking();

        if (storeId.HasValue && storeId.Value > 0)
        {
            query = query.Where(p => p.StoreId == storeId.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(p =>
                p.Name.ToLower().Contains(term) ||
                p.UrduName.Contains(term) ||
                (p.RomanUrduName != null && p.RomanUrduName.ToLower().Contains(term)) ||
                (p.Barcode != null && p.Barcode.Contains(term)) ||
                (p.Sku != null && p.Sku.ToLower().Contains(term))
            );
        }

        if (categoryId.HasValue && categoryId.Value > 0)
        {
            query = query.Where(p => p.CategoryId == categoryId.Value);
        }

        var list = await query.ToListAsync();

        var dtos = list.Select(p =>
        {
            var majorStock = UnitConverter.ConvertToMajorUnit(p, p.CurrentStockBaseUnit);
            return new ProductDto(
                p.Id,
                p.Sku,
                p.Barcode,
                p.Name,
                p.UrduName,
                p.RomanUrduName ?? string.Empty,
                p.CategoryId,
                p.Category?.Name ?? "General",
                p.UnitType.ToString(),
                p.BaseUnitRatio,
                p.CurrentSellingPrice,
                p.MinStockThreshold,
                p.CurrentStockBaseUnit,
                majorStock,
                p.IsActive
            );
        });

        if (lowStockOnly)
        {
            dtos = dtos.Where(p => p.CurrentStockMajorUnit <= p.MinStockThreshold);
        }

        return dtos.OrderBy(p => p.Name).ToList();
    }

    public async Task<ProductDto?> GetProductByIdAsync(int id, int? storeId = null)
    {
        var query = _db.Products
            .Include(x => x.Category)
            .Where(x => x.Id == id);

        if (storeId.HasValue && storeId.Value > 0)
        {
            query = query.Where(x => x.StoreId == storeId.Value);
        }

        var p = await query.FirstOrDefaultAsync();
        if (p == null) return null;

        var majorStock = UnitConverter.ConvertToMajorUnit(p, p.CurrentStockBaseUnit);
        return new ProductDto(
            p.Id,
            p.Sku,
            p.Barcode,
            p.Name,
            p.UrduName,
            p.RomanUrduName ?? string.Empty,
            p.CategoryId,
            p.Category?.Name ?? "General",
            p.UnitType.ToString(),
            p.BaseUnitRatio,
            p.CurrentSellingPrice,
            p.MinStockThreshold,
            p.CurrentStockBaseUnit,
            majorStock,
            p.IsActive
        );
    }

    public async Task<ProductDto> CreateProductAsync(CreateProductRequest request, int userId, int storeId = 1)
    {
        using var transaction = await _db.Database.BeginTransactionAsync();

        var baseStock = request.InitialStockMajorUnit * request.BaseUnitRatio;

        var product = new Product
        {
            StoreId = storeId,
            Sku = request.Sku,
            Barcode = request.Barcode,
            Name = request.Name.Trim(),
            UrduName = request.UrduName.Trim(),
            RomanUrduName = request.RomanUrduName?.Trim() ?? string.Empty,
            CategoryId = request.CategoryId,
            UnitType = request.UnitType,
            BaseUnitRatio = request.BaseUnitRatio,
            CurrentSellingPrice = request.CurrentSellingPrice,
            MinStockThreshold = request.MinStockThreshold,
            CurrentStockBaseUnit = baseStock,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _db.Products.Add(product);
        await _db.SaveChangesAsync();

        // If initial stock provided, create the first batch
        if (request.InitialStockMajorUnit > 0)
        {
            var batchNumber = $"BATCH-{DateTime.UtcNow:yyyyMMdd}-{product.Id}";
            var batch = new InventoryBatch
            {
                StoreId = storeId,
                BatchNumber = batchNumber,
                ProductId = product.Id,
                InitialQuantityBaseUnit = baseStock,
                RemainingQuantityBaseUnit = baseStock,
                CostPricePerMajorUnit = request.InitialCostPricePerMajorUnit,
                ReceivedDate = DateTime.UtcNow,
                Notes = "Initial product setup batch"
            };

            _db.InventoryBatches.Add(batch);

            _db.InventoryMovements.Add(new InventoryMovement
            {
                Batch = batch,
                ProductId = product.Id,
                MovementType = MovementType.StockIn,
                QuantityBaseUnit = baseStock,
                BalanceAfterBaseUnit = baseStock,
                ReferenceId = batchNumber,
                Reason = "Initial stock creation",
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            });
        }

        // Record initial price history
        _db.PriceHistories.Add(new PriceHistory
        {
            ProductId = product.Id,
            OldPrice = request.CurrentSellingPrice,
            NewPrice = request.CurrentSellingPrice,
            ChangedAt = DateTime.UtcNow,
            ChangedByUserId = userId
        });

        await _db.SaveChangesAsync();
        await transaction.CommitAsync();

        return (await GetProductByIdAsync(product.Id, storeId))!;
    }

    public async Task<ProductDto?> UpdateSellingPriceAsync(int productId, decimal newPrice, int userId, int? storeId = null)
    {
        var query = _db.Products.Where(p => p.Id == productId);
        if (storeId.HasValue && storeId.Value > 0)
        {
            query = query.Where(p => p.StoreId == storeId.Value);
        }

        var product = await query.FirstOrDefaultAsync();
        if (product == null) return null;

        if (product.CurrentSellingPrice != newPrice)
        {
            _db.PriceHistories.Add(new PriceHistory
            {
                ProductId = product.Id,
                OldPrice = product.CurrentSellingPrice,
                NewPrice = newPrice,
                ChangedAt = DateTime.UtcNow,
                ChangedByUserId = userId
            });

            product.CurrentSellingPrice = newPrice;
            product.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
        }

        return await GetProductByIdAsync(productId, storeId);
    }

    public async Task<List<PriceHistoryDto>> GetPriceHistoryAsync(int productId)
    {
        var histories = await _db.PriceHistories
            .Where(h => h.ProductId == productId)
            .OrderByDescending(h => h.ChangedAt)
            .ToListAsync();

        var users = await _db.Users.ToDictionaryAsync(u => u.Id, u => u.FullName);

        return histories.Select(h => new PriceHistoryDto(
            h.Id,
            h.ProductId,
            h.OldPrice,
            h.NewPrice,
            h.ChangedAt,
            users.TryGetValue(h.ChangedByUserId, out var name) ? name : "Admin"
        )).ToList();
    }

    public async Task<List<Category>> GetCategoriesAsync(int? storeId = null)
    {
        var query = _db.Categories.AsQueryable();
        if (storeId.HasValue && storeId.Value > 0)
        {
            query = query.Where(c => c.StoreId == storeId.Value || c.StoreId == 1);
        }

        return await query
            .OrderBy(c => c.DisplayOrder)
            .AsNoTracking()
            .ToListAsync();
    }
}
