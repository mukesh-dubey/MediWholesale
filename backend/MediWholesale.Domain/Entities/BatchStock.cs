using MediWholesale.Domain.Common;

namespace MediWholesale.Domain.Entities;

public class BatchStock : BaseEntity
{
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public string BatchNumber { get; set; } = string.Empty;
    public DateTime ExpiryDate { get; set; }
    public int Quantity { get; set; }
    public decimal PurchaseRate { get; set; }
    public decimal SaleRate { get; set; }
    public decimal Mrp { get; set; }
    public string? Manufacturer { get; set; }
    public string? RackLocation { get; set; }

    public bool IsExpired => ExpiryDate.Date < DateTime.UtcNow.Date;
}
