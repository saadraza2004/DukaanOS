using DukaanOS.API.Core.Entities;
using DukaanOS.API.Core.Enums;
using DukaanOS.API.Data;
using DukaanOS.API.DTOs;
using Microsoft.EntityFrameworkCore;

namespace DukaanOS.API.Services;

public interface ICustomerService
{
    Task<List<CustomerDto>> GetCustomersAsync(string? search = null, int? storeId = null);
    Task<CustomerDto?> GetCustomerByIdAsync(int id, int? storeId = null);
    Task<List<CustomerDto>> GetTopDebtorsAsync(int limit = 10, int? storeId = null);
    Task<CustomerDto> CreateCustomerAsync(CreateCustomerRequest request, int storeId = 1);
    Task<List<CustomerLedgerDto>> GetCustomerLedgerAsync(int customerId);
    Task<CustomerDto> RecordPaymentAsync(int customerId, CustomerPaymentRequest request, int userId);
}

public class CustomerService : ICustomerService
{
    private readonly DukaanDbContext _db;

    public CustomerService(DukaanDbContext db)
    {
        _db = db;
    }

    public async Task<List<CustomerDto>> GetCustomersAsync(string? search = null, int? storeId = null)
    {
        var query = _db.Customers
            .Where(c => c.IsActive)
            .AsNoTracking();

        if (storeId.HasValue && storeId.Value > 0)
        {
            query = query.Where(c => c.StoreId == storeId.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(c => c.Name.ToLower().Contains(term) || (c.Phone != null && c.Phone.Contains(term)));
        }

        var list = await query
            .OrderByDescending(c => c.CurrentBalance)
            .ThenBy(c => c.Name)
            .ToListAsync();

        return list.Select(c => new CustomerDto(
            c.Id,
            c.Name,
            c.Phone,
            c.Address,
            c.MaxCreditLimit,
            c.CurrentBalance,
            c.Notes,
            c.IsActive,
            c.CreatedAt
        )).ToList();
    }

    public async Task<CustomerDto?> GetCustomerByIdAsync(int id, int? storeId = null)
    {
        var query = _db.Customers.Where(c => c.Id == id);
        if (storeId.HasValue && storeId.Value > 0)
        {
            query = query.Where(c => c.StoreId == storeId.Value);
        }

        var c = await query.FirstOrDefaultAsync();
        if (c == null) return null;

        return new CustomerDto(
            c.Id,
            c.Name,
            c.Phone,
            c.Address,
            c.MaxCreditLimit,
            c.CurrentBalance,
            c.Notes,
            c.IsActive,
            c.CreatedAt
        );
    }

    public async Task<List<CustomerDto>> GetTopDebtorsAsync(int limit = 10, int? storeId = null)
    {
        var query = _db.Customers
            .Where(c => c.IsActive && c.CurrentBalance > 0);

        if (storeId.HasValue && storeId.Value > 0)
        {
            query = query.Where(c => c.StoreId == storeId.Value);
        }

        var list = await query
            .OrderByDescending(c => c.CurrentBalance)
            .Take(limit)
            .AsNoTracking()
            .ToListAsync();

        return list.Select(c => new CustomerDto(
            c.Id,
            c.Name,
            c.Phone,
            c.Address,
            c.MaxCreditLimit,
            c.CurrentBalance,
            c.Notes,
            c.IsActive,
            c.CreatedAt
        )).ToList();
    }

    public async Task<CustomerDto> CreateCustomerAsync(CreateCustomerRequest request, int storeId = 1)
    {
        var customer = new Customer
        {
            StoreId = storeId,
            Name = request.Name.Trim(),
            Phone = request.Phone?.Trim(),
            Address = request.Address?.Trim(),
            MaxCreditLimit = request.MaxCreditLimit > 0 ? request.MaxCreditLimit : 50000m,
            CurrentBalance = 0m,
            Notes = request.Notes,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _db.Customers.Add(customer);
        await _db.SaveChangesAsync();

        return new CustomerDto(
            customer.Id,
            customer.Name,
            customer.Phone,
            customer.Address,
            customer.MaxCreditLimit,
            customer.CurrentBalance,
            customer.Notes,
            customer.IsActive,
            customer.CreatedAt
        );
    }

    public async Task<List<CustomerLedgerDto>> GetCustomerLedgerAsync(int customerId)
    {
        var entries = await _db.CustomerLedgers
            .Where(l => l.CustomerId == customerId)
            .OrderByDescending(l => l.CreatedAt)
            .AsNoTracking()
            .ToListAsync();

        var users = await _db.Users.ToDictionaryAsync(u => u.Id, u => u.FullName);

        return entries.Select(l => new CustomerLedgerDto(
            l.Id,
            l.CustomerId,
            l.TransactionType.ToString(),
            l.Amount,
            l.BalanceAfter,
            l.ReferenceId,
            l.Notes,
            users.TryGetValue(l.CreatedByUserId, out var name) ? name : "Staff",
            l.CreatedAt
        )).ToList();
    }

    public async Task<CustomerDto> RecordPaymentAsync(int customerId, CustomerPaymentRequest request, int userId)
    {
        using var transaction = await _db.Database.BeginTransactionAsync();

        var customer = await _db.Customers.FindAsync(customerId)
            ?? throw new ArgumentException($"Customer ID {customerId} not found.");

        if (request.Amount <= 0)
        {
            throw new ArgumentException("Payment amount must be greater than zero.");
        }

        customer.CurrentBalance -= request.Amount;

        var payment = new Payment
        {
            CustomerId = customer.Id,
            PaymentMethod = request.PaymentMethod,
            Amount = request.Amount,
            ReferenceNumber = request.ReferenceNumber,
            Status = PaymentStatus.Success,
            Notes = request.Notes,
            ReceivedByUserId = userId,
            CreatedAt = DateTime.UtcNow
        };
        _db.Payments.Add(payment);

        _db.CustomerLedgers.Add(new CustomerLedger
        {
            CustomerId = customer.Id,
            TransactionType = LedgerTransactionType.PaymentCredit,
            Amount = request.Amount,
            BalanceAfter = customer.CurrentBalance,
            ReferenceId = $"PAY-{payment.Id}",
            Notes = $"Payment received via {request.PaymentMethod}. Ref: {request.ReferenceNumber}",
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
        await transaction.CommitAsync();

        return (await GetCustomerByIdAsync(customerId))!;
    }
}
