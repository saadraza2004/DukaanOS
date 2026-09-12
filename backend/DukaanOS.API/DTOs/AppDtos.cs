using DukaanOS.API.Core.Enums;

namespace DukaanOS.API.DTOs;

// Auth
public record LoginRequest(string Username, string Password);
public record RegisterStoreRequest(string StoreName, string OwnerFullName, string? Phone, string? City, string Username, string Password);
public record LoginResponse(string Token, UserDto User);
public record UserDto(int Id, string Username, string FullName, string Role, int StoreId, string StoreName);
public record StoreDto(int Id, string Name, string? OwnerName, string? Phone, string? Address, string? City);

// Products
public record ProductDto(
    int Id,
    string? Sku,
    string? Barcode,
    string Name,
    string UrduName,
    string RomanUrduName,
    int CategoryId,
    string CategoryName,
    string UnitType,
    decimal BaseUnitRatio,
    decimal CurrentSellingPrice,
    decimal MinStockThreshold,
    decimal CurrentStockBaseUnit,
    decimal CurrentStockMajorUnit,
    bool IsActive
);

public record CreateProductRequest(
    string? Sku,
    string? Barcode,
    string Name,
    string UrduName,
    string? RomanUrduName,
    int CategoryId,
    UnitType UnitType,
    decimal BaseUnitRatio,
    decimal CurrentSellingPrice,
    decimal MinStockThreshold,
    decimal InitialStockMajorUnit,
    decimal InitialCostPricePerMajorUnit
);

public record UpdateProductPriceRequest(decimal NewPrice);

public record PriceHistoryDto(
    int Id,
    int ProductId,
    decimal OldPrice,
    decimal NewPrice,
    DateTime ChangedAt,
    string ChangedBy
);

// Inventory
public record InventoryBatchDto(
    int Id,
    string BatchNumber,
    int ProductId,
    string ProductName,
    string? SupplierName,
    decimal InitialQuantityBaseUnit,
    decimal RemainingQuantityBaseUnit,
    decimal RemainingQuantityMajorUnit,
    decimal CostPricePerMajorUnit,
    DateTime ReceivedDate,
    DateTime? ExpiryDate,
    string? Notes,
    bool IsExhausted
);

public record CreateBatchRequest(
    int ProductId,
    int? SupplierId,
    string BatchNumber,
    decimal QuantityMajorUnit,
    decimal CostPricePerMajorUnit,
    DateTime? ExpiryDate,
    string? Notes
);

public record StockAdjustmentRequest(
    int ProductId,
    int? BatchId,
    decimal QuantityMajorUnit, // positive for increase, negative for decrease
    AdjustmentReason Reason,
    string? Notes
);

public record InventoryMovementDto(
    int Id,
    int ProductId,
    string ProductName,
    string MovementType,
    decimal QuantityBaseUnit,
    decimal QuantityMajorUnit,
    decimal BalanceAfterMajorUnit,
    string ReferenceId,
    string? Reason,
    string? Notes,
    string UserFullName,
    DateTime CreatedAt
);

// Sales & POS
public record SaleItemRequest(
    int ProductId,
    decimal QuantityEntered, // e.g. 350 for 350g, or 1.25 for 1.25kg, or 2 for 2 packs
    string UnitEntered       // "GRAM", "KG", "PIECE", "PACK", "LITRE", "ML"
);

public record CreateSaleRequest(
    Guid? ClientSaleId,          // Client-generated UUID for offline idempotency
    int? CustomerId,
    List<SaleItemRequest> Items,
    decimal DiscountAmount,      // Arbitrary rupee discount, e.g. 73
    PaymentMethod PaymentMethod,
    decimal AmountPaid,
    string? PaymentReference,
    string? Notes
);

public record SaleDto(
    Guid Id,
    string InvoiceNumber,
    int? CustomerId,
    string? CustomerName,
    decimal Subtotal,
    decimal DiscountAmount,
    decimal GrandTotal,
    string PaymentMethod,
    string PaymentStatus,
    decimal AmountPaid,
    decimal ChangeReturned,
    decimal UdhaarAmount,
    decimal TotalCostAmount,
    decimal ProfitAmount,
    string CashierName,
    DateTime CreatedAt,
    List<SaleItemDto> Items
);

public record SaleItemDto(
    int Id,
    int ProductId,
    string ProductName,
    decimal QuantityEntered,
    string UnitEntered,
    decimal QuantityInBaseUnit,
    decimal SellingPricePerMajorUnit,
    decimal LineTotal,
    decimal AllocatedCostTotal
);

// Customers & Udhaar
public record CustomerDto(
    int Id,
    string Name,
    string? Phone,
    string? Address,
    decimal MaxCreditLimit,
    decimal CurrentBalance,
    string? Notes,
    bool IsActive,
    DateTime CreatedAt
);

public record CreateCustomerRequest(
    string Name,
    string? Phone,
    string? Address,
    decimal MaxCreditLimit,
    string? Notes
);

public record CustomerPaymentRequest(
    decimal Amount,
    PaymentMethod PaymentMethod,
    string? ReferenceNumber,
    string? Notes
);

public record CustomerLedgerDto(
    int Id,
    int CustomerId,
    string TransactionType,
    decimal Amount,
    decimal BalanceAfter,
    string? ReferenceId,
    string? Notes,
    string CreatedBy,
    DateTime CreatedAt
);

// Dashboard
public record DashboardStatsDto(
    decimal TodaySales,
    decimal TodayProfit,
    int TodayTransactions,
    decimal AverageBasket,
    decimal CashSales,
    decimal DigitalSales,
    decimal CreditSales,
    decimal TotalOutstandingUdhaar,
    int LowStockItemCount
);

public record ChartPointDto(string Label, decimal Revenue, decimal Profit);
public record TopProductDto(int ProductId, string Name, string UrduName, decimal QuantitySoldMajorUnit, string Unit, decimal Revenue, decimal Profit);
public record LowStockItemDto(int ProductId, string Name, string UrduName, decimal CurrentStockMajorUnit, decimal MinStockThreshold, string Unit);

public record DashboardChartsDto(
    List<ChartPointDto> DailyTrend,
    List<ChartPointDto> WeeklyTrend,
    List<TopProductDto> TopSellingProducts,
    List<LowStockItemDto> LowStockAlerts
);

// Day Closing
public record DayClosingSummaryDto(
    DateOnly ClosingDate,
    decimal OpeningCash,
    decimal CashSales,
    decimal DigitalSales,
    decimal CreditSales,
    decimal CustomerCashRecoveries,
    decimal TotalSales,
    decimal TotalDiscounts,
    decimal TotalProfit,
    int TransactionCount,
    decimal ExpectedCash
);

public record SubmitDayClosingRequest(
    decimal OpeningCash,
    decimal ActualCashCounted,
    string? Notes
);

// Offline Sync
public record SyncSalesBatchRequest(
    List<CreateSaleRequest> Sales
);

public record SyncBatchResponse(
    int SyncedCount,
    int DuplicateSkippedCount,
    List<Guid> ProcessedSaleIds
);

// AI Assistant
public record AiChatRequest(
    string Message,
    List<AiMessageHistory>? History
);

public record AiMessageHistory(string Role, string Content);

public record AiChatResponse(
    string Answer,
    string? ToolCalled,
    object? ToolData
);

