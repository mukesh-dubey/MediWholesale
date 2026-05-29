using MediWholesale.Domain.Common;

namespace MediWholesale.Domain.Entities;

public class CompanyProfile : BaseEntity
{
    public string BusinessName { get; set; } = string.Empty;
    public string Gstin { get; set; } = string.Empty;
    public string DrugLicenseNumber { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
}
