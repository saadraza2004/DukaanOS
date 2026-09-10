using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using DukaanOS.API.Core.Enums;

namespace DukaanOS.API.Core.Entities;

public class Store
{
    public int Id { get; set; }
    [Required, MaxLength(150)]
    public string Name { get; set; } = string.Empty;
    [MaxLength(100)]
    public string? OwnerName { get; set; }
    [MaxLength(50)]
    public string? Phone { get; set; }
    [MaxLength(250)]
    public string? Address { get; set; }
    [MaxLength(50)]
    public string? City { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public List<User> Users { get; set; } = new();
}

public class User
{
    public int Id { get; set; }
    public int StoreId { get; set; } = 1;
    public Store? Store { get; set; }
    [Required, MaxLength(50)]
    public string Username { get; set; } = string.Empty;
    [Required, MaxLength(100)]
    public string FullName { get; set; } = string.Empty;
    [Required]
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.CASHIER;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Category
{
    public int Id { get; set; }
    public int StoreId { get; set; } = 1;
    public Store? Store { get; set; }
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    [MaxLength(100)]
    public string UrduName { get; set; } = string.Empty;
    [MaxLength(250)]
    public string? Description { get; set; }
    public int DisplayOrder { get; set; } = 0;
    public List<Product> Products { get; set; } = new();
}

public class Product
{
    public int Id { get; set; }
    public int StoreId { get; set; } = 1;
    public Store? Store { get; set; }
    [MaxLength(50)]
    public string? Sku { get; set; }
    [MaxLength(50)]
    public string? Barcode { get; set; }
    [Required, MaxLength(150)]
    public string Name { get; set; } = string.Empty;
    [MaxLength(150)]
    public string UrduName { get; set; } = string.Empty;
    [MaxLength(150)]
    public string RomanUrduName { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public Category? Category { get; set; }

    public UnitType UnitType { get; set; } = UnitType.KG;

    // Conversion factor to internal base unit:
    // KG: 1000 (Base Unit = Gram)
    // GRAM: 1 (Base Unit = Gram)
    // LITRE: 1000 (Base Unit = ML)
    // ML: 1 (Base Unit = ML)
    // PIECE: 1 (Base Unit = Piece)
    // PACK: 1 (Base Unit = Pack)
    [Column(TypeName = "decimal(18,4)")]
    public decimal BaseUnitRatio { get; set; } = 1000m;

    // Selling price in Major Unit (e.g. Rs. 350 per 1 KG)
    [Column(TypeName = "decimal(18,2)")]
    public decimal CurrentSellingPrice { get; set; }

    // Minimum alert threshold in Major Unit
    [Column(TypeName = "decimal(18,3)")]
    public decimal MinStockThreshold { get; set; } = 5m;

    // Running cached stock in Base Units (Grams, ML, Pieces)
    [Column(TypeName = "decimal(18,4)")]
    public decimal CurrentStockBaseUnit { get; set; } = 0m;

    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public List<InventoryBatch> Batches { get; set; } = new();
    public List<PriceHistory> PriceHistories { get; set; } = new();
    public List<InventoryMovement> Movements { get; set; } = new();
}

public class PriceHistory
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public Product? Product { get; set; }
    [Column(TypeName = "decimal(18,2)")]
    public decimal OldPrice { get; set; }
    [Column(TypeName = "decimal(18,2)")]
    public decimal NewPrice { get; set; }
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
    public int ChangedByUserId { get; set; }
}

public class Supplier
{
    public int Id { get; set; }
    public int StoreId { get; set; } = 1;
    public Store? Store { get; set; }
    [Required, MaxLength(120)]
    public string Name { get; set; } = string.Empty;
    [MaxLength(100)]
    public string? ContactPerson { get; set; }
    [MaxLength(20)]
    public string? Phone { get; set; }
    [MaxLength(200)]
    public string? Address { get; set; }
    public string? Notes { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public List<InventoryBatch> Batches { get; set; } = new();
}

public class InventoryBatch
{
    public int Id { get; set; }
    public int StoreId { get; set; } = 1;
    public Store? Store { get; set; }
    [Required, MaxLength(60)]
    public string BatchNumber { get; set; } = string.Empty;
    public int ProductId { get; set; }
    public Product? Product { get; set; }
    public int? SupplierId { get; set; }
    public Supplier? Supplier { get; set; }

    // Initial and remaining quantities in internal base unit (grams, ml, pieces)
    [Column(TypeName = "decimal(18,4)")]
    public decimal InitialQuantityBaseUnit { get; set; }
    [Column(TypeName = "decimal(18,4)")]
    public decimal RemainingQuantityBaseUnit { get; set; }

    // Cost price per Major Unit (e.g. Rs. 300 per KG)
    [Column(TypeName = "decimal(18,2)")]
    public decimal CostPricePerMajorUnit { get; set; }

    public DateTime ReceivedDate { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiryDate { get; set; }
    public string? Notes { get; set; }
    public bool IsExhausted => RemainingQuantityBaseUnit <= 0;
}

public class InventoryMovement
{
    public int Id { get; set; }
    public int? BatchId { get; set; }
    public InventoryBatch? Batch { get; set; }
    public int ProductId { get; set; }
    public Product? Product { get; set; }
    public MovementType MovementType { get; set; }

    // Delta quantity in base unit (positive = addition, negative = reduction)
    [Column(TypeName = "decimal(18,4)")]
    public decimal QuantityBaseUnit { get; set; }

    // Balance after this movement in base unit
    [Column(TypeName = "decimal(18,4)")]
    public decimal BalanceAfterBaseUnit { get; set; }

    [MaxLength(100)]
    public string ReferenceId { get; set; } = string.Empty; // e.g. Sale GUID, Receipt #, Adjustment #
    public string? Reason { get; set; }
    public string? Notes { get; set; }
    public int UserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class StockAdjustment
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public Product? Product { get; set; }
    public int? BatchId { get; set; }
    public InventoryBatch? Batch { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal QuantityBaseUnit { get; set; } // negative for reduction, positive for count adjustment
    public AdjustmentReason Reason { get; set; }
    public string? Notes { get; set; }
    public int UserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class StockReceipt
{
    public int Id { get; set; }
    public int? SupplierId { get; set; }
    public Supplier? Supplier { get; set; }
    [Required, MaxLength(50)]
    public string ReceiptNumber { get; set; } = string.Empty;
    [MaxLength(50)]
    public string? InvoiceNumber { get; set; }
    public DateTime InvoiceDate { get; set; } = DateTime.UtcNow;
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalCost { get; set; }
    public string? Notes { get; set; }
    public string? InvoiceImageUrl { get; set; }
    public int CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public List<StockReceiptItem> Items { get; set; } = new();
}

public class StockReceiptItem
{
    public int Id { get; set; }
    public int StockReceiptId { get; set; }
    public StockReceipt? StockReceipt { get; set; }
    public int ProductId { get; set; }
    public Product? Product { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal QuantityBaseUnit { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal CostPricePerMajorUnit { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal LineTotalCost { get; set; }

    [MaxLength(60)]
    public string BatchNumber { get; set; } = string.Empty;
}

public class Customer
{
    public int Id { get; set; }
    public int StoreId { get; set; } = 1;
    public Store? Store { get; set; }
    [Required, MaxLength(120)]
    public string Name { get; set; } = string.Empty;
    [MaxLength(20)]
    public string? Phone { get; set; }
    [MaxLength(200)]
    public string? Address { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal MaxCreditLimit { get; set; } = 50000m;

    // Current outstanding balance (positive = customer owes us money)
    [Column(TypeName = "decimal(18,2)")]
    public decimal CurrentBalance { get; set; } = 0m;

    public string? Notes { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public List<CustomerLedger> LedgerEntries { get; set; } = new();
}

public class CustomerLedger
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public Customer? Customer { get; set; }
    public LedgerTransactionType TransactionType { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal BalanceAfter { get; set; }

    [MaxLength(100)]
    public string? ReferenceId { get; set; } // Sale Id, Payment Id
    public string? Notes { get; set; }
    public int CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Sale
{
    // Client-generated UUID for offline idempotency and zero duplicates
    [Key]
    public Guid Id { get; set; }

    public int StoreId { get; set; } = 1;
    public Store? Store { get; set; }

    [Required, MaxLength(50)]
    public string InvoiceNumber { get; set; } = string.Empty;

    public int? CustomerId { get; set; }
    public Customer? Customer { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Subtotal { get; set; }

    // Arbitrary rupee discount (e.g. Rs. 73)
    [Column(TypeName = "decimal(18,2)")]
    public decimal DiscountAmount { get; set; } = 0m;

    [Column(TypeName = "decimal(18,2)")]
    public decimal GrandTotal { get; set; }

    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.Cash;
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Success;

    [Column(TypeName = "decimal(18,2)")]
    public decimal AmountPaid { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal ChangeReturned { get; set; }

    // Portion added to customer's udhaar balance
    [Column(TypeName = "decimal(18,2)")]
    public decimal UdhaarAmount { get; set; }

    // Accurate FIFO cost sum across batches for true profit calculation
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalCostAmount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal ProfitAmount { get; set; }

    public int CashierUserId { get; set; }
    public bool IsOfflineSynced { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<SaleItem> Items { get; set; } = new();
    public List<Payment> Payments { get; set; } = new();
}

public class SaleItem
{
    public int Id { get; set; }
    public Guid SaleId { get; set; }
    public Sale? Sale { get; set; }

    public int ProductId { get; set; }
    public Product? Product { get; set; }

    [Required, MaxLength(150)]
    public string ProductName { get; set; } = string.Empty;

    // Human input quantity (e.g. 350 for 350g, or 1.25 for 1.25kg)
    [Column(TypeName = "decimal(18,4)")]
    public decimal QuantityEntered { get; set; }

    [Required, MaxLength(20)]
    public string UnitEntered { get; set; } = string.Empty; // "GRAM", "KG", "PIECE", etc.

    // Normalized quantity in Base Unit (e.g. 350 grams)
    [Column(TypeName = "decimal(18,4)")]
    public decimal QuantityInBaseUnit { get; set; }

    // Price charged per major unit at the exact time of sale (never recalculated)
    [Column(TypeName = "decimal(18,2)")]
    public decimal SellingPricePerMajorUnit { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal LineTotal { get; set; }

    // Sum of cost allocated for this line item via FIFO
    [Column(TypeName = "decimal(18,2)")]
    public decimal AllocatedCostTotal { get; set; }

    // Detailed JSON recording batch deduction breakdown
    public string? BatchAllocationJson { get; set; }
}

public class Payment
{
    public int Id { get; set; }
    public Guid? SaleId { get; set; }
    public Sale? Sale { get; set; }

    public int? CustomerId { get; set; }
    public Customer? Customer { get; set; }

    public PaymentMethod PaymentMethod { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Success;

    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    [MaxLength(100)]
    public string? ReferenceNumber { get; set; } // e.g. Easypaisa / JazzCash TID

    public string? Notes { get; set; }
    public int ReceivedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class DayClosing
{
    public int Id { get; set; }
    public int StoreId { get; set; } = 1;
    public Store? Store { get; set; }
    public DateOnly ClosingDate { get; set; }
    public DateTime OpenedAt { get; set; }
    public DateTime ClosedAt { get; set; } = DateTime.UtcNow;

    [Column(TypeName = "decimal(18,2)")]
    public decimal OpeningCash { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal CashSales { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal DigitalSales { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal CreditSales { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal CustomerCashRecoveries { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalSales { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalDiscounts { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalProfit { get; set; }

    public int TransactionCount { get; set; }

    // Expected in drawer = OpeningCash + CashSales + CustomerCashRecoveries
    [Column(TypeName = "decimal(18,2)")]
    public decimal ExpectedCash { get; set; }

    // Physical cash counted by owner
    [Column(TypeName = "decimal(18,2)")]
    public decimal ActualCashCounted { get; set; }

    // Difference: ActualCashCounted - ExpectedCash (negative = Shortage, positive = Excess)
    [Column(TypeName = "decimal(18,2)")]
    public decimal ShortageOrExcess { get; set; }

    public string? Notes { get; set; }
    public int ClosedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class AuditLog
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    [Required, MaxLength(100)]
    public string Action { get; set; } = string.Empty;
    [Required, MaxLength(100)]
    public string EntityName { get; set; } = string.Empty;
    [MaxLength(100)]
    public string? EntityId { get; set; }
    public string? DetailsJson { get; set; }
    [MaxLength(50)]
    public string? IpAddress { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
