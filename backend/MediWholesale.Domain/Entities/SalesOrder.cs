using MediWholesale.Domain.Common;
using MediWholesale.Domain.Enums;

namespace MediWholesale.Domain.Entities;

public class SalesOrder : BaseEntity
{
    public string OrderNumber { get; set; } = string.Empty;
    public int CustomerId { get; set; }
    public Customer Customer { get; set; } = null!;
    public DateTime OrderDate { get; set; } = DateTime.UtcNow;
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;
    public decimal TotalAmount { get; set; }
    public string? Notes { get; set; }
    public bool PlacedByCustomer { get; set; }

    public ICollection<SalesOrderLine> Lines { get; set; } = [];
    public Invoice? Invoice { get; set; }
}
