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
    <div className="grid grid-cols-1 gap-2">
      {properties.map((prop, index) => (
        <PropertyDisplay key={index} property={prop} />
      ))}
    </div>
  );
}

export function PropertyDisplay({ property }: { property: AlertProperty }) {
  const propName = property.property.toLowerCase();
  
  // Safely parse optimalValue
  const optimalValue = property.optimalValue !== undefined && property.optimalValue !== null 
    ? Number(property.optimalValue) 
    : 0;
    
  const range = property.range !== undefined && property.range !== null
    ? Number(property.range)
    : 0;

  const formattedValue = !isNaN(optimalValue) 
    ? optimalValue.toFixed(1).replace(/\.?0+$/, "") 
    : "0";

  return (
    <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm transition-all hover:border-gray-200">
      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-sm border border-gray-100 shrink-0">
        {propName === "windspeed" && getWindEmoji(optimalValue)}
        {propName === "swellheight" && getSwellEmoji(optimalValue)}
        {propName === "winddirection" && "🧭"}
        {propName === "swellperiod" && "⏱️"}
        {propName === "swelldirection" && "🧭"}
      </div>
      
      <div className="flex-1 min-w-0">
        <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.1em] block leading-none mb-1">
          {formatPropertyName(property.property)}
        </span>
        <div className="flex items-baseline gap-2">
          <p className="text-sm font-bold text-gray-900 leading-none">
            {propName.includes("direction")
              ? `${degreesToCardinal(optimalValue)} (${formattedValue}°)`
              : `${formattedValue} ${getUnit(property.property)}`}
          </p>
          <span className="text-[10px] font-medium text-gray-400">
            ±{range}{getUnit(property.property)}
          </span>
        </div>
      </div>
    </div>
  );
}
