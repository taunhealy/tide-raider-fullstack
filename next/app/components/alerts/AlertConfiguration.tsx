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
}: AlertConfigurationProps) {
  // Use the context directly
  const {
    alertConfig,
    setAlertConfig,
    selectedLogEntry,
    properties,
    updateProperty,
    removeProperty,
    addProperty,
    getPropertyUnit,
    getPropertyMaxRange,
    getPropertyStep,
    setProperties,
    creationMode,
    beachDetails,
  } = useAlert();

  // Get the appropriate max range and step for each property
  const getPropertyConfig = (propertyId: string) => {
    return {
      maxRange: getPropertyMaxRange(propertyId),
      step: getPropertyStep(propertyId),
      unit: getPropertyUnit(propertyId),
    };
  };

  // Update the useEffect to properly handle beach details
  useEffect(() => {
    if (creationMode === "beachVariables" && beachDetails) {
      // Convert cardinal wind direction to degrees
      const windDegrees = beachDetails.optimalWindDirections?.[0]
        ? cardinalToDegreesMap[beachDetails.optimalWindDirections[0]]
        : 0;

      const initialProperties = [
        {
          property: "windSpeed" as ForecastProperty,
          range: 2,
          optimalValue: 0, // Wind speed is not stored in beach data
        },
        {
          property: "windDirection" as ForecastProperty,
          range: 10,
          optimalValue: windDegrees,
        },
        {
          property: "swellHeight" as ForecastProperty,
          range: 0.2,
          optimalValue:
            (beachDetails.swellSize.min + beachDetails.swellSize.max) / 2,
        },
        {
          property: "swellPeriod" as ForecastProperty,
          range: 1,
          optimalValue:
            (beachDetails.idealSwellPeriod.min +
              beachDetails.idealSwellPeriod.max) /
            2,
        },
        {
          property: "swellDirection" as ForecastProperty,
          range: 10,
          optimalValue:
            (beachDetails.optimalSwellDirections.min +
              beachDetails.optimalSwellDirections.max) /
            2,
        },
      ];
      setProperties(initialProperties);
    }
  }, [beachDetails, creationMode, setProperties]);

  const handlePropertyUpdate = (
    index: number,
    key: "property" | "range" | "optimalValue",
    value: ForecastProperty | number
  ) => {
    updateProperty({ index, key, value });
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="font-primary">Alert Conditions</CardTitle>
        <CardDescription className="font-primary">
          Set up alerts for specific surf conditions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <Label className="text-lg font-semibold font-primary text-gray-600">
              Forecast Properties
            </Label>
          </div>

          <div className="space-y-4">
            {(properties.length > 0 ? properties : defaultProperties).map(
              (prop, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border border-gray-200 bg-white"
                >
                  <div className="flex justify-between items-center mb-4">
                    <Label className="font-primary text-gray-700">
                      {prop.property === "windSpeed"
                        ? "Wind Speed"
                        : prop.property === "windDirection"
                          ? "Wind Direction"
                          : prop.property === "swellHeight"
                            ? "Swell Height"
                            : prop.property === "swellPeriod"
                              ? "Swell Period"
                              : "Swell Direction"}
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="font-primary text-sm text-gray-600">
                        Optimal Value
                      </Label>
                      <span className="text-sm text-gray-500 font-primary">
                        {prop.property.includes("Direction")
                          ? `${degreesToCardinal(prop.optimalValue)} (${prop.optimalValue}°)`
                          : `${prop.optimalValue} ${getPropertyUnit(prop.property)}`}
                      </span>
                    </div>
                    <Slider
                      value={[prop.optimalValue || 0]}
                      onValueChange={(value) =>
                        handlePropertyUpdate(index, "optimalValue", value[0])
                      }
                      max={getPropertyConfig(prop.property).maxRange * 2}
                      step={getPropertyConfig(prop.property).step}
                      className="[&>span]:bg-[var(--color-primary)]"
                    />
                  </div>

                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between">
                      <Label className="font-primary text-sm text-gray-600">
                        Accuracy Range
                      </Label>
                      <span className="text-sm text-gray-500 font-primary">
                        ±{prop.range} {getPropertyUnit(prop.property)}
                      </span>
                    </div>
                    <Slider
                      value={[prop.range]}
                      onValueChange={(value) =>
                        handlePropertyUpdate(index, "range", value[0])
                      }
                      max={getPropertyConfig(prop.property).maxRange}
                      step={getPropertyConfig(prop.property).step}
                      className="[&>span]:bg-[var(--color-tertiary)]"
                    />
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="font-primary">Notification Method</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="app-notification"
                checked={alertConfig.notificationMethod === "app"}
                onChange={(e) => {
                  if ((e.target as HTMLInputElement).checked) {
                    setAlertConfig({
                      ...alertConfig,
                      notificationMethod: "app" as NotificationMethod,
                      contactInfo: "app-notification",
                    });
                  }
                }}
              />
              <Label
                htmlFor="app-notification"
                className="font-primary cursor-pointer"
              >
                In-App Notification
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="email-notification"
                checked={alertConfig.notificationMethod === "email"}
                onChange={(e) => {
                  if ((e.target as HTMLInputElement).checked) {
                    setAlertConfig({
                      ...alertConfig,
                      notificationMethod: "email" as NotificationMethod,
                    });
                  }
                }}
              />
              <Label
                htmlFor="email-notification"
                className="font-primary cursor-pointer"
              >
                Email
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="whatsapp-notification"
                checked={alertConfig.notificationMethod === "whatsapp"}
                disabled={true}
                onChange={(e) => {
                  if ((e.target as HTMLInputElement).checked) {
                    setAlertConfig({
                      ...alertConfig,
                      notificationMethod: "whatsapp" as NotificationMethod,
                    });
                  }
                }}
              />
              <Label
                htmlFor="whatsapp-notification"
                className="font-primary cursor-pointer text-gray-400"
              >
                WhatsApp (Coming Soon)
              </Label>
            </div>

            {alertConfig.notificationMethod === "email" && (
              <div className="mt-2">
                <Label
                  htmlFor="contact-info"
                  className="font-primary mb-1 block"
                >
                  Email Address
                </Label>
                <input
                  id="contact-info"
                  type="email"
                  value={alertConfig.contactInfo || ""}
                  onChange={(e) => {
                    setAlertConfig({
                      ...alertConfig,
                      contactInfo: e.target.value,
                    });
                  }}
                  placeholder="Enter your email address"
                  className="w-full p-2 border rounded-md font-primary"
                  required
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="active"
            checked={alertConfig.active}
            onChange={(e) =>
              setAlertConfig({
                ...alertConfig,
                active: (e.target as HTMLInputElement).checked,
              })
            }
          />
          <Label htmlFor="active" className="font-primary">
            Alert Active
          </Label>
        </div>
      </CardContent>

      {!isEmbedded && (
        <CardFooter>
          <Button
            onClick={() => {
              // No need for onSave since we're directly updating the context
            }}
            className="w-full font-primary"
          >
            Save Alert
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
