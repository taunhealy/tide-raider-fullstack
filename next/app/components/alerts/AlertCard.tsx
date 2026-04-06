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
    <div
      className={cn(
        "relative group bg-white rounded-2xl transition-all duration-300 border border-gray-100 overflow-hidden h-full flex flex-col",
        alert.active ? "shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]" : "opacity-75 grayscale-[0.5]"
      )}
    >
      {/* Header with Switch and Actions */}
      <div className="p-5 pb-0 flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className={cn(
               "w-2 h-2 rounded-full",
               alert.active ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-gray-300"
            )} />
            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-gray-400">
              {alert.active ? "Monitoring" : "Paused"}
            </span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 truncate leading-tight">
            {alert.name}
          </h3>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
              {alert.region?.name || alert.regionId}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="px-2 py-1.5">
                  <Switch
                    checked={alert.active}
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
                {alert.active ? "Active" : "Disabled"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="w-px h-4 bg-gray-200 mx-0.5" />
          <button
            onClick={() => onEdit(alert.id)}
            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-white rounded-lg transition-all active:scale-95"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(alert.id)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg transition-all active:scale-95"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="p-5 pt-4 flex-grow flex flex-col gap-4">
        {/* Beach Badge */}
        {alert.beach?.name && (
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100 w-fit">
            <span className="text-xs">📍</span>
            <span className="text-[11px] font-semibold text-gray-700 tracking-tight">{alert.beach.name}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
           <div className="flex flex-col gap-1 p-3 rounded-xl bg-gray-50/50 border border-gray-100/50">
             <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em] leading-none">Notify Via</span>
             <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
                <span>🔔</span>
                {formatNotificationMethod(alert.notificationMethod)}
             </div>
           </div>

           <div className="flex flex-col gap-1 p-3 rounded-xl bg-gray-50/50 border border-gray-100/50">
             <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em] leading-none">Sources</span>
              <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
                 <span>📡</span>
                 <span className="truncate">
                   {alert.sources && alert.sources.length > 0
                     ? Array.from(new Set(alert.sources))
                         .map(formatSourceName)
                         .join(", ")
                     : "All Sources"}
                 </span>
              </div>
           </div>
        </div>

        <div className="mt-auto pt-4 border-t border-gray-100">
           <AlertConditions alert={alert} />
        </div>
      </div>
    </div>
  );
}

function AlertConditions({ alert }: { alert: Alert }) {
  if (alert.alertType === AlertType.VARIABLES && alert.properties) {
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
          <span className="text-sm font-bold text-gray-900">{alert.starRating}+ Stars</span>
        </div>
      </div>
    );
  }

  return null;
}