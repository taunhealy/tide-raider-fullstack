import { formatDate } from "@/app/lib/utils/dateUtils";
import {
  getWindEmoji,
  getSwellEmoji,
  degreesToCardinal,
} from "@/app/lib/forecastUtils";
import { Alert, AlertProperty, AlertType } from "@prisma/client";

interface AlertDetailCardProps {
  alert: Alert & {
    logEntry?: {
      beach?: { name: string } | null;
      forecast?: Record<string, any> | null;
    } | null;
  };
  alertProperties: AlertProperty[];
}

export function AlertDetailCard({
  alert,
  alertProperties,
}: AlertDetailCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="font-primary text-lg font-semibold mb-4">
        Alert Conditions
      </h2>

      {alert.alertType === AlertType.VARIABLES && (
        <div className="space-y-4">
          <p className="font-primary text-sm text-gray-600">
            Alert Triggers When:
          </p>
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            {alertProperties.map((prop) => {
              const forecastValue = alert.logEntry?.forecast?.[prop.property];
              const propName = prop.property.toLowerCase();
              const isWind = propName.includes("wind");
              const isSwell = propName.includes("swell");

              return (
                <div
                  key={prop.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    {propName === "windspeed" && (
                      <span>{getWindEmoji(forecastValue)}</span>
                    )}
                    {propName === "swellheight" && (
                      <span>{getSwellEmoji(forecastValue)}</span>
                    )}
                    <span className="font-medium">
                      {formatPropertyName(prop.property)}:{" "}
                      {propName.includes("direction")
                        ? `${degreesToCardinal(forecastValue)} (${forecastValue}°)`
                        : `${forecastValue} ${getUnit(prop.property)}`}
                    </span>
                  </div>
                  <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-primary bg-gray-200 text-gray-700">
                    <span>
                      ±{prop.range} {getUnit(prop.property)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="font-primary text-sm text-gray-600">
            Reference date: {formatDate(alert.forecastDate)}
          </p>
        </div>
      )}

      {alert.alertType === AlertType.RATING && (
        <div>
          <p className="font-primary text-sm text-gray-600">
            This alert will notify you when{" "}
            {alert.logEntry?.beach?.name || "the beach"}
            receives a star rating of {alert.starRating} or higher.
          </p>
        </div>
      )}
    </div>
  );
}

function formatPropertyName(property: string): string {
  // Convert camelCase to Title Case with spaces
  const formatted = property.replace(/([A-Z])/g, " $1");
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function getUnit(property: string): string {
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
