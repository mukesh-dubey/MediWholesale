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
public class ProductsController : ControllerBase
{
    private readonly AppDbContext _db;

    public ProductsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ProductDto>>> GetAll(
        [FromQuery] string? search,
        [FromQuery] bool includeInactive = false)
    {
        var query = _db.Products.AsNoTracking().AsQueryable();
        if (!includeInactive)
            query = query.Where(p => p.IsActive);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(p =>
                p.Name.ToLower().Contains(term) ||
                p.Sku.ToLower().Contains(term) ||
                p.GenericName.ToLower().Contains(term));
        }

        var products = await query.OrderBy(p => p.Name).ToListAsync();
        var stock = await _db.BatchStocks
            .GroupBy(b => b.ProductId)
            .Select(g => new { ProductId = g.Key, Total = g.Sum(x => x.Quantity) })
            .ToDictionaryAsync(x => x.ProductId, x => x.Total);

        return products.Select(p => Map(p, stock.GetValueOrDefault(p.Id))).ToList();
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProductDto>> GetById(int id)
    {
        var product = await _db.Products.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id);
        if (product is null) return NotFound();

        var total = await _db.BatchStocks.Where(b => b.ProductId == id).SumAsync(b => b.Quantity);
        return Map(product, total);
    }

    [HttpPost]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.Staff}")]
    public async Task<ActionResult<ProductDto>> Create([FromBody] CreateProductRequest request)
    {
        if (await _db.Products.AnyAsync(p => p.Sku == request.Sku))
            return Conflict(new { message = "SKU already exists." });

        var entity = new Domain.Entities.Product
        {
            Sku = request.Sku,
            Name = request.Name,
            GenericName = request.GenericName,
            Brand = request.Brand,
            Category = request.Category,
            Unit = request.Unit,
            HsnCode = request.HsnCode,
            GstRatePercent = request.GstRatePercent,
            IsPrescriptionRequired = request.IsPrescriptionRequired,
            ReorderLevel = request.ReorderLevel
        };
        _db.Products.Add(entity);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, Map(entity, 0));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.Staff}")]
    public async Task<ActionResult<ProductDto>> Update(int id, [FromBody] UpdateProductRequest request)
    {
        var entity = await _db.Products.FindAsync(id);
        if (entity is null) return NotFound();

        if (await _db.Products.AnyAsync(p => p.Sku == request.Sku && p.Id != id))
            return Conflict(new { message = "SKU already exists." });

        entity.Sku = request.Sku;
        entity.Name = request.Name;
        entity.GenericName = request.GenericName;
        entity.Brand = request.Brand;
        entity.Category = request.Category;
        entity.Unit = request.Unit;
        entity.HsnCode = request.HsnCode;
        entity.GstRatePercent = request.GstRatePercent;
        entity.IsPrescriptionRequired = request.IsPrescriptionRequired;
        entity.ReorderLevel = request.ReorderLevel;
        entity.IsActive = request.IsActive;
        entity.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        var total = await _db.BatchStocks.Where(b => b.ProductId == id).SumAsync(b => b.Quantity);
        return Map(entity, total);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.Staff}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _db.Products.FindAsync(id);
        if (entity is null) return NotFound();

        entity.IsActive = false;
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static ProductDto Map(Domain.Entities.Product p, int totalStock) => new(
        p.Id, p.Sku, p.Name, p.GenericName, p.Brand, p.Category, p.Unit,
        p.HsnCode, p.GstRatePercent, p.IsPrescriptionRequired, p.ReorderLevel,
        p.IsActive, totalStock);
}
