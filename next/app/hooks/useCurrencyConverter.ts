"use client";

import { useState, useEffect } from "react";

// Add consistent formatter
const zarFormatter = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: true,
  currencyDisplay: "symbol",
  numberingSystem: "latn",
});

export function useCurrencyConverter(
  amount: number,
  baseCurrency: string = "ZAR"
) {
  const [convertedAmount, setConvertedAmount] = useState(amount);
  const [currencyCode, setCurrencyCode] = useState(baseCurrency);
  const [locale, setLocale] = useState("en-ZA");

  useEffect(() => {
    async function convertToZAR() {
      try {
        // Use Frankfurter API directly for EUR to ZAR conversion
        const response = await fetch(
          `https://api.frankfurter.app/latest?from=${baseCurrency}&to=ZAR`
        );
        const data = await response.json();

        if (data.rates.ZAR) {
          setCurrencyCode("ZAR");
          setConvertedAmount(amount * data.rates.ZAR);
        } else {
          console.error("No ZAR exchange rate found");
          // Fallback to original amount and currency
          setConvertedAmount(amount);
          setCurrencyCode(baseCurrency);
        }
      } catch (error) {
        console.error("Currency conversion failed:", error);
        // Fallback to original amount and currency
        setConvertedAmount(amount);
        setCurrencyCode(baseCurrency);
      }
    }

    convertToZAR();
  }, [amount, baseCurrency]);

  return {
    amount: convertedAmount,
    currency: currencyCode,
    formatted: zarFormatter.format(convertedAmount),
  };
}
