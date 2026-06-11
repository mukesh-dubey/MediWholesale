using MediWholesale.Domain.Common;

namespace MediWholesale.Domain.Entities;

public class Payment : BaseEntity
{
    public int InvoiceId { get; set; }
    public Invoice Invoice { get; set; } = null!;
    public int? SalesOrderId { get; set; }
    public SalesOrder? SalesOrder { get; set; }
    public DateTime PaymentDate { get; set; } = DateTime.UtcNow;
    public decimal Amount { get; set; }
    public string Mode { get; set; } = "Cash"; // Credit Card, Debit Card, NetBanking, UPI, Wallet
    public string? TransactionId { get; set; }
    public string? ReferenceNumber { get; set; }
    public string Status { get; set; } = "Completed"; // Processing, Success, Failed, Completed
    public string? Notes { get; set; }
}
