using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using MediWholesale.Api.DTOs;
using MediWholesale.Domain.Constants;
using MediWholesale.Infrastructure.Data;
using MediWholesale.Infrastructure.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace MediWholesale.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly AppDbContext _db;
    private readonly IConfiguration _configuration;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        AppDbContext db,
        IConfiguration configuration)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _db = db;
        _configuration = configuration;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user is null || !user.IsActive)
            return Unauthorized(new { message = "Invalid credentials." });

        var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, false);
        if (!result.Succeeded)
            return Unauthorized(new { message = "Invalid credentials." });

        return await BuildAuthResponse(user);
    }

    [HttpPost("register-staff")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<AuthResponse>> RegisterStaff([FromBody] RegisterStaffRequest request)
    {
        if (request.Role is not (AppRoles.Admin or AppRoles.Staff))
            return BadRequest(new { message = "Invalid staff role." });

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            FullName = request.FullName,
            EmailConfirmed = true
        };

        var createResult = await _userManager.CreateAsync(user, request.Password);
        if (!createResult.Succeeded)
            return BadRequest(createResult.Errors);

        await _userManager.AddToRoleAsync(user, request.Role);
        return await BuildAuthResponse(user);
    }

    [HttpPost("register-customer-portal")]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.Staff}")]
    public async Task<ActionResult> RegisterCustomerPortal([FromBody] RegisterCustomerPortalRequest request)
    {
        var customer = await _db.Customers.FindAsync(request.CustomerId);
        if (customer is null) return NotFound();

        if (!string.IsNullOrEmpty(customer.PortalUserId))
            return BadRequest(new { message = "Customer already has portal access." });

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            FullName = request.FullName,
            EmailConfirmed = true
        };

        var createResult = await _userManager.CreateAsync(user, request.Password);
        if (!createResult.Succeeded)
            return BadRequest(createResult.Errors);

        await _userManager.AddToRoleAsync(user, AppRoles.Customer);
        customer.PortalUserId = user.Id;
        customer.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new { message = "Portal access created." });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<AuthResponse>> Me()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user is null) return Unauthorized();
        return await BuildAuthResponse(user);
    }

    private async Task<AuthResponse> BuildAuthResponse(ApplicationUser user)
    {
        var roles = await _userManager.GetRolesAsync(user);
        int? customerId = null;
        if (roles.Contains(AppRoles.Customer))
        {
            customerId = await _db.Customers
                .Where(c => c.PortalUserId == user.Id)
                .Select(c => (int?)c.Id)
                .FirstOrDefaultAsync();
        }

        var jwt = _configuration.GetSection("Jwt");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddHours(double.Parse(jwt["ExpireHours"] ?? "8"));

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Email, user.Email ?? string.Empty),
            new(ClaimTypes.Name, user.FullName)
        };
        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
            claims.Add(new Claim("role", role));
        }
        if (customerId.HasValue)
            claims.Add(new Claim("customer_id", customerId.Value.ToString()));

        var token = new JwtSecurityToken(
            issuer: jwt["Issuer"],
            audience: jwt["Audience"],
            claims: claims,
            expires: expires,
            signingCredentials: creds);

        return new AuthResponse(
            new JwtSecurityTokenHandler().WriteToken(token),
            expires,
            user.Email ?? string.Empty,
            user.FullName,
            roles.ToList(),
            customerId);
    }
}
