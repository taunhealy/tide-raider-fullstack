// AlertProperties.tsx
import { AlertProperty } from "@/app/types/alerts";
import {
  degreesToCardinal,
  getSwellEmoji,
  getWindEmoji,
  formatPropertyName,
  getUnit,
} from "@/app/lib/forecastUtils";

interface AlertPropertiesProps {
  properties: AlertProperty[];
}



export function AlertProperties({ properties }: AlertPropertiesProps) {
  return (
    <div className="mt-2 pt-2 border-t border-gray-700">
      <p className="font-medium mb-2 text-gray-300">Alert Triggers When:</p>
      <div className="flex flex-wrap gap-2">
        {properties.map((prop, index) => (
          <PropertyDisplay key={index} property={prop} />
        ))}
      </div>
    </div>
  );
}

export function PropertyDisplay({ property }: { property: AlertProperty }) {
  const propName = property.property.toLowerCase();
  const isWind = propName.includes("wind");
  const isSwell = propName.includes("swell");
  const bgColor = isWind ? "bg-blue-900/30" : "bg-cyan-900/30";
  const textColor = isWind ? "text-blue-300" : "text-cyan-300";
  const optimalValue = property.optimalValue ?? 0; // Default to 0 if undefined

  return (
    <div className={`flex items-center space-x-2 ${bgColor} p-2 rounded-md border border-gray-700/50`}>
      {propName === "windspeed" && (
        <span className={textColor}>{getWindEmoji(optimalValue)}</span>
      )}
      {propName === "swellheight" && (
        <span className={textColor}>{getSwellEmoji(optimalValue)}</span>
      )}
      {propName === "winddirection" && <span className={textColor}>🧭</span>}
      {propName === "swellperiod" && <span className={textColor}>⏱️</span>}
      {propName === "swelldirection" && <span className={textColor}>🧭</span>}
      <div>
        <span className="text-gray-400 font-primary text-xs">
          {formatPropertyName(property.property)}
        </span>
        <p className={`font-medium ${textColor} font-primary text-sm`}>
          {propName.includes("direction")
            ? `${degreesToCardinal(optimalValue)} (${optimalValue}°)`
            : `${optimalValue} ${getUnit(property.property)}`}
        </p>
        <span className="text-xs text-gray-500">
          ±{property.range} {getUnit(property.property)}
        </span>
      </div>
    </div>
  );
}
