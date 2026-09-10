using DukaanOS.API.Core.Entities;
using DukaanOS.API.Core.Enums;
using Microsoft.EntityFrameworkCore;

namespace DukaanOS.API.Data;

public class DukaanDbContext : DbContext
{
    public DukaanDbContext(DbContextOptions<DukaanDbContext> options) : base(options)
    {
    }

    public DbSet<Store> Stores => Set<Store>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<PriceHistory> PriceHistories => Set<PriceHistory>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<InventoryBatch> InventoryBatches => Set<InventoryBatch>();
    public DbSet<InventoryMovement> InventoryMovements => Set<InventoryMovement>();
    public DbSet<StockAdjustment> StockAdjustments => Set<StockAdjustment>();
    public DbSet<StockReceipt> StockReceipts => Set<StockReceipt>();
    public DbSet<StockReceiptItem> StockReceiptItems => Set<StockReceiptItem>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<CustomerLedger> CustomerLedgers => Set<CustomerLedger>();
    public DbSet<Sale> Sales => Set<Sale>();
    public DbSet<SaleItem> SaleItems => Set<SaleItem>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<DayClosing> DayClosings => Set<DayClosing>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Store
        modelBuilder.Entity<Store>()
            .HasIndex(s => s.Name);

        // User
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Username)
            .IsUnique();
        modelBuilder.Entity<User>()
            .HasIndex(u => u.StoreId);

        // Product
        modelBuilder.Entity<Product>()
            .HasIndex(p => p.StoreId);
        modelBuilder.Entity<Product>()
            .HasIndex(p => p.Barcode);
        modelBuilder.Entity<Product>()
            .HasIndex(p => p.Name);
        modelBuilder.Entity<Product>()
            .HasIndex(p => p.CategoryId);

        // Inventory Batch
        modelBuilder.Entity<InventoryBatch>()
            .HasIndex(b => b.BatchNumber);
        modelBuilder.Entity<InventoryBatch>()
            .HasIndex(b => new { b.ProductId, b.RemainingQuantityBaseUnit });

        // Sale
        modelBuilder.Entity<Sale>()
            .HasIndex(s => s.StoreId);
        modelBuilder.Entity<Sale>()
            .HasIndex(s => s.InvoiceNumber)
            .IsUnique();
        modelBuilder.Entity<Sale>()
            .HasIndex(s => s.CreatedAt);
        modelBuilder.Entity<Sale>()
            .HasIndex(s => s.CustomerId);

        // SaleItem
        modelBuilder.Entity<SaleItem>()
            .HasOne(si => si.Sale)
            .WithMany(s => s.Items)
            .HasForeignKey(si => si.SaleId)
            .OnDelete(DeleteBehavior.Cascade);

        // Customer
        modelBuilder.Entity<Customer>()
            .HasIndex(c => c.StoreId);
        modelBuilder.Entity<Customer>()
            .HasIndex(c => c.Phone);
        modelBuilder.Entity<Customer>()
            .HasIndex(c => c.CurrentBalance);

        // Customer Ledger
        modelBuilder.Entity<CustomerLedger>()
            .HasOne(cl => cl.Customer)
            .WithMany(c => c.LedgerEntries)
            .HasForeignKey(cl => cl.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        // DayClosing
        modelBuilder.Entity<DayClosing>()
            .HasIndex(dc => dc.ClosingDate)
            .IsUnique();

        // Convert Enums to Strings for human-readable DB tables
        modelBuilder.Entity<User>()
            .Property(u => u.Role)
            .HasConversion<string>();

        modelBuilder.Entity<Product>()
            .Property(p => p.UnitType)
            .HasConversion<string>();

        modelBuilder.Entity<InventoryMovement>()
            .Property(m => m.MovementType)
            .HasConversion<string>();

        modelBuilder.Entity<StockAdjustment>()
            .Property(a => a.Reason)
            .HasConversion<string>();

        modelBuilder.Entity<Sale>()
            .Property(s => s.PaymentMethod)
            .HasConversion<string>();

        modelBuilder.Entity<Sale>()
            .Property(s => s.PaymentStatus)
            .HasConversion<string>();

        modelBuilder.Entity<CustomerLedger>()
            .Property(l => l.TransactionType)
            .HasConversion<string>();

        modelBuilder.Entity<Payment>()
            .Property(p => p.PaymentMethod)
            .HasConversion<string>();

        modelBuilder.Entity<Payment>()
            .Property(p => p.Status)
            .HasConversion<string>();
    }
}

