import { formatDate } from "@/app/lib/utils/dateUtils";

interface AlertDetailCardProps {
  alert: any; // Use any to bypass the type checking temporarily
  alertProperties: any[];
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

      {alert.alertType === "variables" && (
        <div className="space-y-4">
          <p className="font-primary text-sm text-gray-600">
            This alert will notify you when forecast conditions match these
            parameters:
          </p>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-primary"
                  >
                    Condition
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-primary"
                  >
                    Reference Value
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-primary"
                  >
                    Acceptable Range
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {alertProperties.map((prop, index) => {
                  // Get the reference value from the forecast
                  const forecastValue =
                    alert.logEntry?.forecast?.[prop.property];

                  return (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-primary">
                        {formatPropertyName(prop.property)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-primary">
                        {forecastValue !== undefined ? forecastValue : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-primary">
                        ±{prop.range || "0"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="font-primary text-sm text-gray-600 mt-4">
            Reference date: {formatDate(alert.forecastDate)}
          </p>
        </div>
      )}

      {alert.alertType === "rating" && (
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
