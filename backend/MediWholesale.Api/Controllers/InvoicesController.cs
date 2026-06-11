using System.Security.Claims;
using MediWholesale.Api.DTOs;
using MediWholesale.Domain.Constants;
using MediWholesale.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MediWholesale.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InvoicesController : ControllerBase
{
    private readonly AppDbContext _db;

    public InvoicesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<InvoiceDto>>> GetAll()
    {
        var query = _db.Invoices
            .AsNoTracking()
            .Include(i => i.Customer)
            .Include(i => i.SalesOrder)
            .Include(i => i.Lines)
            .AsQueryable();

        if (User.IsInRole(AppRoles.Customer))
        {
            var customerId = GetCustomerId();
            if (!customerId.HasValue) return Forbid();
            query = query.Where(i => i.CustomerId == customerId.Value);
        }

        var invoices = await query.OrderByDescending(i => i.InvoiceDate).ToListAsync();
        return invoices.Select(Map).ToList();
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<InvoiceDto>> GetById(int id)
    {
        var invoice = await _db.Invoices
            .AsNoTracking()
            .Include(i => i.Customer)
            .Include(i => i.SalesOrder)
            .Include(i => i.Lines)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (invoice is null) return NotFound();
        if (User.IsInRole(AppRoles.Customer) && invoice.CustomerId != GetCustomerId())
            return Forbid();

        return Map(invoice);
    }

    private int? GetCustomerId()
    {
        var claim = User.FindFirstValue("customer_id");
        return int.TryParse(claim, out var id) ? id : null;
    }

    private static InvoiceDto Map(Domain.Entities.Invoice i) => new(
        i.Id,
        i.InvoiceNumber,
        i.SalesOrderId,
        i.SalesOrder?.OrderNumber,
        i.CustomerId,
        i.Customer.Name,
        i.Customer.Address,
        i.Customer.City,
        i.Customer.State,
        i.Customer.PostalCode,
        i.Customer.Phone,
        i.Customer.Email,
        i.Customer.Gstin,
        i.InvoiceDate,
        i.Status,
        i.SalesOrder?.PaymentStatus ?? Domain.Enums.PaymentStatus.Pending,
        i.SupplyType,
        i.SubTotal,
        i.DiscountAmount,
        i.CgstAmount,
        i.SgstAmount,
        i.IgstAmount,
        i.TotalAmount,
        i.AmountPaid,
        i.PlaceOfSupply,
        i.Lines.Select(l => new InvoiceLineDto(
            l.Id,
            l.ProductId,
            l.ProductName,
            l.HsnCode,
            l.BatchNumber,
            l.ExpiryDate,
            l.Quantity,
            l.UnitPrice,
            l.GstRatePercent,
            l.TaxableAmount,
            l.DiscountAmount,
            l.CgstAmount,
            l.SgstAmount,
            l.IgstAmount,
            l.LineTotal)).ToList());
}
