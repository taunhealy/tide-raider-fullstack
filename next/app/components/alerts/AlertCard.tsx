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
      style={{ padding: "var(--spacing-md)" }}
    >
      {/* Locked Overlay for Premium Alerts */}
      {isLocked && (
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-10 pointer-events-none" />
      )}

      {/* Header with Switch and Actions */}
      <div className="flex items-start justify-between relative z-20" style={{ marginBottom: "var(--spacing-md)" }}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2" style={{ marginBottom: "var(--spacing-xs)" }}>
            <div className={cn(
               "w-2.5 h-2.5 rounded-full",
               alert.active ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-gray-300",
               isLocked && "bg-gray-400"
            )} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
              {isLocked ? "Premium Only" : (alert.active ? "Monitoring" : "Inactive")}
            </span>
            {isLocked && <Shield className="w-3 h-3 text-amber-500 fill-amber-500/20" />}
          </div>
          <h3 className="text-lg font-bold text-gray-900 truncate leading-tight" style={{ fontSize: "var(--font-size-lg)" }}>
            {alert.name || "Unnamed Alert"}
          </h3>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
              {alert.region?.name || alert.regionId || "No Region"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-gray-50 p-1.5 rounded-xl border border-gray-100 shadow-sm">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="px-2 py-1">
                  <Switch
                    checked={!!alert.active}
                    disabled={isLocked}
                    onCheckedChange={(checked) =>
                      onToggleActive(alert.id, checked)
                    }
                    className="data-[state=checked]:bg-gray-900"
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
          <div className="w-px h-5 bg-gray-200 mx-1" />
          <button
            onClick={() => onEdit(alert.id)}
            className="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-white rounded-lg transition-all active:scale-95 hover:shadow-sm"
          >
            <Pencil className="h-4 w-4" />
          </button>
          {!isLocked && (
            <button
              onClick={() => onDelete(alert.id)}
              className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg transition-all active:scale-95 hover:shadow-sm"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-grow flex flex-col relative z-20" style={{ gap: "var(--spacing-md)" }}>
        {/* Beach Badge */}
        {alert.beach?.name && (
          <div className="flex items-center gap-[var(--spacing-sm)] px-[var(--spacing-md)] py-[var(--spacing-sm)] bg-gray-50 rounded-xl border border-gray-100 w-fit shadow-sm">
            <span className="text-[var(--font-size-sm)]">📍</span>
            <span className="text-[var(--font-size-xs)] font-bold text-gray-800 tracking-tight uppercase">{alert.beach.name}</span>
          </div>
        )}
        
        {/* Notification & Source Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--spacing-md)]">
           <div className="flex flex-col gap-[var(--spacing-xs)] p-[var(--spacing-md)] rounded-2xl bg-gray-50/80 border border-gray-100 shadow-sm">
             <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.18em] leading-none">Notify Via</span>
             <div className="flex items-center gap-[var(--spacing-sm)] text-[var(--font-size-sm)] font-bold text-gray-900">
                <span className="text-[var(--font-size-base)]">🔔</span>
                <span className="truncate">{formatNotificationMethod(alert.notificationMethod)}</span>
             </div>
           </div>

           <div className="flex flex-col gap-[var(--spacing-xs)] p-[var(--spacing-md)] rounded-2xl bg-gray-50/80 border border-gray-100 shadow-sm">
             <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.18em] leading-none">Sources</span>
              <div className="flex items-center gap-[var(--spacing-sm)] text-[var(--font-size-sm)] font-bold text-gray-900">
                 <span className="text-[var(--font-size-base)]">📡</span>
                 <span className="truncate">
                   {Array.isArray(alert.sources) && alert.sources.length > 0
                     ? Array.from(new Set(alert.sources))
                         .map(formatSourceName)
                         .join(", ")
                     : "All Sources"}
                 </span>
              </div>
           </div>
        </div>

        <div className="mt-auto border-t border-gray-100" style={{ paddingTop: "var(--spacing-md)" }}>
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