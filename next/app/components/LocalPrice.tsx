"use client";

import { useCurrencyConverter } from "@/app/hooks/useCurrencyConverter";
import { useEffect, useState } from "react";

interface LocalPriceProps {
  amount: number;
  showOriginal?: boolean;
}

export function formatPrice(amount: number) {
  // Always use en-ZA locale with explicit options
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
    // Force specific format settings
    currencyDisplay: "symbol",
    numberingSystem: "latn",
  }).format(amount);
}

export default function LocalPrice({
  amount,
  showOriginal = false,
}: LocalPriceProps) {
  const [mounted, setMounted] = useState(false);
  const { formatted, currency } = useCurrencyConverter(amount, "ZAR");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything until mounted (client-side)
  if (!mounted) {
    return null;
  }

  // Show converted price with original ZAR price in smaller text if requested
  if (showOriginal && currency !== "ZAR") {
    return (
      <div className="text-right">
        <div>{formatted}</div>
        <div className="text-sm text-gray-500">{formatted}</div>
      </div>
    );
  }

  return <span className="text-gray-700 font-medium">{formatted}</span>;
}
