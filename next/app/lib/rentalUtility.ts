import { PACKAGE_PRICES, RentalItemType } from "@/app/lib/rentals/constants";

export function calculateRentalCost(
  weeks: number,
  itemType: RentalItemType
): {
  usdAmount: number;
} {
  // Calculate number of 2-week packages needed
  const boardRentalPackageQty = Math.ceil(weeks / 2);

  // Get the package rate for this item type
  const packageRate = PACKAGE_PRICES[itemType]; // Default to surfboard rate if type not found

  return {
    usdAmount: packageRate * boardRentalPackageQty,
  };
}

// Calculate daily price based on the package price
export function calculateDailyPrice(itemType: RentalItemType): number {
  // Get the package rate for this item type (2-week package)
  const packageRate = PACKAGE_PRICES[itemType];

  // Calculate daily rate (package rate divided by 14 days)
  return Math.round(packageRate / 14);
}
