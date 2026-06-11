using MediWholesale.Domain.Enums;

namespace MediWholesale.Api.DTOs;

public record InvoiceLineDto(
    int Id,
    int ProductId,
    string ProductName,
    string HsnCode,
    string? BatchNumber,
    DateTime? ExpiryDate,
    int Quantity,
    decimal UnitPrice,
    decimal GstRatePercent,
    decimal TaxableAmount,
    decimal DiscountAmount,
    decimal CgstAmount,
    decimal SgstAmount,
    decimal IgstAmount,
    decimal LineTotal);

public record InvoiceDto(
    int Id,
    string InvoiceNumber,
    int? SalesOrderId,
    string? OrderNumber,
    int CustomerId,
    string CustomerName,
    string Address,
    string City,
    string State,
    string PostalCode,
    string Phone,
    string? Email,
    string? Gstin,
    DateTime InvoiceDate,
    InvoiceStatus Status,
    PaymentStatus PaymentStatus,
    GstSupplyType SupplyType,
    decimal SubTotal,
    decimal DiscountAmount,
    decimal CgstAmount,
    decimal SgstAmount,
    decimal IgstAmount,
    decimal TotalAmount,
    decimal AmountPaid,
    string? PlaceOfSupply,
    IReadOnlyList<InvoiceLineDto> Lines);
