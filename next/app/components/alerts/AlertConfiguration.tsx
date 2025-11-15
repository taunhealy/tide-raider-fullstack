import React, { useEffect, useCallback } from "react";
import { Button } from "@/app/components/ui/Button";
import { Label } from "@/app/components/ui/label";
import { Slider } from "@/app/components/ui/slider";
import { Switch } from "@/app/components/ui/switch";
import { useAlert } from "@/app/context/AlertContext"; // Import the context hook

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/Card";
import { ForecastProperty } from "@/app/types/alerts";
import { Checkbox } from "@/app/components/ui/checkbox";

import { BasicSelect, BasicOption } from "@/app/components/ui/basicselect";

import { NotificationMethod } from "@/app/types/alerts";
import { X } from "lucide-react";
import { LogEntry } from "@/app/types/raidlogs";
import {
  cardinalToDegreesMap,
  degreesToCardinal,
} from "@/app/lib/directionUtils";
import { useState } from "react";

interface AlertConfigurationProps {
  isEmbedded?: boolean;
}

const forecastProperties: Array<{
  id: ForecastProperty;
  name: string;
  unit: string;
  maxRange: number;
}> = [
  { id: "windSpeed", name: "Wind Speed", unit: "knots", maxRange: 15 },
  { id: "windDirection", name: "Wind Direction", unit: "°", maxRange: 45 },
  { id: "swellHeight", name: "Swell Height", unit: "m", maxRange: 2 },
  { id: "swellPeriod", name: "Swell Period", unit: "s", maxRange: 5 },
  { id: "swellDirection", name: "Swell Direction", unit: "°", maxRange: 45 },
];

const defaultProperties = [
  {
    property: "windSpeed" as ForecastProperty,
    range: 2,
    optimalValue: 0,
  },
  {
    property: "windDirection" as ForecastProperty,
    range: 10,
    optimalValue: 0,
  },
  {
    property: "swellHeight" as ForecastProperty,
    range: 0.2,
    optimalValue: 0,
  },
  {
    property: "swellPeriod" as ForecastProperty,
    range: 1,
    optimalValue: 0,
  },
  {
    property: "swellDirection" as ForecastProperty,
    range: 10,
    optimalValue: 0,
  },
];

export function AlertConfiguration({
  isEmbedded = false,
}: AlertConfigurationProps = {}) {
  const { alert, updateAlert, beachDetails } = useAlert();
  const [properties, setProperties] = useState<typeof defaultProperties>([]);

  // Initialize properties - first check if alert already has properties, otherwise use beachDetails
  useEffect(() => {
    // If alert already has properties, use those
    if (
      Array.isArray(alert.properties?.create) &&
      alert.properties.create.length > 0
    ) {
      const existingProperties = alert.properties.create.map((prop) => ({
        property: prop.property as ForecastProperty,
        range: Number(prop.range),
        optimalValue: Number(prop.optimalValue),
      }));
      setProperties(existingProperties);
      return;
    }

    // Otherwise, initialize from beachDetails if available
    if (!beachDetails) return;

    const initialProperties = [
      {
        property: "windSpeed" as ForecastProperty,
        range: 2,
        optimalValue: 10,
      },
      {
        property: "windDirection" as ForecastProperty,
        range: 10,
        // Take first optimal wind direction or default to 0
        optimalValue: beachDetails.optimalWindDirections?.[0]
          ? Number(beachDetails.optimalWindDirections[0])
          : 0,
      },
      {
        property: "swellHeight" as ForecastProperty,
        range: 0.2,
        // Use average of min/max swell size
        optimalValue:
          typeof beachDetails.swellSize === "object"
            ? (Number(beachDetails.swellSize.min) +
                Number(beachDetails.swellSize.max)) /
              2
            : 1,
      },
      {
        property: "swellPeriod" as ForecastProperty,
        range: 1,
        // Use average of ideal swell period
        optimalValue:
          typeof beachDetails.idealSwellPeriod === "object"
            ? (Number(beachDetails.idealSwellPeriod.min) +
                Number(beachDetails.idealSwellPeriod.max)) /
              2
            : 10,
      },
      {
        property: "swellDirection" as ForecastProperty,
        range: 10,
        // Take first optimal swell direction or default to 0
        optimalValue:
          typeof beachDetails.optimalSwellDirections === "object"
            ? Number(beachDetails.optimalSwellDirections.min)
            : 0,
      },
    ];

    setProperties(initialProperties);

    // Also update alert context with initial properties
    if (initialProperties.length > 0) {
      updateAlert({
        properties: { create: initialProperties },
      });
    }
  }, [beachDetails, alert.properties]); // Add alert.properties to dependencies

  const getConfig = (prop: ForecastProperty) =>
    ({
      windSpeed: { maxRange: 15, step: 1, unit: "knots", label: "Wind Speed" },
      windDirection: {
        maxRange: 360,
        step: 1,
        unit: "°",
        label: "Wind Direction",
      },
      swellHeight: { maxRange: 5, step: 0.1, unit: "m", label: "Swell Height" },
      swellPeriod: {
        maxRange: 20,
        step: 0.1,
        unit: "s",
        label: "Swell Period",
      },
      swellDirection: {
        maxRange: 360,
        step: 1,
        unit: "°",
        label: "Swell Direction",
      },
    })[prop];

  const formatValue = (value: number, property: ForecastProperty) => {
    const config = getConfig(property);
    if (property.includes("Direction")) {
      return `${value}° (${degreesToCardinal(value)})`;
    }
    return `${value}${config.unit}`;
  };

  const formatRange = (
    optimalValue: number,
    range: number,
    property: ForecastProperty
  ) => {
    const config = getConfig(property);
    const min = Math.max(0, optimalValue - range);
    const max = optimalValue + range;
    if (property.includes("Direction")) {
      return `${min.toFixed(1)}° - ${max.toFixed(1)}°`;
    }
    return `${min.toFixed(config.step < 1 ? 1 : 0)}${config.unit} - ${max.toFixed(config.step < 1 ? 1 : 0)}${config.unit}`;
  };

  return (
    <Card>
      {properties.map((prop, index) => (
        <div
          key={index}
          className="p-4 rounded-lg border border-gray-200 bg-white space-y-2"
        >
          <div className="flex justify-between items-center">
            <Label>{getConfig(prop.property).label}</Label>
            <div className="text-sm text-gray-600 space-y-1">
              <div className="font-medium">
                {formatValue(prop.optimalValue, prop.property)}
              </div>
              <div className="text-xs text-gray-500">
                Range:{" "}
                {formatRange(prop.optimalValue, prop.range, prop.property)}
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-xs text-gray-600">Optimal Value</Label>
                <span className="text-xs text-gray-500">
                  {formatValue(prop.optimalValue, prop.property)}
                </span>
              </div>
              <Slider
                value={[prop.optimalValue]}
                onValueChange={([value]) => {
                  const newProps = [...properties];
                  newProps[index] = { ...prop, optimalValue: value };
                  setProperties(newProps);
                  // Update alert context only when slider changes
                  updateAlert({
                    properties: { create: newProps },
                  });
                }}
                max={getConfig(prop.property).maxRange}
                step={getConfig(prop.property).step}
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-xs text-gray-600">
                  Variation Range (±)
                </Label>
                <span className="text-xs text-gray-500">
                  ±
                  {prop.range.toFixed(
                    getConfig(prop.property).step < 1 ? 1 : 0
                  )}
                  {getConfig(prop.property).unit}
                </span>
              </div>
              <Slider
                value={[prop.range]}
                onValueChange={([value]) => {
                  const newProps = [...properties];
                  newProps[index] = { ...prop, range: value };
                  setProperties(newProps);
                  // Update alert context only when slider changes
                  updateAlert({
                    properties: { create: newProps },
                  });
                }}
                max={getConfig(prop.property).maxRange / 2}
                step={getConfig(prop.property).step}
                min={0.1}
              />
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 pt-2 border-t">
            <span>
              Min:{" "}
              {
                formatRange(prop.optimalValue, prop.range, prop.property).split(
                  " - "
                )[0]
              }
            </span>
            <span>
              Max:{" "}
              {
                formatRange(prop.optimalValue, prop.range, prop.property).split(
                  " - "
                )[1]
              }
            </span>
          </div>
        </div>
      ))}
    </Card>
  );
}
