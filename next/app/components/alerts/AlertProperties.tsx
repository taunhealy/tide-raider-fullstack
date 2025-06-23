// AlertProperties.tsx
import { AlertProperty } from "@prisma/client";
import {
  degreesToCardinal,
  getSwellEmoji,
  getWindEmoji,
} from "@/app/lib/forecastUtils";

interface AlertPropertiesProps {
  properties: AlertProperty[];
}

export function AlertProperties({ properties }: AlertPropertiesProps) {
  return (
    <div className="mt-2 pt-2 border-t border-gray-200">
      <p className="font-medium mb-2">Alert Triggers When:</p>
      <div className="flex flex-wrap gap-2">
        {properties.map((prop, index) => (
          <PropertyDisplay key={index} property={prop} />
        ))}
      </div>
    </div>
  );
}

function formatPropertyName(property: string): string {
  switch (property) {
    case "windSpeed":
      return "Wind Speed";
    case "windDirection":
      return "Wind Direction";
    case "swellHeight":
      return "Swell Height";
    case "swellPeriod":
      return "Swell Period";
    case "swellDirection":
      return "Swell Direction";
    default:
      return property;
  }
}

function getUnit(property: AlertProperty["property"]): string {
  switch (property.toLowerCase()) {
    case "windspeed":
      return "kts";
    case "winddirection":
    case "swelldirection":
      return "°";
    case "swellheight":
      return "m";
    case "swellperiod":
      return "s";
    default:
      return "";
  }
}

export function PropertyDisplay({ property }: { property: AlertProperty }) {
  const propName = property.property.toLowerCase();
  const isWind = propName.includes("wind");
  const isSwell = propName.includes("swell");
  const bgColor = isWind ? "bg-blue-50" : "bg-cyan-50";
  const textColor = isWind ? "text-blue-800" : "text-cyan-800";

  return (
    <div className={`flex items-center space-x-2 ${bgColor} p-2 rounded-md`}>
      {propName === "windspeed" && (
        <span className={textColor}>{getWindEmoji(property.optimalValue)}</span>
      )}
      {propName === "swellheight" && (
        <span className={textColor}>
          {getSwellEmoji(property.optimalValue)}
        </span>
      )}
      {propName === "winddirection" && <span className={textColor}>🧭</span>}
      {propName === "swellperiod" && <span className={textColor}>⏱️</span>}
      {propName === "swelldirection" && <span className={textColor}>🧭</span>}
      <div>
        <span className="text-gray-600 font-primary text-xs">
          {formatPropertyName(property.property)}
        </span>
        <p className={`font-medium ${textColor} font-primary text-sm`}>
          {propName.includes("direction")
            ? `${degreesToCardinal(property.optimalValue)} (${property.optimalValue}°)`
            : `${property.optimalValue} ${getUnit(property.property)}`}
        </p>
        <span className="text-xs text-gray-500">
          ±{property.range} {getUnit(property.property)}
        </span>
      </div>
    </div>
  );
}
