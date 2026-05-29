using MediWholesale.Domain.Common;

namespace MediWholesale.Domain.Entities;

public class Product : BaseEntity
{
    public string Sku { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string GenericName { get; set; } = string.Empty;
    public string? Brand { get; set; }
    public string Category { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public string HsnCode { get; set; } = string.Empty;
    public decimal GstRatePercent { get; set; }
    public bool IsPrescriptionRequired { get; set; }
    public int ReorderLevel { get; set; } = 10;
    public bool IsActive { get; set; } = true;

    public ICollection<BatchStock> Batches { get; set; } = [];
}
