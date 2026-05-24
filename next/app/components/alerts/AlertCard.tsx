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
  WINDFINDER: "Windfinder",
  WINDFINDER_SUPER: "Windfinder Super",
  WINDGURU: "Windguru",
  WINDY: "Windy",
  TIDE_RAIDER: "Tide Raider",
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
  isLocked?: boolean;
  onToggleActive: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}

export function AlertCard({
  alert,
  isLocked,
  onToggleActive,
  onDelete,
  onEdit,
}: AlertCardProps) {
  if (!alert) return null;

  return (
    <div
      className={cn(
        "relative group bg-white rounded-2xl transition-all duration-300 border border-gray-100 overflow-hidden h-full flex flex-col",
        alert.active ? "shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)]" : "opacity-75 grayscale-[0.2]",
        (isLocked || !alert.active) && "bg-gray-50/50"
      )}
      style={{ padding: "clamp(0.75rem, 3vw, 1.5rem)" }}
    >
      {/* Locked Overlay for Premium Alerts */}
      {isLocked && (
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-10 pointer-events-none" />
      )}

      {/* Header with Switch and Actions */}
      <div className="flex items-start justify-between relative z-20" style={{ marginBottom: "clamp(0.5rem, 2vw, 1.25rem)" }}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5" style={{ marginBottom: "2px" }}>
            <div className={cn(
               "w-2 h-2 md:w-2.5 md:h-2.5 rounded-full",
               alert.active ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-gray-300",
               isLocked && "bg-gray-400"
            )} />
            <span className="text-[clamp(8px,1.5vw,10px)] font-black uppercase tracking-[0.2em] text-gray-400">
              {isLocked ? "Premium Only" : (alert.active ? "Monitoring" : "Inactive")}
            </span>
          </div>
          <h3 className="text-[clamp(0.875rem,2vw,1.125rem)] font-bold text-gray-900 truncate leading-tight">
            {alert.name || "Unnamed Alert"}
          </h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[clamp(9px,1.5vw,11px)] font-bold text-gray-500 uppercase tracking-wide">
              {alert.region?.name || alert.regionId || "No Region"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100 shadow-sm">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="px-1.5 py-0.5">
                  <Switch
                    checked={!!alert.active}
                    disabled={isLocked}
                    onCheckedChange={(checked) =>
                      onToggleActive(alert.id, checked)
                    }
                    className="data-[state=checked]:bg-gray-900 scale-75 md:scale-90"
                    aria-label={
                      alert.active ? "Deactivate alert" : "Activate alert"
                    }
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-[10px] font-bold bg-gray-900 text-white border-none py-1 px-2">
                {isLocked ? "Upgrade Required" : (alert.active ? "Active" : "Disabled")}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="w-px h-4 bg-gray-200 mx-0.5" />
          <button
            onClick={() => onEdit(alert.id)}
            className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-white rounded-lg transition-all active:scale-95 hover:shadow-sm"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          {!isLocked && (
            <button
              onClick={() => onDelete(alert.id)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg transition-all active:scale-95 hover:shadow-sm"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-grow flex flex-col relative z-20" style={{ gap: "clamp(0.5rem, 2vw, 1rem)" }}>
        {/* Beach Badge */}
        {alert.beach?.name && (
          <div className="flex items-center gap-2 px-2.5 py-1 bg-gray-50 rounded-xl border border-gray-100 w-fit shadow-sm">
            <span className="text-xs">📍</span>
            <span className="text-[clamp(9px,1.5vw,12px)] font-bold text-gray-800 tracking-tight uppercase truncate max-w-[120px] md:max-w-[150px]">{alert.beach.name}</span>
          </div>
        )}
        
        {/* Notification & Source Matrix */}
        <div className="grid grid-cols-2 gap-2 md:gap-3">
           <div className="flex flex-col gap-0.5 p-2 md:p-3 rounded-2xl bg-gray-50/80 border border-gray-100 shadow-sm">
             <span className="text-[clamp(7px,1.2vw,9px)] font-black text-gray-400 uppercase tracking-[0.18em] leading-none">Notify Via</span>
             <div className="flex items-center gap-1.5 text-[clamp(10px,1.8vw,12px)] font-bold text-gray-900">
                <span className="text-xs md:text-sm">🔔</span>
                <span className="truncate">{formatNotificationMethod(alert.notificationMethod)}</span>
             </div>
           </div>
 
           <div className="flex flex-col gap-0.5 p-2 md:p-3 rounded-2xl bg-gray-50/80 border border-gray-100 shadow-sm">
             <span className="text-[clamp(7px,1.2vw,9px)] font-black text-gray-400 uppercase tracking-[0.18em] leading-none">Sources</span>
              <div className="flex items-center gap-1.5 text-[clamp(10px,1.8vw,12px)] font-bold text-gray-900">
                 <span className="text-xs md:text-sm">📡</span>
                 <span className="truncate">
                   {Array.isArray(alert.sources) && alert.sources.length > 0
                     ? Array.from(new Set(alert.sources))
                         .map(formatSourceName)
                         .join(", ")
                     : "All"}
                 </span>
              </div>
           </div>
        </div>

        <div className="mt-auto border-t border-gray-100" style={{ paddingTop: "clamp(0.5rem, 2vw, 1rem)" }}>
           <AlertConditions alert={alert} />
        </div>
      </div>
    </div>
  );
}

function AlertConditions({ alert }: { alert: Alert }) {
  if (!alert) return null;

  if (alert.alertType === AlertType.VARIABLES && Array.isArray(alert.properties)) {
    return (
      <div className="space-y-4">
        <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em] leading-none">Trigger Conditions</span>
        <AlertProperties properties={alert.properties} />
      </div>
    );
  }

  if (alert.alertType === AlertType.RATING) {
    return (
      <div className="space-y-4">
        <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em] leading-none">Minimum Rating</span>
        <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
          <BlueStarRating score={alert.starRating ?? 0} outOfFive={true} />
          <span className="text-sm font-bold text-gray-900">{alert.starRating || 0}+ Stars</span>
        </div>
      </div>
    );
  }

  return null;
}