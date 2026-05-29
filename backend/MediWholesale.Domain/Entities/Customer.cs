using MediWholesale.Domain.Common;
using MediWholesale.Domain.Enums;

namespace MediWholesale.Domain.Entities;

public class Customer : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public CustomerType CustomerType { get; set; }
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string? Gstin { get; set; }
    public string DrugLicenseNumber { get; set; } = string.Empty;
    public decimal CreditLimit { get; set; }
    public int PaymentTermDays { get; set; } = 30;
    public decimal OpeningBalance { get; set; }
    public bool IsActive { get; set; } = true;

    /// <summary>Links portal login user to this B2B customer account.</summary>
    public string? PortalUserId { get; set; }

    public ICollection<SalesOrder> SalesOrders { get; set; } = [];
    public ICollection<Invoice> Invoices { get; set; } = [];
}
