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
    <div className="mt-2 pt-2 border-t border-gray-200">

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
  const bgColor = isWind || isSwell ? "bg-[var(--color-tertiary)]/10" : "bg-[var(--color-primary)]/5";
  const textColor = "text-gray-900";
  
  // Safely parse optimalValue
  const optimalValue = property.optimalValue !== undefined && property.optimalValue !== null 
    ? Number(property.optimalValue) 
    : 0;
    
  const range = property.range !== undefined && property.range !== null
    ? Number(property.range)
    : 0;

  const formattedValue = !isNaN(optimalValue) 
    ? optimalValue.toFixed(2).replace(/\.?0+$/, "") 
    : "0";

  return (
    <div className={`flex items-center space-x-2 ${bgColor} p-2 rounded-md border border-[var(--color-tertiary)]/20`}>
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
        <span className="text-gray-600 font-primary text-xs">
          {formatPropertyName(property.property)}
        </span>
        <p className={`font-medium ${textColor} font-primary text-sm`}>
          {propName.includes("direction")
            ? `${degreesToCardinal(optimalValue)} (${formattedValue}°)`
            : `${formattedValue} ${getUnit(property.property)}`}
        </p>
        <span className="text-xs text-gray-500">
          ±{range} {getUnit(property.property)}
        </span>
      </div>
    </div>
  );
}
