using MediWholesale.Domain.Entities;
using MediWholesale.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace MediWholesale.Infrastructure.Data;

public class AppDbContext : IdentityDbContext<ApplicationUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<BatchStock> BatchStocks => Set<BatchStock>();
    public DbSet<SalesOrder> SalesOrders => Set<SalesOrder>();
    public DbSet<SalesOrderLine> SalesOrderLines => Set<SalesOrderLine>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<InvoiceLine> InvoiceLines => Set<InvoiceLine>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<CompanyProfile> CompanyProfiles => Set<CompanyProfile>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Customer>(e =>
        {
            e.HasIndex(x => x.Gstin);
            e.HasIndex(x => x.PortalUserId);
            e.Property(x => x.CreditLimit).HasPrecision(18, 2);
            e.Property(x => x.OpeningBalance).HasPrecision(18, 2);
        });

        builder.Entity<Product>(e =>
        {
            e.HasIndex(x => x.Sku).IsUnique();
            e.Property(x => x.GstRatePercent).HasPrecision(5, 2);
        });

        builder.Entity<BatchStock>(e =>
        {
            e.HasIndex(x => new { x.ProductId, x.BatchNumber }).IsUnique();
            e.Property(x => x.PurchaseRate).HasPrecision(18, 2);
            e.Property(x => x.SaleRate).HasPrecision(18, 2);
            e.Property(x => x.Mrp).HasPrecision(18, 2);
            e.HasOne(x => x.Product).WithMany(p => p.Batches).HasForeignKey(x => x.ProductId);
        });

        builder.Entity<SalesOrder>(e =>
        {
            e.HasIndex(x => x.OrderNumber).IsUnique();
            e.Property(x => x.TotalAmount).HasPrecision(18, 2);
            e.HasOne(x => x.Customer).WithMany(c => c.SalesOrders).HasForeignKey(x => x.CustomerId);
            e.HasOne(x => x.Invoice).WithOne(i => i.SalesOrder).HasForeignKey<Invoice>(i => i.SalesOrderId);
        });

        builder.Entity<SalesOrderLine>(e =>
        {
            e.Property(x => x.UnitPrice).HasPrecision(18, 2);
            e.Property(x => x.LineTotal).HasPrecision(18, 2);
        });

        builder.Entity<Invoice>(e =>
        {
            e.HasIndex(x => x.InvoiceNumber).IsUnique();
            e.Property(x => x.SubTotal).HasPrecision(18, 2);
            e.Property(x => x.DiscountAmount).HasPrecision(18, 2);
            e.Property(x => x.CgstAmount).HasPrecision(18, 2);
            e.Property(x => x.SgstAmount).HasPrecision(18, 2);
            e.Property(x => x.IgstAmount).HasPrecision(18, 2);
            e.Property(x => x.TotalAmount).HasPrecision(18, 2);
            e.Property(x => x.AmountPaid).HasPrecision(18, 2);
        });

        builder.Entity<InvoiceLine>(e =>
        {
            e.Property(x => x.UnitPrice).HasPrecision(18, 2);
            e.Property(x => x.GstRatePercent).HasPrecision(5, 2);
            e.Property(x => x.TaxableAmount).HasPrecision(18, 2);
            e.Property(x => x.DiscountAmount).HasPrecision(18, 2);
            e.Property(x => x.CgstAmount).HasPrecision(18, 2);
            e.Property(x => x.SgstAmount).HasPrecision(18, 2);
            e.Property(x => x.IgstAmount).HasPrecision(18, 2);
            e.Property(x => x.LineTotal).HasPrecision(18, 2);
        });

        builder.Entity<Payment>(e =>
        {
            e.Property(x => x.Amount).HasPrecision(18, 2);
        });
    }
}
