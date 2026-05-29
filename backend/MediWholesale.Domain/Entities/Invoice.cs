using MediWholesale.Domain.Common;
using MediWholesale.Domain.Enums;

namespace MediWholesale.Domain.Entities;

public class Invoice : BaseEntity
{
    public string InvoiceNumber { get; set; } = string.Empty;
    public int CustomerId { get; set; }
    public Customer Customer { get; set; } = null!;
    public int? SalesOrderId { get; set; }
    public SalesOrder? SalesOrder { get; set; }
    public DateTime InvoiceDate { get; set; } = DateTime.UtcNow;
    public InvoiceStatus Status { get; set; } = InvoiceStatus.Draft;
    public GstSupplyType SupplyType { get; set; }
    public decimal SubTotal { get; set; }
    public decimal CgstAmount { get; set; }
    public decimal SgstAmount { get; set; }
    public decimal IgstAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal AmountPaid { get; set; }
    public string? PlaceOfSupply { get; set; }

    public ICollection<InvoiceLine> Lines { get; set; } = [];
    public ICollection<Payment> Payments { get; set; } = [];
}
