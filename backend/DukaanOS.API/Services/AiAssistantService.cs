using System.Text.Json;
using DukaanOS.API.Core.Entities;
using DukaanOS.API.Core.Services;
using DukaanOS.API.Data;
using DukaanOS.API.DTOs;
using Microsoft.EntityFrameworkCore;

namespace DukaanOS.API.Services;

public interface IAiAssistantService
{
    Task<AiChatResponse> AskAssistantAsync(AiChatRequest request);
}

public class AiAssistantService : IAiAssistantService
{
    private readonly DukaanDbContext _db;
    private readonly IConfiguration _config;

    public AiAssistantService(DukaanDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public async Task<AiChatResponse> AskAssistantAsync(AiChatRequest request)
    {
        var prompt = request.Message.Trim().ToLowerInvariant();

        // Safe deterministic tool-calling matching engine
        // Supports natural English and Roman Urdu questions:
        // "How much did we sell today?" / "Aaj ki bikri kitni hui?"
        // "What were our top products?" / "Top selling products konsi hain?"
        // "How much does Ahmed owe?" / "Haji Abdul Rehman ka udhaar kitna hai?"
        // "Which products are low in stock?" / "Konsi cheezein khatam hone wali hain?"
        // "When did price of rice change?" / "Chawal ka rate kab barha tha?"
        // "How much profit did we make?" / "Aaj ka munafa / profit kitna hai?"
        // "How much discount did we give?" / "Kitna discount diya gaya?"

        if (prompt.Contains("today") && (prompt.Contains("sale") || prompt.Contains("bikri") || prompt.Contains("sell") || prompt.Contains("kamaai")))
        {
            var data = await GetTodaySalesToolAsync();
            var answer = $"Aaj ki total bikri (Today's Sales) **Rs. {data.TotalSales:N2}** hai ({data.TransactionCount} transactions).\n" +
                         $"- Cash Sales: Rs. {data.CashSales:N2}\n" +
                         $"- Digital Sales: Rs. {data.DigitalSales:N2}\n" +
                         $"- Credit (Udhaar) Sales: Rs. {data.CreditSales:N2}\n" +
                         $"- Total Discounts: Rs. {data.TotalDiscounts:N2}";
            return new AiChatResponse(answer, "getTodaySales", data);
        }

        if (prompt.Contains("profit") || prompt.Contains("munafa") || prompt.Contains("bachat"))
        {
            var data = await GetProfitSummaryToolAsync();
            var answer = $"Store Profit Summary (Amdani / Munafa):\n" +
                         $"- Today's Gross Profit: **Rs. {data.TodayProfit:N2}**\n" +
                         $"- Last 7 Days Profit: **Rs. {data.Last7DaysProfit:N2}**\n" +
                         $"- Last 30 Days Profit: **Rs. {data.Last30DaysProfit:N2}**\n" +
                         $"*(Cost is calculated using exact FIFO stock-batch allocation)*";
            return new AiChatResponse(answer, "getProfitSummary", data);
        }

        if (prompt.Contains("top") || prompt.Contains("best") || prompt.Contains("zyada biknay") || prompt.Contains("ziada bikne"))
        {
            var data = await GetTopProductsToolAsync();
            var items = string.Join("\n", data.Select((p, idx) =>
                $"{idx + 1}. **{p.Name}** ({p.UrduName}): {p.QuantitySold:N2} {p.Unit} sold | Revenue: Rs. {p.Revenue:N2} | Profit: Rs. {p.Profit:N2}"));
            var answer = $"Top Selling Products (Is maheenay ki top cheezein):\n\n{items}";
            return new AiChatResponse(answer, "getTopProducts", data);
        }

        if (prompt.Contains("low") || prompt.Contains("stock") || prompt.Contains("khatam") || prompt.Contains("kam hai") || prompt.Contains("short"))
        {
            var data = await GetLowStockProductsToolAsync();
            if (!data.Any())
            {
                return new AiChatResponse("Mashallah, koi product low stock nahi hai. Tamam items ka stock threshold se ooper hai.", "getLowStockProducts", data);
            }

            var items = string.Join("\n", data.Select((p, idx) =>
                $"{idx + 1}. **{p.Name}** ({p.UrduName}): Remaining **{p.CurrentStock:N2} {p.Unit}** (Min Alert: {p.MinThreshold} {p.Unit})"));
            var answer = $"Warning: Yeh products low-stock hain aur jaldi mangwane ki zaroorat hai:\n\n{items}";
            return new AiChatResponse(answer, "getLowStockProducts", data);
        }

        if (prompt.Contains("owe") || prompt.Contains("udhaar") || prompt.Contains("balance") || prompt.Contains("khata") || prompt.Contains("dena hai") || prompt.Contains("baqi"))
        {
            // Search for customer name in query
            var data = await GetCustomerBalanceToolAsync(prompt);
            if (data.FoundCustomer != null)
            {
                var c = data.FoundCustomer;
                var answer = $"Customer: **{c.Name}**\n" +
                             $"- Phone: {c.Phone ?? "N/A"}\n" +
                             $"- Current Outstanding Udhaar: **Rs. {c.CurrentBalance:N2}**\n" +
                             $"- Credit Limit: Rs. {c.MaxCreditLimit:N2}\n" +
                             (c.CurrentBalance > 0 ? "⚠️ Is customer se payment recover karni hai." : "✅ Customer ka koi udhaar baqi nahi hai.");
                return new AiChatResponse(answer, "getCustomerBalance", data);
            }

            var topDebtors = await _db.Customers
                .Where(c => c.IsActive && c.CurrentBalance > 0)
                .OrderByDescending(c => c.CurrentBalance)
                .Take(5)
                .Select(c => $"- **{c.Name}**: Rs. {c.CurrentBalance:N2}")
                .ToListAsync();

            var debtorList = string.Join("\n", topDebtors);
            var debtorAnswer = $"Top Outstanding Udhaar Balances:\n\n{debtorList}\n\n*Kisi makhsoos customer ka naam likhein jaisay 'Haji Abdul Rehman ka udhaar kitna hai?'*";
            return new AiChatResponse(debtorAnswer, "getCustomerBalance", topDebtors);
        }

        if (prompt.Contains("discount") || prompt.Contains("chhoot"))
        {
            var data = await GetDiscountSummaryToolAsync();
            var answer = $"Discount Summary:\n" +
                         $"- Today's Total Discounts: **Rs. {data.TodayDiscounts:N2}**\n" +
                         $"- Last 7 Days Discounts: **Rs. {data.WeekDiscounts:N2}**\n" +
                         $"- Last 30 Days Discounts: **Rs. {data.MonthDiscounts:N2}**";
            return new AiChatResponse(answer, "getDiscountSummary", data);
        }

        if (prompt.Contains("price") || prompt.Contains("rate") || prompt.Contains("qeemat"))
        {
            var data = await GetPriceHistoryToolAsync(prompt);
            if (data.Any())
            {
                var pName = data.First().ProductName;
                var changes = string.Join("\n", data.Select(h => $"- {h.ChangedAt:dd MMM yyyy}: Rs. {h.OldPrice:N2} ➔ **Rs. {h.NewPrice:N2}** (by {h.ChangedBy})"));
                var answer = $"Price history for **{pName}**:\n\n{changes}";
                return new AiChatResponse(answer, "getPriceHistory", data);
            }

            return new AiChatResponse("Mera database mein is item ki price changes ka record nahi mila. Product ka sahi naam likhein (e.g. 'Rice' ya 'Chawal').", "getPriceHistory", null);
        }

        // Generic fallback with live metrics
        var overview = await GetTodaySalesToolAsync();
        return new AiChatResponse(
            $"Main DukaanOS AI Assistant hoon. Main aapke dukaan ke real database se live hisaab deta hoon.\n\n" +
            $"**Aaj ka Khulasa (Today's Quick Snapshot):**\n" +
            $"- Sales: Rs. {overview.TotalSales:N2} ({overview.TransactionCount} bills)\n" +
            $"- Profit: Rs. {overview.TodayProfit:N2}\n\n" +
            $"Aap mujh se pooch saktay hain:\n" +
            $"1. *'Aaj ki sales aur profit kitna hai?'*\n" +
            $"2. *'Konsay products low stock hain?'*\n" +
            $"3. *'Top 5 products konsi hain?'*\n" +
            $"4. *'Haji Abdul Rehman ka udhaar kitna hai?'*\n" +
            $"5. *'Rice ki price kab barhi thi?'*",
            "getSummary",
            overview
        );
    }

    private async Task<TodaySalesToolResult> GetTodaySalesToolAsync()
    {
        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);

        var sales = await _db.Sales
            .Where(s => s.CreatedAt >= today && s.CreatedAt < tomorrow)
            .AsNoTracking()
            .ToListAsync();

        return new TodaySalesToolResult(
            sales.Sum(s => s.GrandTotal),
            sales.Sum(s => s.ProfitAmount),
            sales.Count,
            sales.Where(s => s.PaymentMethod == Core.Enums.PaymentMethod.Cash).Sum(s => s.AmountPaid),
            sales.Where(s => s.PaymentMethod != Core.Enums.PaymentMethod.Cash && s.PaymentMethod != Core.Enums.PaymentMethod.UdhaarCredit).Sum(s => s.AmountPaid),
            sales.Sum(s => s.UdhaarAmount),
            sales.Sum(s => s.DiscountAmount)
        );
    }

    private async Task<ProfitSummaryToolResult> GetProfitSummaryToolAsync()
    {
        var today = DateTime.UtcNow.Date;
        var sevenDaysAgo = today.AddDays(-6);
        var thirtyDaysAgo = today.AddDays(-29);

        var sales = await _db.Sales
            .Where(s => s.CreatedAt >= thirtyDaysAgo)
            .AsNoTracking()
            .ToListAsync();

        var todayProfit = sales.Where(s => s.CreatedAt >= today).Sum(s => s.ProfitAmount);
        var weekProfit = sales.Where(s => s.CreatedAt >= sevenDaysAgo).Sum(s => s.ProfitAmount);
        var monthProfit = sales.Sum(s => s.ProfitAmount);

        return new ProfitSummaryToolResult(todayProfit, weekProfit, monthProfit);
    }

    private async Task<List<TopProductToolItem>> GetTopProductsToolAsync()
    {
        var thirtyDaysAgo = DateTime.UtcNow.Date.AddDays(-30);
        var items = await _db.SaleItems
            .Include(i => i.Product)
            .Where(i => i.Sale != null && i.Sale.CreatedAt >= thirtyDaysAgo)
            .AsNoTracking()
            .ToListAsync();

        return items
            .GroupBy(i => i.ProductId)
            .Select(g =>
            {
                var prod = g.First().Product;
                var totalBase = g.Sum(x => x.QuantityInBaseUnit);
                var major = prod != null ? UnitConverter.ConvertToMajorUnit(prod, totalBase) : totalBase;
                var rev = g.Sum(x => x.LineTotal);
                var cost = g.Sum(x => x.AllocatedCostTotal);

                return new TopProductToolItem(
                    prod?.Name ?? g.First().ProductName,
                    prod?.UrduName ?? "",
                    major,
                    prod?.UnitType.ToString() ?? "UNIT",
                    rev,
                    rev - cost
                );
            })
            .OrderByDescending(x => x.Revenue)
            .Take(5)
            .ToList();
    }

    private async Task<List<LowStockToolItem>> GetLowStockProductsToolAsync()
    {
        var products = await _db.Products
            .Where(p => p.IsActive)
            .AsNoTracking()
            .ToListAsync();

        return products
            .Select(p => new LowStockToolItem(
                p.Name,
                p.UrduName,
                UnitConverter.ConvertToMajorUnit(p, p.CurrentStockBaseUnit),
                p.MinStockThreshold,
                p.UnitType.ToString()
            ))
            .Where(x => x.CurrentStock <= x.MinThreshold)
            .OrderBy(x => x.CurrentStock)
            .ToList();
    }

    private async Task<CustomerBalanceToolResult> GetCustomerBalanceToolAsync(string query)
    {
        var customers = await _db.Customers
            .Where(c => c.IsActive)
            .AsNoTracking()
            .ToListAsync();

        var match = customers.FirstOrDefault(c =>
            query.Contains(c.Name.ToLower()) ||
            c.Name.ToLower().Split(' ').Any(part => part.Length > 2 && query.Contains(part)));

        return new CustomerBalanceToolResult(match);
    }

    private async Task<DiscountSummaryToolResult> GetDiscountSummaryToolAsync()
    {
        var today = DateTime.UtcNow.Date;
        var sevenDaysAgo = today.AddDays(-6);
        var thirtyDaysAgo = today.AddDays(-29);

        var sales = await _db.Sales
            .Where(s => s.CreatedAt >= thirtyDaysAgo)
            .AsNoTracking()
            .ToListAsync();

        var todayDisc = sales.Where(s => s.CreatedAt >= today).Sum(s => s.DiscountAmount);
        var weekDisc = sales.Where(s => s.CreatedAt >= sevenDaysAgo).Sum(s => s.DiscountAmount);
        var monthDisc = sales.Sum(s => s.DiscountAmount);

        return new DiscountSummaryToolResult(todayDisc, weekDisc, monthDisc);
    }

    private async Task<List<PriceChangeToolItem>> GetPriceHistoryToolAsync(string query)
    {
        var products = await _db.Products.Where(p => p.IsActive).ToListAsync();
        var targetProduct = products.FirstOrDefault(p =>
            query.Contains(p.Name.ToLower()) ||
            query.Contains(p.UrduName) ||
            (query.Contains("rice") && p.Name.ToLower().Contains("rice")) ||
            (query.Contains("chawal") && p.Name.ToLower().Contains("rice")) ||
            (query.Contains("cheeni") && p.Name.ToLower().Contains("sugar")) ||
            (query.Contains("sugar") && p.Name.ToLower().Contains("sugar")) ||
            (query.Contains("oil") && p.Name.ToLower().Contains("oil")) ||
            (query.Contains("tel") && p.Name.ToLower().Contains("oil")) ||
            (query.Contains("ghee") && p.Name.ToLower().Contains("ghee")) ||
            (query.Contains("atta") && p.Name.ToLower().Contains("atta")) ||
            (query.Contains("daal") && p.Name.ToLower().Contains("daal")));

        if (targetProduct == null) return new List<PriceChangeToolItem>();

        var history = await _db.PriceHistories
            .Where(h => h.ProductId == targetProduct.Id)
            .OrderByDescending(h => h.ChangedAt)
            .ToListAsync();

        var users = await _db.Users.ToDictionaryAsync(u => u.Id, u => u.FullName);

        return history.Select(h => new PriceChangeToolItem(
            targetProduct.Name,
            h.OldPrice,
            h.NewPrice,
            h.ChangedAt,
            users.TryGetValue(h.ChangedByUserId, out var name) ? name : "Admin"
        )).ToList();
    }
}

// Tool output records
public record TodaySalesToolResult(decimal TotalSales, decimal TodayProfit, int TransactionCount, decimal CashSales, decimal DigitalSales, decimal CreditSales, decimal TotalDiscounts);
public record ProfitSummaryToolResult(decimal TodayProfit, decimal Last7DaysProfit, decimal Last30DaysProfit);
public record TopProductToolItem(string Name, string UrduName, decimal QuantitySold, string Unit, decimal Revenue, decimal Profit);
public record LowStockToolItem(string Name, string UrduName, decimal CurrentStock, decimal MinThreshold, string Unit);
public record CustomerBalanceToolResult(Customer? FoundCustomer);
public record DiscountSummaryToolResult(decimal TodayDiscounts, decimal WeekDiscounts, decimal MonthDiscounts);
public record PriceChangeToolItem(string ProductName, decimal OldPrice, decimal NewPrice, DateTime ChangedAt, string ChangedBy);
