using MediWholesale.Api.DTOs;
using MediWholesale.Domain.Constants;
using MediWholesale.Domain.Enums;
using MediWholesale.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MediWholesale.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = $"{AppRoles.Admin},{AppRoles.Staff}")]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _db;

    public DashboardController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<DashboardDto>> Get()
    {
        var threshold = DateTime.UtcNow.AddDays(90);
        var batches = await _db.BatchStocks
            .Include(b => b.Product)
            .ToListAsync();

        var lowStock = batches.Count(b => b.Quantity <= b.Product.ReorderLevel);
        var expiring = batches.Count(b => b.ExpiryDate <= threshold && !b.IsExpired);
        var pendingOrders = await _db.SalesOrders.CountAsync(o => o.Status == OrderStatus.Pending);
        var outstanding = await _db.Invoices
            .Where(i => i.Status != InvoiceStatus.Cancelled && i.Status != InvoiceStatus.Paid)
            .SumAsync(i => i.TotalAmount - i.AmountPaid);

        return new DashboardDto(
            await _db.Customers.CountAsync(c => c.IsActive),
            await _db.Products.CountAsync(p => p.IsActive),
            lowStock,
            expiring,
            pendingOrders,
            outstanding);
    }
}
