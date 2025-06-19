// next/app/contexts/AlertContext.tsx
import React, { createContext, useContext, useReducer } from "react";
import {
  Alert,
  AlertType,
  AlertProperty as PrismaAlertProperty,
  Prisma,
} from "@prisma/client";
import { LogEntry } from "@/app/types/raidlogs";
import { useSession } from "next-auth/react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { useMutation, UseMutationResult, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { BeachDetails } from "../types/alerts";

// Use Prisma's type instead:
type CreateAlertInput = Prisma.AlertCreateInput;

// Core state - keep only what's necessary
interface AlertState {
  alert: Prisma.AlertCreateInput;
  mode: "logEntry" | "beachVariables";
  selectedLogEntry: LogEntry | null;
}

const initialState: AlertState = {
  alert: {
    name: "",
    notificationMethod: "app",
    contactInfo: "",
    active: true,
    alertType: AlertType.VARIABLES,
    forecastDate: new Date(),
    properties: { create: [] },
    region: { connect: { id: "" } },
    user: { connect: { id: "" } },
  },
  mode: "logEntry",
  selectedLogEntry: null,
};

// Simple actions
type AlertAction =
  | { type: "UPDATE_ALERT"; payload: Partial<Prisma.AlertCreateInput> }
  | { type: "SET_MODE"; payload: "logEntry" | "beachVariables" }
  | { type: "SET_LOG_ENTRY"; payload: LogEntry | null };

function alertReducer(state: AlertState, action: AlertAction): AlertState {
  switch (action.type) {
    case "UPDATE_ALERT":
      return { ...state, alert: { ...state.alert, ...action.payload } };
    case "SET_MODE":
      return { ...state, mode: action.payload };
    case "SET_LOG_ENTRY":
      return { ...state, selectedLogEntry: action.payload };
    default:
      return state;
  }
}

// Provider props
interface AlertProviderProps {
  children: React.ReactNode;
  existingAlert?: Prisma.AlertCreateInput;
  onSaved?: () => void;
  onClose: () => void;
}

// Add after imports
interface AlertContextType {
  alert: Prisma.AlertCreateInput;
  mode: "logEntry" | "beachVariables";
  beachDetails: BeachDetails | null;
  updateAlert: (data: Partial<Prisma.AlertCreateInput>) => void;
  setMode: (mode: "logEntry" | "beachVariables") => void;
  createAlert: UseMutationResult<any, Error, Prisma.AlertCreateInput>;
  updateAlertMutation: UseMutationResult<any, Error, Prisma.AlertUpdateInput>;
  onClose: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({
  children,
  existingAlert,
  onSaved,
  onClose,
}: AlertProviderProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [state, dispatch] = useReducer(alertReducer, {
    ...initialState,
    alert: existingAlert ?? initialState.alert,
  });

  const { data: beachDetails } = useQuery({
    queryKey: ["beach", state.alert.region?.connect?.id],
    queryFn: () =>
      fetch(`/api/beaches/${state.alert.region?.connect?.id}`).then((r) =>
        r.json()
      ),
    enabled: !!state.alert.region?.connect?.id,
  });

  const createAlert = useMutation({
    mutationFn: (data: Prisma.AlertCreateInput) =>
      fetch("/api/alerts", {
        method: "POST",
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => {
      toast.success("Alert created");
      onSaved?.();
      onClose();
    },
  });

  const updateAlert = useMutation({
    mutationFn: (data: Prisma.AlertUpdateInput) =>
      fetch(`/api/alerts/${data.id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }).then((r) => r.json()),
  });

  return (
    <AlertContext.Provider
      value={{
        // State
        alert: state.alert,
        mode: state.mode,
        beachDetails,

        // Actions
        updateAlert: (data: Partial<Prisma.AlertCreateInput>) =>
          dispatch({ type: "UPDATE_ALERT", payload: data }),
        setMode: (mode: "logEntry" | "beachVariables") =>
          dispatch({ type: "SET_MODE", payload: mode }),

        // Mutations
        createAlert,
        updateAlertMutation: updateAlert,

        // Utils
        onClose,
      }}
    >
      {children}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) throw new Error("useAlert must be used within AlertProvider");
  return context;
}
