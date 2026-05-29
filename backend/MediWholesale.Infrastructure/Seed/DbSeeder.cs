using MediWholesale.Domain.Constants;
using MediWholesale.Domain.Entities;
using MediWholesale.Domain.Enums;
using MediWholesale.Infrastructure.Data;
using MediWholesale.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace MediWholesale.Infrastructure.Seed;

public static class DbSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.MigrateAsync();

        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        foreach (var role in AppRoles.All)
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole(role));
        }

        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        await SeedUser(userManager, "admin@mediwholesale.in", "Admin@123", "System Admin", AppRoles.Admin);
        await SeedUser(userManager, "staff@mediwholesale.in", "Staff@123", "Warehouse Staff", AppRoles.Staff);

        if (await db.CompanyProfiles.AnyAsync()) return;

        db.CompanyProfiles.Add(new CompanyProfile
        {
            BusinessName = "MediWholesale Distributors",
            Gstin = "29AAAAA0000A1Z5",
            DrugLicenseNumber = "DL-MH-2024-0001",
            Address = "123 Industrial Area",
            City = "Mumbai",
            State = "Maharashtra",
            PostalCode = "400001",
            Phone = "+91-9876543210",
            Email = "info@mediwholesale.in"
        });

        var hospital = new Customer
        {
            Name = "City General Hospital",
            CustomerType = CustomerType.Hospital,
            Phone = "+91-9123456780",
            Email = "purchase@cityhospital.in",
            Address = "45 Hospital Road",
            City = "Mumbai",
            State = "Maharashtra",
            PostalCode = "400002",
            Gstin = "27BBBBB0000B1Z5",
            DrugLicenseNumber = "DL-HOSP-001",
            CreditLimit = 500000,
            PaymentTermDays = 30
        };
        db.Customers.Add(hospital);

        var products = new[]
        {
            new Product { Sku = "MED-PARA-500", Name = "Paracetamol 500mg", GenericName = "Paracetamol", Category = "Tablet", Unit = "Strip", HsnCode = "30049099", GstRatePercent = 12, ReorderLevel = 50 },
            new Product { Sku = "MED-AMOX-250", Name = "Amoxicillin 250mg", GenericName = "Amoxicillin", Category = "Capsule", Unit = "Strip", HsnCode = "30041090", GstRatePercent = 12, ReorderLevel = 30, IsPrescriptionRequired = true },
            new Product { Sku = "MED-OMEP-20", Name = "Omeprazole 20mg", GenericName = "Omeprazole", Category = "Capsule", Unit = "Strip", HsnCode = "30049099", GstRatePercent = 12, ReorderLevel = 40 }
        };
        db.Products.AddRange(products);
        await db.SaveChangesAsync();

        db.BatchStocks.AddRange(
            new BatchStock { ProductId = products[0].Id, BatchNumber = "BATCH-2026-001", ExpiryDate = new DateTime(2027, 6, 30), Quantity = 500, PurchaseRate = 25, SaleRate = 35, Mrp = 45, Manufacturer = "ABC Pharma" },
            new BatchStock { ProductId = products[1].Id, BatchNumber = "BATCH-2026-002", ExpiryDate = new DateTime(2027, 3, 15), Quantity = 200, PurchaseRate = 55, SaleRate = 72, Mrp = 85, Manufacturer = "XYZ Medicines" },
            new BatchStock { ProductId = products[2].Id, BatchNumber = "BATCH-2026-003", ExpiryDate = new DateTime(2026, 12, 1), Quantity = 150, PurchaseRate = 40, SaleRate = 58, Mrp = 70, Manufacturer = "Gastro Plus" }
        );
        await db.SaveChangesAsync();

        var customerUser = await SeedUser(userManager, "customer@cityhospital.in", "Customer@123", "City Hospital Buyer", AppRoles.Customer);
        hospital.PortalUserId = customerUser.Id;
        hospital.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
    }

    private static async Task<ApplicationUser> SeedUser(
        UserManager<ApplicationUser> userManager,
        string email,
        string password,
        string fullName,
        string role)
    {
        var existing = await userManager.FindByEmailAsync(email);
        if (existing != null)
        {
            if (!await userManager.IsInRoleAsync(existing, role))
                await userManager.AddToRoleAsync(existing, role);
            return existing;
        }

        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            FullName = fullName,
            EmailConfirmed = true
        };
        await userManager.CreateAsync(user, password);
        await userManager.AddToRoleAsync(user, role);
        return user;
    }
}
