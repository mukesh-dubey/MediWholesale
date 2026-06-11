using MediWholesale.Domain.Enums;

namespace MediWholesale.Infrastructure.Services;

public static class GstCalculator
{
    public record GstBreakdown(
        decimal TaxableAmount,
        decimal CgstAmount,
        decimal SgstAmount,
        decimal IgstAmount,
        decimal LineTotal);

    public static GstBreakdown CalculateLine(
        decimal unitPrice,
        int quantity,
        decimal gstRatePercent,
        GstSupplyType supplyType,
        decimal discountAmount = 0)
    {
        var taxable = Math.Max(0, Math.Round(unitPrice * quantity - discountAmount, 2));
        var tax = Math.Round(taxable * gstRatePercent / 100m, 2);

        if (supplyType == GstSupplyType.InterState)
        {
            return new GstBreakdown(taxable, 0, 0, tax, taxable + tax);
        }

        var half = Math.Round(tax / 2m, 2);
        return new GstBreakdown(taxable, half, half, 0, taxable + tax);
    }
}
