using System.Security.Claims;
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
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly AppDbContext _db;

    public OrdersController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<OrderDto>>> GetAll([FromQuery] OrderStatus? status)
    {
        var query = _db.SalesOrders
            .AsNoTracking()
            .Include(o => o.Customer)
            .Include(o => o.Lines)
            .AsQueryable();

        if (User.IsInRole(AppRoles.Customer))
        {
            var customerId = GetCustomerId();
            if (!customerId.HasValue) return Forbid();
            query = query.Where(o => o.CustomerId == customerId.Value);
        }

        if (status.HasValue)
            query = query.Where(o => o.Status == status.Value);

        var orders = await query.OrderByDescending(o => o.OrderDate).ToListAsync();
        return orders.Select(Map).ToList();
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<OrderDto>> GetById(int id)
    {
        var order = await _db.SalesOrders
            .AsNoTracking()
            .Include(o => o.Customer)
            .Include(o => o.Lines)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order is null) return NotFound();
        if (User.IsInRole(AppRoles.Customer) && order.CustomerId != GetCustomerId())
            return Forbid();

        return Map(order);
    }

    [HttpPost]
    public async Task<ActionResult<OrderDto>> Create([FromBody] CreateOrderRequest request)
    {
        var isCustomer = User.IsInRole(AppRoles.Customer);
        var customerId = isCustomer ? GetCustomerId() : request.CustomerId;

        if (!customerId.HasValue)
            return BadRequest(new { message = "Customer is required." });

        if (isCustomer && request.CustomerId != customerId)
            return Forbid();

        var customer = await _db.Customers.FindAsync(customerId.Value);
        if (customer is null || !customer.IsActive)
            return BadRequest(new { message = "Invalid customer." });

        if (request.Lines.Count == 0)
            return BadRequest(new { message = "Order must have at least one line." });

        var productIds = request.Lines.Select(l => l.ProductId).Distinct().ToList();
        var products = await _db.Products
            .Where(p => productIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id);

        var order = new Domain.Entities.SalesOrder
        {
            OrderNumber = await GenerateOrderNumber(),
            CustomerId = customerId.Value,
            Notes = request.Notes,
            PlacedByCustomer = isCustomer,
            Status = isCustomer ? OrderStatus.Pending : OrderStatus.Confirmed
        };

        foreach (var line in request.Lines)
        {
            if (!products.TryGetValue(line.ProductId, out var product))
                return BadRequest(new { message = $"Product {line.ProductId} not found." });

            order.Lines.Add(new Domain.Entities.SalesOrderLine
            {
                ProductId = product.Id,
                ProductName = product.Name,
                Quantity = line.Quantity,
                UnitPrice = line.UnitPrice,
                LineTotal = line.Quantity * line.UnitPrice
            });
        }

        order.TotalAmount = order.Lines.Sum(l => l.LineTotal);
        _db.SalesOrders.Add(order);
        await _db.SaveChangesAsync();

        await _db.Entry(order).Reference(o => o.Customer).LoadAsync();
        return CreatedAtAction(nameof(GetById), new { id = order.Id }, Map(order));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.Staff}")]
    public async Task<IActionResult> Cancel(int id)
    {
        var order = await _db.SalesOrders.FindAsync(id);
        if (order is null) return NotFound();

        if (order.Status is OrderStatus.Completed or OrderStatus.PartiallyDispatched)
            return BadRequest(new { message = "Cannot cancel a dispatched or completed order." });

        order.Status = OrderStatus.Cancelled;
        order.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("{id:int}/status")]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.Staff}")]
    public async Task<ActionResult<OrderDto>> UpdateStatus(int id, [FromQuery] OrderStatus status)
    {
        var order = await _db.SalesOrders
            .Include(o => o.Customer)
            .Include(o => o.Lines)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order is null) return NotFound();
        order.Status = status;
        order.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Map(order);
    }

    private int? GetCustomerId()
    {
        var claim = User.FindFirstValue("customer_id");
        return int.TryParse(claim, out var id) ? id : null;
    }

    private async Task<string> GenerateOrderNumber()
    {
        var count = await _db.SalesOrders.CountAsync() + 1;
        return $"SO-{DateTime.UtcNow:yyyyMM}-{count:D5}";
    }

    private static OrderDto Map(Domain.Entities.SalesOrder o) => new(
        o.Id,
        o.OrderNumber,
        o.CustomerId,
        o.Customer.Name,
        o.OrderDate,
        o.Status,
        o.PaymentStatus,
        o.TotalAmount,
        o.Notes,
        o.PlacedByCustomer,
        o.Lines.Select(l => new OrderLineDto(
            l.Id, l.ProductId, l.ProductName, l.BatchNumber,
            l.Quantity, l.DispatchedQuantity, l.UnitPrice, l.LineTotal)).ToList());
}
