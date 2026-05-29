namespace MediWholesale.Api.DTOs;

public record ProductDto(
    int Id,
    string Sku,
    string Name,
    string GenericName,
    string? Brand,
    string Category,
    string Unit,
    string HsnCode,
    decimal GstRatePercent,
    bool IsPrescriptionRequired,
    int ReorderLevel,
    bool IsActive,
    int TotalStock);

public record BatchStockDto(
    int Id,
    int ProductId,
    string ProductName,
    string BatchNumber,
    DateTime ExpiryDate,
    int Quantity,
    decimal PurchaseRate,
    decimal SaleRate,
    decimal Mrp,
    string? Manufacturer,
    string? RackLocation,
    bool IsExpired,
    bool IsLowStock);

public record CreateProductRequest(
    string Sku,
    string Name,
    string GenericName,
    string? Brand,
    string Category,
    string Unit,
    string HsnCode,
    decimal GstRatePercent,
    bool IsPrescriptionRequired,
    int ReorderLevel);

public record CreateBatchStockRequest(
    int ProductId,
    string BatchNumber,
    DateTime ExpiryDate,
    int Quantity,
    decimal PurchaseRate,
    decimal SaleRate,
    decimal Mrp,
    string? Manufacturer,
    string? RackLocation);

public record UpdateProductRequest(
    string Sku,
    string Name,
    string GenericName,
    string? Brand,
    string Category,
    string Unit,
    string HsnCode,
    decimal GstRatePercent,
    bool IsPrescriptionRequired,
    int ReorderLevel,
    bool IsActive);

public record UpdateBatchStockRequest(
    string BatchNumber,
    DateTime ExpiryDate,
    int Quantity,
    decimal PurchaseRate,
    decimal SaleRate,
    decimal Mrp,
    string? Manufacturer,
    string? RackLocation);
