namespace DukaanOS.API.Core.Enums;

public enum UnitType
{
    KG,
    GRAM,
    LITRE,
    ML,
    PIECE,
    PACK
}

public enum UserRole
{
    OWNER,
    CASHIER
}

public enum MovementType
{
    StockIn,
    Sale,
    CustomerReturn,
    Damaged,
    Expired,
    Lost,
    ManualCorrection,
    SupplierReturn
}

public enum AdjustmentReason
{
    Damaged,
    Expired,
    SupplierReturn,
    Lost,
    CountingError,
    Other
}

public enum PaymentMethod
{
    Cash,
    Easypaisa,
    JazzCash,
    BankTransfer,
    Card,
    UdhaarCredit,
    Other
}

public enum PaymentStatus
{
    Pending,
    Success,
    Failed,
    Expired,
    Refunded
}

public enum LedgerTransactionType
{
    SaleDebit,
    PaymentCredit,
    AdjustmentDebit,
    AdjustmentCredit
}
