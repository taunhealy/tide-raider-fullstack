import React, { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/Button";
import { Label } from "@/app/components/ui/label";
import { Slider } from "@/app/components/ui/slider";
import { Switch } from "@/app/components/ui/switch";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/Card";
import { AlertConfigTypes, AlertConfig } from "@/app/types/alerts";
import { ForecastProperty } from "@/app/types/alerts";
import { Checkbox } from "@/app/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { StarIcon } from "lucide-react";
import { BasicSelect, BasicOption } from "@/app/components/ui/basicselect";

import { NotificationMethod } from "@/app/types/alerts";
import { cn } from "@/app/lib/utils";
import { X } from "lucide-react";
import { LogEntry } from "@/app/types/raidlogs";

interface AlertConfigurationProps {
  onSave: (config: AlertConfigTypes) => void;
  existingConfig?: AlertConfigTypes;
  selectedLogEntry?: LogEntry | null;
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

export function AlertConfiguration({
  onSave,
  existingConfig,
  selectedLogEntry,
  isEmbedded = false,
}: AlertConfigurationProps) {
  const [alertConfig, setAlertConfig] = useState<AlertConfigTypes>({
    ...((existingConfig as AlertConfig) || {
      id: undefined,
      name: "",
      region: selectedLogEntry?.region || null,
      notificationMethod: (existingConfig?.notificationMethod || "email") as
        | "email"
        | "whatsapp",
      contactInfo: "",
      active: true,
      forecastDate: new Date(),
      alertType: existingConfig?.alertType || "variables",
      userId: "",
      logEntryId: null,
      starRating: existingConfig?.starRating || null,
      forecast: null,
      logEntry: null,
      forecastId: null,
    }),
    // Ensure properties array always exists
    properties: existingConfig?.properties || [
      { property: "windSpeed" as ForecastProperty, range: 2 },
      { property: "windDirection" as ForecastProperty, range: 10 },
      { property: "swellHeight" as ForecastProperty, range: 0.2 },
      { property: "swellPeriod" as ForecastProperty, range: 1 },
      { property: "swellDirection" as ForecastProperty, range: 10 },
    ],
  });

  useEffect(() => {
    if (selectedLogEntry?.region && !alertConfig.region) {
      setAlertConfig((prev) => ({
        ...prev,
        region: selectedLogEntry.region || null,
      }));
    }
  }, [selectedLogEntry, alertConfig.region]);

  const handlePropertyChange = (index: number, field: string, value: any) => {
    const updatedProperties = [...alertConfig.properties];
    updatedProperties[index] = { ...updatedProperties[index], [field]: value };
    const updatedConfig = { ...alertConfig, properties: updatedProperties };
    setAlertConfig(updatedConfig);
    onSave(updatedConfig);
  };

  const addProperty = () => {
    const usedProperties = new Set(
      alertConfig.properties.map((p) => p.property)
    );

    const availableProperty =
      (forecastProperties.find((p) => !usedProperties.has(p.id))
        ?.id as ForecastProperty) || ("windSpeed" as ForecastProperty);

    setAlertConfig({
      ...alertConfig,
      properties: [
        ...alertConfig.properties,
        {
          property: availableProperty,
          range: getPropertyConfig(availableProperty).step * 10,
        },
      ],
    });
  };

  const removeProperty = (index: number) => {
    const updatedProperties = alertConfig.properties.filter(
      (_, i) => i !== index
    );
    setAlertConfig({ ...alertConfig, properties: updatedProperties });
  };

  // Get the appropriate max range and step for each property
  const getPropertyConfig = (propertyId: string) => {
    const prop = forecastProperties.find((p) => p.id === propertyId);
    return {
      maxRange: prop?.maxRange || 10,
      step: propertyId.includes("Height")
        ? 0.1
        : propertyId.includes("Period")
          ? 0.1
          : propertyId.includes("Direction")
            ? 1
            : 1,
      unit: prop?.unit || "",
    };
  };

  // Inside the component, transform the LogEntry to the expected format
  const logEntryForConfig = selectedLogEntry
    ? {
        forecast: selectedLogEntry.forecast,
        region: selectedLogEntry.region || null,
      }
    : null;

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="font-primary">Alert Configuration</CardTitle>
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addProperty}
              className="font-primary"
            >
              Add Property
            </Button>
          </div>

          <div className="space-y-4">
            {alertConfig.properties.map((prop, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border border-gray-200 bg-white"
              >
                <div className="flex justify-between items-center mb-4">
                  <Label className="font-primary text-gray-700">
                    Property {index + 1}
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeProperty(index)}
                    className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <BasicSelect
                    value={prop.property}
                    onValueChange={(value: string) =>
                      handlePropertyChange(index, "property", value)
                    }
                    className="font-primary"
                  >
                    {forecastProperties.map((forecastProp) => (
                      <BasicOption
                        key={forecastProp.id}
                        value={forecastProp.id}
                      >
                        {forecastProp.name}
                      </BasicOption>
                    ))}
                  </BasicSelect>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="font-primary text-sm text-gray-600">
                        Accuracy Range
                      </Label>
                      <span className="text-sm text-gray-500 font-primary">
                        ±{prop.range} {getPropertyConfig(prop.property).unit}
                      </span>
                    </div>
                    <Slider
                      value={[prop.range]}
                      onValueChange={(value) =>
                        handlePropertyChange(index, "range", value[0])
                      }
                      max={getPropertyConfig(prop.property).maxRange}
                      step={getPropertyConfig(prop.property).step}
                      className="[&>span]:bg-[var(--color-tertiary)]"
                    />
                  </div>
                </div>
              </div>
            ))}
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
                    setAlertConfig((prev) => ({
                      ...prev,
                      notificationMethod: "app" as NotificationMethod,
                      contactInfo: "", // Clear contact info as it's not needed for in-app
                    }));
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
                    setAlertConfig((prev) => ({
                      ...prev,
                      notificationMethod: "email" as NotificationMethod,
                    }));
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
                    setAlertConfig((prev) => ({
                      ...prev,
                      notificationMethod: "whatsapp" as NotificationMethod,
                    }));
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
            onClick={() => onSave(alertConfig)}
            className="w-full font-primary"
          >
            Save Alert
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
