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
public class InventoryController : ControllerBase
{
    private readonly AppDbContext _db;

    public InventoryController(AppDbContext db) => _db = db;

    [HttpGet("batches")]
    public async Task<ActionResult<IReadOnlyList<BatchStockDto>>> GetBatches(
        [FromQuery] int? productId,
        [FromQuery] bool? expiringOnly,
        [FromQuery] bool? lowStockOnly)
    {
        var query = _db.BatchStocks
            .AsNoTracking()
            .Include(b => b.Product)
            .AsQueryable();

        if (productId.HasValue)
            query = query.Where(b => b.ProductId == productId.Value);

        var batches = await query.OrderBy(b => b.ExpiryDate).ToListAsync();
        var threshold = DateTime.UtcNow.AddDays(90);

        var result = batches.Select(b => Map(b)).ToList();

        if (expiringOnly == true)
            result = result.Where(b => b.ExpiryDate <= threshold && !b.IsExpired).ToList();
        if (lowStockOnly == true)
            result = result.Where(b => b.IsLowStock).ToList();

        return result;
    }

    [HttpGet("batches/{id:int}")]
    public async Task<ActionResult<BatchStockDto>> GetBatchById(int id)
    {
        var batch = await _db.BatchStocks.AsNoTracking().Include(b => b.Product)
            .FirstOrDefaultAsync(b => b.Id == id);
        return batch is null ? NotFound() : Map(batch);
    }

    [HttpPost("batches")]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.Staff}")]
    public async Task<ActionResult<BatchStockDto>> AddBatch([FromBody] CreateBatchStockRequest request)
    {
        var product = await _db.Products.FindAsync(request.ProductId);
        if (product is null) return NotFound(new { message = "Product not found." });

        if (await _db.BatchStocks.AnyAsync(b =>
            b.ProductId == request.ProductId && b.BatchNumber == request.BatchNumber))
            return Conflict(new { message = "Batch already exists for this product." });

        var batch = new Domain.Entities.BatchStock
        {
            ProductId = request.ProductId,
            BatchNumber = request.BatchNumber,
            ExpiryDate = request.ExpiryDate,
            Quantity = request.Quantity,
            PurchaseRate = request.PurchaseRate,
            SaleRate = request.SaleRate,
            Mrp = request.Mrp,
            Manufacturer = request.Manufacturer,
            RackLocation = request.RackLocation
        };
        _db.BatchStocks.Add(batch);
        await _db.SaveChangesAsync();

        await _db.Entry(batch).Reference(b => b.Product).LoadAsync();
        return CreatedAtAction(nameof(GetBatchById), new { id = batch.Id }, Map(batch));
    }

    [HttpPut("batches/{id:int}")]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.Staff}")]
    public async Task<ActionResult<BatchStockDto>> UpdateBatch(int id, [FromBody] UpdateBatchStockRequest request)
    {
        var batch = await _db.BatchStocks.Include(b => b.Product).FirstOrDefaultAsync(b => b.Id == id);
        if (batch is null) return NotFound();

        if (await _db.BatchStocks.AnyAsync(b =>
            b.ProductId == batch.ProductId && b.BatchNumber == request.BatchNumber && b.Id != id))
            return Conflict(new { message = "Batch number already exists for this product." });

        batch.BatchNumber = request.BatchNumber;
        batch.ExpiryDate = request.ExpiryDate;
        batch.Quantity = request.Quantity;
        batch.PurchaseRate = request.PurchaseRate;
        batch.SaleRate = request.SaleRate;
        batch.Mrp = request.Mrp;
        batch.Manufacturer = request.Manufacturer;
        batch.RackLocation = request.RackLocation;
        batch.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Map(batch);
    }

    [HttpDelete("batches/{id:int}")]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.Staff}")]
    public async Task<IActionResult> DeleteBatch(int id)
    {
        var batch = await _db.BatchStocks.FindAsync(id);
        if (batch is null) return NotFound();

        var inUse = await _db.SalesOrderLines.AnyAsync(l => l.BatchStockId == id);
        if (inUse)
            return Conflict(new { message = "Batch is linked to sales orders and cannot be deleted." });

        _db.BatchStocks.Remove(batch);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static BatchStockDto Map(Domain.Entities.BatchStock b)
    {
        var isLow = b.Quantity <= b.Product.ReorderLevel;
        return new BatchStockDto(
            b.Id, b.ProductId, b.Product.Name, b.BatchNumber, b.ExpiryDate,
            b.Quantity, b.PurchaseRate, b.SaleRate, b.Mrp, b.Manufacturer,
            b.RackLocation, b.IsExpired, isLow);
    }
}
