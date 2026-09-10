using DukaanOS.API.Core.Entities;
using DukaanOS.API.Core.Enums;

namespace DukaanOS.API.Core.Services;

public static class UnitConverter
{
    /// <summary>
    /// Converts human entered quantity and unit into base units (Grams, ML, Pieces, Packs).
    /// </summary>
    public static decimal ConvertToBaseUnit(Product product, decimal quantityEntered, string unitEntered)
    {
        var normalizedUnit = unitEntered.Trim().ToUpperInvariant();

        switch (product.UnitType)
        {
            case UnitType.KG:
                if (normalizedUnit == "G" || normalizedUnit == "GRAM" || normalizedUnit == "GRAMS")
                {
                    return quantityEntered; // Already in grams
                }
                if (normalizedUnit == "KG" || normalizedUnit == "KILO" || normalizedUnit == "KILOGRAM")
                {
                    return quantityEntered * 1000m; // 1.25kg -> 1250g
                }
                return quantityEntered * 1000m; // default to KG

            case UnitType.GRAM:
                if (normalizedUnit == "KG" || normalizedUnit == "KILO")
                {
                    return quantityEntered * 1000m;
                }
                return quantityEntered;

            case UnitType.LITRE:
                if (normalizedUnit == "ML" || normalizedUnit == "MILLILITRE")
                {
                    return quantityEntered; // Already in ML
                }
                return quantityEntered * 1000m; // 1.5L -> 1500ml

            case UnitType.ML:
                if (normalizedUnit == "L" || normalizedUnit == "LITRE")
                {
                    return quantityEntered * 1000m;
                }
                return quantityEntered;

            case UnitType.PIECE:
            case UnitType.PACK:
            default:
                return quantityEntered;
        }
    }

    /// <summary>
    /// Converts base units (Grams, ML) back to display major units (KG, Litre).
    /// </summary>
    public static decimal ConvertToMajorUnit(Product product, decimal quantityBaseUnit)
    {
        if (product.BaseUnitRatio <= 0) return quantityBaseUnit;
        return quantityBaseUnit / product.BaseUnitRatio;
    }

    /// <summary>
    /// Calculates line total based on selling price per major unit and quantity in base unit.
    /// Example: 350 grams of rice @ Rs. 350/kg = (350 / 1000) * 350 = 122.50
    /// </summary>
    public static decimal CalculateLineTotal(Product product, decimal quantityInBaseUnit, decimal pricePerMajorUnit)
    {
        if (product.BaseUnitRatio <= 0)
        {
            return Math.Round(quantityInBaseUnit * pricePerMajorUnit, 2);
        }

        var majorUnits = quantityInBaseUnit / product.BaseUnitRatio;
        return Math.Round(majorUnits * pricePerMajorUnit, 2);
    }
}

