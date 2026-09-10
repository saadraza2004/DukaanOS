using DukaanOS.API.Core.Enums;
using DukaanOS.API.Core.Services;
using DukaanOS.API.Data;
using DukaanOS.API.DTOs;
using Microsoft.EntityFrameworkCore;

namespace DukaanOS.API.Services;

public interface IDashboardService
{
    Task<DashboardStatsDto> GetStatsAsync(int? storeId = null);
    Task<DashboardChartsDto> GetChartsAsync(int? storeId = null);
}

public class DashboardService : IDashboardService
{
    private readonly DukaanDbContext _db;

    public DashboardService(DukaanDbContext db)
    {
        _db = db;
    }

    public async Task<DashboardStatsDto> GetStatsAsync(int? storeId = null)
    {
        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);

        var salesQuery = _db.Sales
            .Where(s => s.CreatedAt >= today && s.CreatedAt < tomorrow);

        if (storeId.HasValue && storeId.Value > 0)
        {
            salesQuery = salesQuery.Where(s => s.StoreId == storeId.Value);
        }

        var todaySalesList = await salesQuery.AsNoTracking().ToListAsync();

        var todaySales = todaySalesList.Sum(s => s.GrandTotal);
        var todayProfit = todaySalesList.Sum(s => s.ProfitAmount);
        var todayTxCount = todaySalesList.Count;
        var avgBasket = todayTxCount > 0 ? Math.Round(todaySales / todayTxCount, 2) : 0m;

        var cashSales = todaySalesList
            .Where(s => s.PaymentMethod == PaymentMethod.Cash)
            .Sum(s => s.AmountPaid);

        var digitalSales = todaySalesList
            .Where(s => s.PaymentMethod == PaymentMethod.Easypaisa ||
                        s.PaymentMethod == PaymentMethod.JazzCash ||
                        s.PaymentMethod == PaymentMethod.BankTransfer ||
                        s.PaymentMethod == PaymentMethod.Card)
            .Sum(s => s.AmountPaid);

        var creditSales = todaySalesList.Sum(s => s.UdhaarAmount);

        var custQuery = _db.Customers
            .Where(c => c.IsActive && c.CurrentBalance > 0);

        if (storeId.HasValue && storeId.Value > 0)
        {
            custQuery = custQuery.Where(c => c.StoreId == storeId.Value);
        }

        var totalOutstandingUdhaar = await custQuery.SumAsync(c => c.CurrentBalance);

        var prodQuery = _db.Products
            .Where(p => p.IsActive);

        if (storeId.HasValue && storeId.Value > 0)
        {
            prodQuery = prodQuery.Where(p => p.StoreId == storeId.Value);
        }

        var products = await prodQuery.AsNoTracking().ToListAsync();

        var lowStockCount = products.Count(p =>
            UnitConverter.ConvertToMajorUnit(p, p.CurrentStockBaseUnit) <= p.MinStockThreshold);

        return new DashboardStatsDto(
            todaySales,
            todayProfit,
            todayTxCount,
            avgBasket,
            cashSales,
            digitalSales,
            creditSales,
            totalOutstandingUdhaar,
            lowStockCount
        );
    }

    public async Task<DashboardChartsDto> GetChartsAsync(int? storeId = null)
    {
        var sevenDaysAgo = DateTime.UtcNow.Date.AddDays(-6);

        var salesQuery = _db.Sales
            .Where(s => s.CreatedAt >= sevenDaysAgo);

        if (storeId.HasValue && storeId.Value > 0)
        {
            salesQuery = salesQuery.Where(s => s.StoreId == storeId.Value);
        }

        var salesLast7Days = await salesQuery.AsNoTracking().ToListAsync();

        var dailyTrend = new List<ChartPointDto>();
        for (int i = 0; i < 7; i++)
        {
            var date = sevenDaysAgo.AddDays(i);
            var nextDate = date.AddDays(1);
            var daySales = salesLast7Days.Where(s => s.CreatedAt >= date && s.CreatedAt < nextDate).ToList();

            dailyTrend.Add(new ChartPointDto(
                date.ToString("ddd dd MMM"),
                daySales.Sum(s => s.GrandTotal),
                daySales.Sum(s => s.ProfitAmount)
            ));
        }

        // Top 5 Products by Revenue
        var itemsQuery = _db.SaleItems
            .Include(si => si.Product)
            .Where(si => si.Sale != null && si.Sale.CreatedAt >= DateTime.UtcNow.Date.AddDays(-30));

        if (storeId.HasValue && storeId.Value > 0)
        {
            itemsQuery = itemsQuery.Where(si => si.Sale!.StoreId == storeId.Value);
        }

        var saleItems = await itemsQuery.AsNoTracking().ToListAsync();

        var topSellingProducts = saleItems
            .GroupBy(si => si.ProductId)
            .Select(g =>
            {
                var prod = g.First().Product;
                var totalRev = g.Sum(x => x.LineTotal);
                var totalCost = g.Sum(x => x.AllocatedCostTotal);
                var totalBaseQty = g.Sum(x => x.QuantityInBaseUnit);
                var majorQty = prod != null ? UnitConverter.ConvertToMajorUnit(prod, totalBaseQty) : totalBaseQty;

                return new TopProductDto(
                    g.Key,
                    prod?.Name ?? g.First().ProductName,
                    prod?.UrduName ?? "",
                    majorQty,
                    prod?.UnitType.ToString() ?? "UNIT",
                    totalRev,
                    totalRev - totalCost
                );
            })
            .OrderByDescending(p => p.Revenue)
            .Take(5)
            .ToList();

        // Low stock alerts
        var prodQuery = _db.Products
            .Where(p => p.IsActive);

        if (storeId.HasValue && storeId.Value > 0)
        {
            prodQuery = prodQuery.Where(p => p.StoreId == storeId.Value);
        }

        var allProducts = await prodQuery.AsNoTracking().ToListAsync();

        var lowStockAlerts = allProducts
            .Select(p =>
            {
                var currentMajor = UnitConverter.ConvertToMajorUnit(p, p.CurrentStockBaseUnit);
                return new LowStockItemDto(
                    p.Id,
                    p.Name,
                    p.UrduName,
                    currentMajor,
                    p.MinStockThreshold,
                    p.UnitType.ToString()
                );
            })
            .Where(x => x.CurrentStockMajorUnit <= x.MinStockThreshold)
            .OrderBy(x => x.CurrentStockMajorUnit)
            .Take(6)
            .ToList();

        return new DashboardChartsDto(
            dailyTrend,
            dailyTrend, // weekly
            topSellingProducts,
            lowStockAlerts
        );
    }
}
