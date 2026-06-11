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
public class PaymentsController : ControllerBase
{
    private readonly AppDbContext _db;

    public PaymentsController(AppDbContext db) => _db = db;

    private static readonly List<PaymentMethodDto> PaymentMethods = new()
    {
        new("cc", "Credit Card", "Pay using Credit Card"),
        new("dc", "Debit Card", "Pay using Debit Card"),
        new("nb", "NetBanking", "Pay using NetBanking"),
        new("upi", "UPI", "Pay using UPI"),
        new("wallet", "Wallet", "Pay using Digital Wallet"),
    };

    [HttpGet("methods")]
    public ActionResult<IReadOnlyList<PaymentMethodDto>> GetPaymentMethods()
    {
        return Ok(PaymentMethods);
    }

    [HttpPost("initiate")]
    public async Task<ActionResult<PaymentProcessingDto>> InitiatePayment([FromBody] InitiatePaymentRequest request)
    {
        var order = await _db.SalesOrders
            .Include(o => o.Invoice)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId);

        if (order is null)
            return NotFound(new { message = "Order not found." });

        if (User.IsInRole(AppRoles.Customer))
        {
            var customerId = GetCustomerId();
            if (!customerId.HasValue || order.CustomerId != customerId.Value)
                return Forbid();
        }

        if (order.Status != OrderStatus.Confirmed)
            return BadRequest(new { message = "Order must be in Confirmed status to proceed with payment." });

        if (order.PaymentStatus == PaymentStatus.Paid)
            return BadRequest(new { message = "Order is already paid." });

        // Generate transaction ID
        var transactionId = $"TXN{DateTime.UtcNow:yyyyMMddHHmmss}{Random.Shared.Next(1000, 9999)}";

        // Return processing status
        return Ok(new PaymentProcessingDto(
            order.Id,
            transactionId,
            "Processing",
            request.PaymentMethod,
            order.TotalAmount,
            DateTime.UtcNow));
    }

    [HttpPost("confirm")]
    public async Task<ActionResult<PaymentResultDto>> ConfirmPayment([FromBody] PaymentProcessingDto processingPayment)
    {
        var order = await _db.SalesOrders
            .Include(o => o.Customer)
            .Include(o => o.Invoice)
            .FirstOrDefaultAsync(o => o.Id == processingPayment.Id);

        if (order is null)
            return NotFound(new { message = "Order not found." });

        if (User.IsInRole(AppRoles.Customer))
        {
            var customerId = GetCustomerId();
            if (!customerId.HasValue || order.CustomerId != customerId.Value)
                return Forbid();
        }

        // Simulate payment processing - randomly succeed or fail (80% success rate)
        var isSuccess = Random.Shared.Next(0, 100) < 80;

        if (!isSuccess)
        {
            return Ok(new PaymentResultDto(
                processingPayment.TransactionId,
                "Failed",
                processingPayment.PaymentMethod,
                order.TotalAmount,
                DateTime.UtcNow,
                "Payment gateway declined the transaction. Please try again with a different payment method."));
        }

        // Payment successful - save payment record
        var payment = new Domain.Entities.Payment
        {
            SalesOrderId = order.Id,
            InvoiceId = order.Invoice?.Id ?? 0,
            PaymentDate = DateTime.UtcNow,
            Amount = order.TotalAmount,
            Mode = processingPayment.PaymentMethod,
            TransactionId = processingPayment.TransactionId,
            Status = "Completed",
            Notes = $"Online payment via {processingPayment.PaymentMethod}"
        };

        // Update order and invoice
        order.PaymentStatus = PaymentStatus.Paid;
        order.UpdatedAt = DateTime.UtcNow;

        if (order.Invoice is not null)
        {
            order.Invoice.Status = InvoiceStatus.Paid;
            order.Invoice.AmountPaid = order.TotalAmount;
            order.Invoice.UpdatedAt = DateTime.UtcNow;
        }

        _db.Payments.Add(payment);
        await _db.SaveChangesAsync();

        return Ok(new PaymentResultDto(
            processingPayment.TransactionId,
            "Success",
            processingPayment.PaymentMethod,
            order.TotalAmount,
            DateTime.UtcNow,
            null));
    }

    [HttpGet("order/{orderId:int}")]
    public async Task<ActionResult<IReadOnlyList<PaymentDto>>> GetOrderPayments(int orderId)
    {
        var order = await _db.SalesOrders.FindAsync(orderId);
        if (order is null)
            return NotFound();

        if (User.IsInRole(AppRoles.Customer))
        {
            var customerId = GetCustomerId();
            if (!customerId.HasValue || order.CustomerId != customerId.Value)
                return Forbid();
        }

        var payments = await _db.Payments
            .Where(p => p.SalesOrderId == orderId)
            .OrderByDescending(p => p.PaymentDate)
            .ToListAsync();

        return Ok(payments.Select(Map).ToList());
    }

    private int? GetCustomerId()
    {
        var claim = User.FindFirstValue("customer_id");
        return int.TryParse(claim, out var id) ? id : null;
    }

    private static PaymentDto Map(Domain.Entities.Payment p) => new(
        p.Id,
        p.InvoiceId,
        p.SalesOrderId,
        p.PaymentDate,
        p.Amount,
        p.Mode,
        p.TransactionId,
        p.ReferenceNumber,
        p.Status,
        p.Notes);
}
