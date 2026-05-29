using MediWholesale.Domain.Enums;

namespace MediWholesale.Api.DTOs;

public record OrderLineDto(
    int Id,
    int ProductId,
    string ProductName,
    string? BatchNumber,
    int Quantity,
    int DispatchedQuantity,
    decimal UnitPrice,
    decimal LineTotal);

public record OrderDto(
    int Id,
    string OrderNumber,
    int CustomerId,
    string CustomerName,
    DateTime OrderDate,
    OrderStatus Status,
    PaymentStatus PaymentStatus,
    decimal TotalAmount,
    string? Notes,
    bool PlacedByCustomer,
    IReadOnlyList<OrderLineDto> Lines);

public record CreateOrderLineRequest(int ProductId, int Quantity, decimal UnitPrice);

public record CreateOrderRequest(
    int CustomerId,
    string? Notes,
    IReadOnlyList<CreateOrderLineRequest> Lines);

public record DashboardDto(
    int TotalCustomers,
    int TotalProducts,
    int LowStockBatches,
    int ExpiringBatches,
    int PendingOrders,
    decimal OutstandingAmount);
