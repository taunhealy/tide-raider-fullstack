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

// Map source names to display names
const sourceMap: Record<string, string> = {
  WINDFINDER: "A",
  WINDGURU: "B",
  WINDY: "C",
};

const formatSourceName = (source: string): string => {
  return sourceMap[source.toUpperCase()] || source;
};

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
      className="bg-[var(--color-bg-primary)] rounded-lg overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md hover:border-[var(--color-border-medium)] h-full flex flex-col border border-[var(--color-border-light)] group"
    >
      <CardHeader className="pb-2 relative">
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center">
                  <Switch
                    checked={alert.active}
                    onCheckedChange={(checked) =>
                      onToggleActive(alert.id, checked)
                    }
                    className={cn(
                      "data-[state=checked]:bg-[var(--color-tertiary)]",
                      "data-[state=unchecked]:bg-gray-200"
                    )}
                    aria-label={
                      alert.active ? "Deactivate alert" : "Activate alert"
                    }
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="font-primary text-sm bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border-light)]">
                {alert.active ? "Alert is active" : "Alert is inactive"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="w-px h-4 bg-[var(--color-border-light)] mx-1" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(alert.id)}
            className="h-8 w-8 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(alert.id)}
            className="h-8 w-8 text-[var(--color-text-secondary)] hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <h3 className="text-lg font-primary font-bold text-[var(--color-text-primary)] flex items-center pr-24 truncate">
          {alert.name}
        </h3>
        <p className="text-xs text-[var(--color-text-secondary)] font-primary font-medium uppercase tracking-wide">
          {alert.region?.name || alert.regionId}
        </p>
      </CardHeader>
      <CardContent className="flex-grow flex-1 pt-2">
        <div className="text-sm space-y-4 font-primary h-full flex flex-col">
          {/* Beach Badge */}
          {alert.beach?.name && (
            <div>
               <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--color-bg-secondary)] border border-[var(--color-border-light)] rounded-md text-sm font-medium text-[var(--color-text-primary)]">
                <span className="text-[var(--color-tertiary)]">📍</span>
                <span>{alert.beach.name}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
             <div className="flex flex-col gap-1 p-2 rounded-md bg-[var(--color-bg-secondary)]/50 border border-[var(--color-border-light)]/50">
               <span className="text-xs text-[var(--color-text-secondary)] font-medium uppercase">Notify Via</span>
               <div className="flex items-center gap-2 text-[var(--color-text-primary)] font-medium">
                  <span>🔔</span>
                  {formatNotificationMethod(alert.notificationMethod)}
               </div>
             </div>

             <div className="flex flex-col gap-1 p-2 rounded-md bg-[var(--color-bg-secondary)]/50 border border-[var(--color-border-light)]/50">
               <span className="text-xs text-[var(--color-text-secondary)] font-medium uppercase">Sources</span>
                <div className="flex items-center gap-2 text-[var(--color-text-primary)] font-medium">
                   <span>📡</span>
                   <span>
                     {alert.sources && alert.sources.length > 0
                       ? Array.from(new Set(alert.sources))
                           .map(formatSourceName)
                           .join(", ")
                       : "All"}
                   </span>
                </div>
             </div>
          </div>

          <div className="pt-2 border-t border-[var(--color-border-light)] mt-auto">
             <AlertConditions alert={alert} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AlertConditions({ alert }: { alert: Alert }) {
  if (alert.alertType === AlertType.VARIABLES && alert.properties) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase">Triggers When:</p>
        <AlertProperties properties={alert.properties} />
      </div>
    );
  }

  if (alert.alertType === AlertType.RATING) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase">Minimum Rating:</p>
        <div className="flex items-center justify-between bg-[var(--color-bg-secondary)] p-2.5 rounded-lg border border-[var(--color-border-light)]">
          <BlueStarRating score={alert.starRating ?? 0} outOfFive={true} />
          <span className="font-primary font-bold text-[var(--color-text-primary)] text-sm">{alert.starRating}+ Stars</span>
        </div>
      </div>
    );
  }

  return null;
}