// AlertCard.tsx
import { Alert as PrismaAlert, AlertType, AlertProperty } from "@prisma/client";
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
import { StarRating } from "./StarRating";
import { formatNotificationMethod } from "@/app/lib/formatters";

// Create an extended type that includes the properties relation
type Alert = PrismaAlert & {
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
  alert: Alert;
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
        "bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col",
        !alert.logEntryId && "border-black-400 hover:border-black-500"
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
            className="h-8 w-8 hover:bg-gray-100"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(alert.id)}
            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <h3 className="text-base font-primary text-gray-900 flex items-center pr-24">
          {alert.name}
        </h3>
      </CardHeader>
      <CardContent className="flex-grow flex-1">
        <div className="text-sm space-y-2 sm:space-y-3 font-primary h-full flex flex-col">
          <p className="text-gray-500">{alert.region?.name || alert.regionId}</p>
          
          {/* Beach Badge */}
          {alert.beach?.name && (
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-md text-sm font-medium text-amber-900">
                <span>{alert.beach.name}</span>
              </div>
            </div>
          )}
          
          <p className="text-gray-500">
            <span className="font-medium text-gray-900">🔔</span>{" "}
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
    return <StarRating rating={alert.starRating} />;
  }

  return null;
}
