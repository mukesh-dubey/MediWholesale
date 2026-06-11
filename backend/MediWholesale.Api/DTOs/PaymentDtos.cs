namespace MediWholesale.Api.DTOs;

public record PaymentMethodDto(
    string Id,
    string Name,
    string Description);

public record InitiatePaymentRequest(
    int OrderId,
    string PaymentMethod);

public record PaymentProcessingDto(
    int Id,
    string TransactionId,
    string Status,
    string PaymentMethod,
    decimal Amount,
    DateTime StartedAt);

public record PaymentResultDto(
    string TransactionId,
    string Status,
    string PaymentMethod,
    decimal Amount,
    DateTime ProcessedAt,
    string? ErrorMessage);

public record PaymentDto(
    int Id,
    int InvoiceId,
    int? SalesOrderId,
    DateTime PaymentDate,
    decimal Amount,
    string Mode,
    string? TransactionId,
    string? ReferenceNumber,
    string Status,
    string? Notes);
