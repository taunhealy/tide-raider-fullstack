// AlertCard.tsx
import { AlertType } from "@/app/types/alerts";
import { Alert, AlertProperty } from "@/app/types/alerts";
import { Card, CardContent, CardHeader } from "@/app/components/ui/Card";
import { Button } from "@/app/components/ui/Button";
import { Switch } from "@/app/components/ui/switch";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/app/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { AlertProperties } from "./AlertProperties";
import { BlueStarRating } from "@/app/lib/scoreDisplayBlueStars";
import { formatNotificationMethod } from "@/app/lib/formatters";

// Extended Alert type with optional relations
type AlertWithRelations = Alert & {
  properties?: AlertProperty[];
  beach?: {
    id: string;
    name: string;
  } | null;
  region?: {
    id: string;
    name: string;
  } | null;
};

interface AlertCardProps {
  alert: AlertWithRelations;
  onToggleActive: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}

export function AlertCard({
  alert,
  onToggleActive,
  onDelete,
  onEdit,
}: AlertCardProps) {
  return (
    <Card
      className={cn(
        "bg-white rounded-xl overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] h-full flex flex-col border border-gray-200",
        alert.active && "ring-1 ring-[var(--color-tertiary)]/50 shadow-lg shadow-[var(--color-tertiary)]/10"
      )}
    >
      <CardHeader className="pb-2 relative">
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Switch
                    checked={alert.active}
                    onCheckedChange={(checked) =>
                      onToggleActive(alert.id, checked)
                    }
                    className={cn(
                      "data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-gray-900 data-[state=checked]:to-[var(--color-tertiary)]",
                      "data-[state=unchecked]:bg-gray-200"
                    )}
                    aria-label={
                      alert.active ? "Deactivate alert" : "Activate alert"
                    }
                  />
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="font-primary text-sm">
                {alert.active ? "Alert is active" : "Alert is inactive"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(alert.id)}
            className="h-8 w-8 text-gray-400 hover:text-gray-900 hover:bg-gray-100"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(alert.id)}
            className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <h3 className="text-base font-primary font-bold text-gray-900 flex items-center pr-24">
          {alert.name}
        </h3>
      </CardHeader>
      <CardContent className="flex-grow flex-1">
        <div className="text-sm space-y-2 sm:space-y-3 font-primary h-full flex flex-col">
          <p className="text-gray-500">
            {alert.region?.name || alert.regionId}
          </p>

          {/* Beach Badge */}
          {alert.beach?.name && (
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-md text-sm font-medium text-gray-700">
                <span>{alert.beach.name}</span>
              </div>
            </div>
          )}

          <p className="text-gray-500">
            <span className="font-medium text-gray-700">🔔</span>{" "}
            {formatNotificationMethod(alert.notificationMethod)}
          </p>
          <AlertConditions alert={alert} />
        </div>
      </CardContent>
    </Card>
  );
}

function AlertConditions({ alert }: { alert: Alert }) {
  if (alert.alertType === AlertType.VARIABLES && alert.properties) {
    return <AlertProperties properties={alert.properties} />;
  }

  if (alert.alertType === AlertType.RATING) {
    return (
      <div className="mt-2 pt-2 border-t border-gray-200">
        <p className="font-medium mb-2">Alert for:</p>
        <div className="flex items-center mt-1 bg-gray-50 p-3 rounded-md">
          <BlueStarRating score={alert.starRating ?? 0} outOfFive={true} />
          <span className="ml-3 font-primary">{alert.starRating}+ Stars</span>
        </div>
      </div>
    );
  }

  return null;
}