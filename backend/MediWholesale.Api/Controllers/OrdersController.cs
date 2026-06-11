using System.Security.Claims;
using MediWholesale.Api.DTOs;
using MediWholesale.Domain.Constants;
using MediWholesale.Domain.Enums;
using MediWholesale.Infrastructure.Data;
using MediWholesale.Infrastructure.Services;
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

        if (order.Status is OrderStatus.Completed or OrderStatus.PartiallyDispatched or OrderStatus.Dispatched)
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
                .ThenInclude(l => l.Product)
            .Include(o => o.Invoice)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order is null) return NotFound();
        if (status is OrderStatus.Confirmed or OrderStatus.Dispatched)
            return await DispatchOrder(order);

        order.Status = status;
        order.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Map(order);
    }

    private async Task<ActionResult<OrderDto>> DispatchOrder(Domain.Entities.SalesOrder order)
    {
        if (order.Status is OrderStatus.Cancelled or OrderStatus.Completed)
            return BadRequest(new { message = "Cannot dispatch a cancelled or completed order." });

        if (order.Invoice is not null)
        {
            order.Status = OrderStatus.Dispatched;
            order.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Map(order);
        }

        await using var transaction = await _db.Database.BeginTransactionAsync();

        var company = await _db.CompanyProfiles.AsNoTracking().FirstOrDefaultAsync();
        var supplyType = company?.State.Equals(order.Customer.State, StringComparison.OrdinalIgnoreCase) == true
            ? GstSupplyType.IntraState
            : GstSupplyType.InterState;

        var invoice = new Domain.Entities.Invoice
        {
            InvoiceNumber = await GenerateInvoiceNumber(),
            CustomerId = order.CustomerId,
            SalesOrderId = order.Id,
            Status = InvoiceStatus.Issued,
            SupplyType = supplyType,
            AmountPaid = 0,
            PlaceOfSupply = order.Customer.State
        };

        foreach (var line in order.Lines)
        {
            var remainingQuantity = line.Quantity - line.DispatchedQuantity;
            if (remainingQuantity <= 0) continue;

            var batches = await _db.BatchStocks
                .Where(b =>
                    b.ProductId == line.ProductId &&
                    b.Quantity > 0 &&
                    b.ExpiryDate.Date >= DateTime.UtcNow.Date)
                .OrderBy(b => b.ExpiryDate)
                .ToListAsync();

            var availableQuantity = batches.Sum(b => b.Quantity);
            if (availableQuantity < remainingQuantity)
                return BadRequest(new { message = $"Insufficient stock for {line.ProductName}. Available: {availableQuantity}, required: {remainingQuantity}." });

            var dispatchedBatches = new List<string>();
            decimal dispatchedLineTotal = 0;
            foreach (var batch in batches)
            {
                if (remainingQuantity == 0) break;

                var dispatchedQuantity = Math.Min(batch.Quantity, remainingQuantity);
                batch.Quantity -= dispatchedQuantity;
                remainingQuantity -= dispatchedQuantity;
                dispatchedBatches.Add(batch.BatchNumber);

                const decimal discountAmount = 0;
                var gst = GstCalculator.CalculateLine(
                    line.UnitPrice,
                    dispatchedQuantity,
                    line.Product.GstRatePercent,
                    supplyType,
                    discountAmount);

                invoice.Lines.Add(new Domain.Entities.InvoiceLine
                {
                    ProductId = line.ProductId,
                    ProductName = line.ProductName,
                    HsnCode = line.Product.HsnCode,
                    BatchNumber = batch.BatchNumber,
                    ExpiryDate = batch.ExpiryDate,
                    Quantity = dispatchedQuantity,
                    UnitPrice = line.UnitPrice,
                    GstRatePercent = line.Product.GstRatePercent,
                    TaxableAmount = gst.TaxableAmount,
                    DiscountAmount = discountAmount,
                    CgstAmount = gst.CgstAmount,
                    SgstAmount = gst.SgstAmount,
                    IgstAmount = gst.IgstAmount,
                    LineTotal = gst.LineTotal
                });
                dispatchedLineTotal += gst.LineTotal;
            }

            line.DispatchedQuantity = line.Quantity;
            line.BatchStockId = batches.FirstOrDefault()?.Id;
            line.BatchNumber = string.Join(", ", dispatchedBatches.Distinct());
            line.LineTotal = dispatchedLineTotal;
        }

        invoice.SubTotal = invoice.Lines.Sum(l => l.TaxableAmount);
        invoice.DiscountAmount = invoice.Lines.Sum(l => l.DiscountAmount);
        invoice.CgstAmount = invoice.Lines.Sum(l => l.CgstAmount);
        invoice.SgstAmount = invoice.Lines.Sum(l => l.SgstAmount);
        invoice.IgstAmount = invoice.Lines.Sum(l => l.IgstAmount);
        invoice.TotalAmount = invoice.Lines.Sum(l => l.LineTotal);

        order.Status = OrderStatus.Dispatched;
        order.PaymentStatus = PaymentStatus.Pending;
        order.TotalAmount = invoice.TotalAmount;
        order.UpdatedAt = DateTime.UtcNow;

        _db.Invoices.Add(invoice);
        await _db.SaveChangesAsync();
        await transaction.CommitAsync();

        order.Invoice = invoice;
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

    private async Task<string> GenerateInvoiceNumber()
    {
        var count = await _db.Invoices.CountAsync() + 1;
        return $"INV-{DateTime.UtcNow:yyyyMM}-{count:D5}";
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
