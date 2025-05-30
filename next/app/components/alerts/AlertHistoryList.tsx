import { AlertCheck } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle, XCircle } from "lucide-react";

interface AlertHistoryListProps {
  checks: AlertCheck[];
}

export function AlertHistoryList({ checks }: AlertHistoryListProps) {
  if (checks.length === 0) {
    return (
      <p className="font-primary text-gray-500 text-sm">
        No history available for this alert yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {checks.map((check) => (
        <div
          key={check.id}
          className="flex items-start gap-3 p-3 bg-gray-50 rounded-md"
        >
          {check.success ? (
            <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-primary text-sm font-medium">
              {check.success ? "Alert conditions met" : "No match found"}
            </p>
            <p className="font-primary text-xs text-gray-500">
              {formatDistanceToNow(new Date(check.checkedAt), {
                addSuffix: true,
              })}
            </p>
            {check.details && (
              <p className="font-primary text-xs text-gray-600 mt-1">
                {check.details}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
