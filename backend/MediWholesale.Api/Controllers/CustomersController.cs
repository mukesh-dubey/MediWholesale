using MediWholesale.Api.DTOs;
using MediWholesale.Domain.Constants;
using MediWholesale.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MediWholesale.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = $"{AppRoles.Admin},{AppRoles.Staff}")]
public class CustomersController : ControllerBase
{
    private readonly AppDbContext _db;

    public CustomersController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<CustomerDto>>> GetAll([FromQuery] string? search)
    {
        var query = _db.Customers.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(c =>
                c.Name.ToLower().Contains(term) ||
                c.Phone.Contains(term) ||
                (c.Gstin != null && c.Gstin.ToLower().Contains(term)));
        }

        var items = await query.OrderBy(c => c.Name).ToListAsync();
        return items.Select(Map).ToList();
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<CustomerDto>> GetById(int id)
    {
        var customer = await _db.Customers.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id);
        return customer is null ? NotFound() : Map(customer);
    }

    [HttpPost]
    public async Task<ActionResult<CustomerDto>> Create([FromBody] CreateCustomerRequest request)
    {
        var entity = new Domain.Entities.Customer
        {
            Name = request.Name,
            CustomerType = request.CustomerType,
            Phone = request.Phone,
            Email = request.Email,
            Address = request.Address,
            City = request.City,
            State = request.State,
            PostalCode = request.PostalCode,
            Gstin = request.Gstin,
            DrugLicenseNumber = request.DrugLicenseNumber,
            CreditLimit = request.CreditLimit,
            PaymentTermDays = request.PaymentTermDays,
            OpeningBalance = request.OpeningBalance
        };
        _db.Customers.Add(entity);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, Map(entity));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<CustomerDto>> Update(int id, [FromBody] UpdateCustomerRequest request)
    {
        var entity = await _db.Customers.FindAsync(id);
        if (entity is null) return NotFound();

        entity.Name = request.Name;
        entity.CustomerType = request.CustomerType;
        entity.Phone = request.Phone;
        entity.Email = request.Email;
        entity.Address = request.Address;
        entity.City = request.City;
        entity.State = request.State;
        entity.PostalCode = request.PostalCode;
        entity.Gstin = request.Gstin;
        entity.DrugLicenseNumber = request.DrugLicenseNumber;
        entity.CreditLimit = request.CreditLimit;
        entity.PaymentTermDays = request.PaymentTermDays;
        entity.OpeningBalance = request.OpeningBalance;
        entity.IsActive = request.IsActive;
        entity.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Map(entity);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _db.Customers.FindAsync(id);
        if (entity is null) return NotFound();

        entity.IsActive = false;
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static CustomerDto Map(Domain.Entities.Customer c) => new(
        c.Id, c.Name, c.CustomerType, c.Phone, c.Email, c.Address, c.City, c.State,
        c.PostalCode, c.Gstin, c.DrugLicenseNumber, c.CreditLimit, c.PaymentTermDays,
        c.OpeningBalance, c.IsActive, !string.IsNullOrEmpty(c.PortalUserId));
}
