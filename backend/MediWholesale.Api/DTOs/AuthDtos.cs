namespace MediWholesale.Api.DTOs;

public record LoginRequest(string Email, string Password);

public record AuthResponse(
    string Token,
    DateTime ExpiresAt,
    string Email,
    string FullName,
    IReadOnlyList<string> Roles,
    int? CustomerId);

public record RegisterStaffRequest(string Email, string Password, string FullName, string Role);

public record RegisterCustomerPortalRequest(
    int CustomerId,
    string Email,
    string Password,
    string FullName);
