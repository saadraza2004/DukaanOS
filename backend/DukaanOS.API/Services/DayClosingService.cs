using DukaanOS.API.Core.Entities;
using DukaanOS.API.Core.Enums;
using DukaanOS.API.Data;
using DukaanOS.API.DTOs;
using Microsoft.EntityFrameworkCore;

namespace DukaanOS.API.Services;

public interface IDayClosingService
{
    Task<DayClosingSummaryDto> GetTodayClosingSummaryAsync(decimal openingCash = 0m, int? storeId = null);
    Task<DayClosing> SubmitDayClosingAsync(SubmitDayClosingRequest request, int userId, int storeId = 1);
    Task<List<DayClosing>> GetClosingHistoryAsync(int limit = 30, int? storeId = null);
}

public class DayClosingService : IDayClosingService
{
    private readonly DukaanDbContext _db;

    public DayClosingService(DukaanDbContext db)
    {
        _db = db;
    }

    public async Task<DayClosingSummaryDto> GetTodayClosingSummaryAsync(decimal openingCash = 0m, int? storeId = null)
    {
        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);

        var salesQuery = _db.Sales
            .Where(s => s.CreatedAt >= today && s.CreatedAt < tomorrow);

        if (storeId.HasValue && storeId.Value > 0)
        {
            salesQuery = salesQuery.Where(s => s.StoreId == storeId.Value);
        }

        var sales = await salesQuery.AsNoTracking().ToListAsync();

        var cashSales = sales.Where(s => s.PaymentMethod == PaymentMethod.Cash).Sum(s => s.AmountPaid);
        var digitalSales = sales.Where(s => s.PaymentMethod != PaymentMethod.Cash && s.PaymentMethod != PaymentMethod.UdhaarCredit).Sum(s => s.AmountPaid);
        var creditSales = sales.Sum(s => s.UdhaarAmount);
        var totalSales = sales.Sum(s => s.GrandTotal);
        var totalDiscounts = sales.Sum(s => s.DiscountAmount);
        var totalProfit = sales.Sum(s => s.ProfitAmount);
        var txCount = sales.Count;

        // Customer Cash payments collected today (Wusooli from earlier credit)
        var paymentsQuery = _db.Payments
            .Include(p => p.Customer)
            .Where(p => p.CustomerId != null && p.SaleId == null && p.PaymentMethod == PaymentMethod.Cash && p.CreatedAt >= today && p.CreatedAt < tomorrow);

        if (storeId.HasValue && storeId.Value > 0)
        {
            paymentsQuery = paymentsQuery.Where(p => p.Customer != null && p.Customer.StoreId == storeId.Value);
        }

        var customerRecoveries = await paymentsQuery.SumAsync(p => p.Amount);

        var expectedCash = openingCash + cashSales + customerRecoveries;

        return new DayClosingSummaryDto(
            DateOnly.FromDateTime(today),
            openingCash,
            cashSales,
            digitalSales,
            creditSales,
            customerRecoveries,
            totalSales,
            totalDiscounts,
            totalProfit,
            txCount,
            expectedCash
        );
    }

    public async Task<DayClosing> SubmitDayClosingAsync(SubmitDayClosingRequest request, int userId, int storeId = 1)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var summary = await GetTodayClosingSummaryAsync(request.OpeningCash, storeId);

        var existing = await _db.DayClosings.FirstOrDefaultAsync(dc => dc.ClosingDate == today && dc.StoreId == storeId);
        if (existing != null)
        {
            existing.OpeningCash = request.OpeningCash;
            existing.CashSales = summary.CashSales;
            existing.DigitalSales = summary.DigitalSales;
            existing.CreditSales = summary.CreditSales;
            existing.CustomerCashRecoveries = summary.CustomerCashRecoveries;
            existing.TotalSales = summary.TotalSales;
            existing.TotalDiscounts = summary.TotalDiscounts;
            existing.TotalProfit = summary.TotalProfit;
            existing.TransactionCount = summary.TransactionCount;
            existing.ExpectedCash = summary.ExpectedCash;
            existing.ActualCashCounted = request.ActualCashCounted;
            existing.ShortageOrExcess = request.ActualCashCounted - summary.ExpectedCash;
            existing.Notes = request.Notes;
            existing.ClosedByUserId = userId;
            existing.ClosedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return existing;
        }

        var closing = new DayClosing
        {
            StoreId = storeId,
            ClosingDate = today,
            OpenedAt = DateTime.UtcNow.Date,
            ClosedAt = DateTime.UtcNow,
            OpeningCash = request.OpeningCash,
            CashSales = summary.CashSales,
            DigitalSales = summary.DigitalSales,
            CreditSales = summary.CreditSales,
            CustomerCashRecoveries = summary.CustomerCashRecoveries,
            TotalSales = summary.TotalSales,
            TotalDiscounts = summary.TotalDiscounts,
            TotalProfit = summary.TotalProfit,
            TransactionCount = summary.TransactionCount,
            ExpectedCash = summary.ExpectedCash,
            ActualCashCounted = request.ActualCashCounted,
            ShortageOrExcess = request.ActualCashCounted - summary.ExpectedCash,
            Notes = request.Notes,
            ClosedByUserId = userId,
            CreatedAt = DateTime.UtcNow
        };

        _db.DayClosings.Add(closing);
        await _db.SaveChangesAsync();

        return closing;
    }

    public async Task<List<DayClosing>> GetClosingHistoryAsync(int limit = 30, int? storeId = null)
    {
        var query = _db.DayClosings.AsQueryable();
        if (storeId.HasValue && storeId.Value > 0)
        {
            query = query.Where(c => c.StoreId == storeId.Value);
        }

        return await query
            .OrderByDescending(c => c.ClosingDate)
            .Take(limit)
            .AsNoTracking()
            .ToListAsync();
    }
}
