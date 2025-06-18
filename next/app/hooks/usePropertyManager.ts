// hooks/usePropertyManager.ts
import { useState, useCallback } from "react";
import {
  AlertConfigTypes,
  AlertProperty,
  ForecastProperty,
} from "@/app/types/alerts";

type PropertyUpdateAction = {
  index: number;
  key: "property" | "range" | "optimalValue";
  value: ForecastProperty | number;
};

const defaultProperties = [
  { property: "windSpeed" as ForecastProperty, range: 2, optimalValue: 0 },
  { property: "windDirection" as ForecastProperty, range: 10, optimalValue: 0 },
  { property: "swellHeight" as ForecastProperty, range: 0.2, optimalValue: 0 },
  { property: "swellPeriod" as ForecastProperty, range: 1, optimalValue: 0 },
  {
    property: "swellDirection" as ForecastProperty,
    range: 10,
    optimalValue: 0,
  },
];

const getPropertyConfig = (propertyId: string) => {
  const configs = {
    windSpeed: { maxRange: 15, step: 1, unit: "knots" },
    windDirection: { maxRange: 45, step: 1, unit: "°" },
    swellHeight: { maxRange: 2, step: 0.1, unit: "m" },
    swellPeriod: { maxRange: 5, step: 0.1, unit: "s" },
    swellDirection: { maxRange: 45, step: 1, unit: "°" },
  };

  return (
    configs[propertyId as keyof typeof configs] || {
      maxRange: 10,
      step: 0.1,
      unit: "",
    }
  );
};

export function usePropertyManager(initialProperties: AlertProperty[]) {
  const [properties, setProperties] =
    useState<AlertProperty[]>(initialProperties);

  const updateProperty = useCallback(
    ({ index, key, value }: PropertyUpdateAction) => {
      setProperties((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          [key]: value,
        };
        return updated;
      });
    },
    []
  );

  const removeProperty = useCallback((index: number) => {
    setProperties((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  }, []);

  const addProperty = useCallback(() => {
    const usedProperties = new Set(properties.map((p) => p.property));
    const availableProperty =
      (Object.keys(getPropertyConfig("")).find(
        (p) => !usedProperties.has(p as ForecastProperty)
      ) as ForecastProperty) || "windSpeed";

    setProperties((prev) => [
      ...prev,
      {
        property: availableProperty,
        range: getPropertyConfig(availableProperty).step * 10,
        optimalValue: 0,
      },
    ]);
  }, [properties]);

  const resetProperties = useCallback(() => {
    setProperties(defaultProperties);
  }, []);

  const getPropertyUnit = useCallback((property: string): string => {
    return getPropertyConfig(property).unit;
  }, []);

  const getPropertyMaxRange = useCallback((property: string): number => {
    return getPropertyConfig(property).maxRange;
  }, []);

  const getPropertyStep = useCallback((property: string): number => {
    return getPropertyConfig(property).step;
  }, []);

  return {
    properties,
    setProperties,
    updateProperty,
    removeProperty,
    addProperty,
    resetProperties,
    getPropertyUnit,
    getPropertyMaxRange,
    getPropertyStep,
  };
}
