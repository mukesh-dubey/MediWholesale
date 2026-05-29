using MediWholesale.Domain.Enums;

namespace MediWholesale.Api.DTOs;

public record CustomerDto(
    int Id,
    string Name,
    CustomerType CustomerType,
    string Phone,
    string? Email,
    string Address,
    string City,
    string State,
    string PostalCode,
    string? Gstin,
    string DrugLicenseNumber,
    decimal CreditLimit,
    int PaymentTermDays,
    decimal OpeningBalance,
    bool IsActive,
    bool HasPortalAccess);

public record CreateCustomerRequest(
    string Name,
    CustomerType CustomerType,
    string Phone,
    string? Email,
    string Address,
    string City,
    string State,
    string PostalCode,
    string? Gstin,
    string DrugLicenseNumber,
    decimal CreditLimit,
    int PaymentTermDays,
    decimal OpeningBalance);

public record UpdateCustomerRequest(
    string Name,
    CustomerType CustomerType,
    string Phone,
    string? Email,
    string Address,
    string City,
    string State,
    string PostalCode,
    string? Gstin,
    string DrugLicenseNumber,
    decimal CreditLimit,
    int PaymentTermDays,
    decimal OpeningBalance,
    bool IsActive);
