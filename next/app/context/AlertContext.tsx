// next/app/contexts/AlertContext.tsx
import React, { createContext, useContext, useReducer } from "react";
import {
  AlertConfig,
  AlertConfigTypes,
  ForecastProperty,
  AlertProperty,
  BeachDetails,
} from "@/app/types/alerts";
import { LogEntry } from "@/app/types/raidlogs";
import { useSession } from "next-auth/react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { usePropertyManager } from "@/app/hooks/usePropertyManager";
import { UseMutationResult } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export type AlertContextType = {
  alertConfig: AlertConfigTypes;
  setAlertConfig: (config: AlertConfigTypes) => void;
  selectedLogEntry: LogEntry | null;
  setSelectedLogEntry: (entry: LogEntry | null) => void;
  alertType: "variables" | "rating";
  setAlertType: (type: "variables" | "rating") => void;
  starRating: number;
  setStarRating: (rating: number) => void;
  creationMode: "logEntry" | "beachVariables";
  setCreationMode: (mode: "logEntry" | "beachVariables") => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  fetchAlert: () => Promise<void>;
  isFetchingForecast: boolean;
  setIsFetchingForecast: (value: boolean) => void;
  forecastData: any;
  setForecastData: (data: any) => void;
  fetchedCombinations: Set<string>;
  setFetchedCombinations: (combinations: Set<string>) => void;
  fetchForecast: (region: string, date: Date | string) => Promise<any>;
  properties: AlertConfigTypes["properties"];
  setProperties: (properties: AlertConfigTypes["properties"]) => void;
  updateProperty: (action: {
    index: number;
    key: "property" | "range" | "optimalValue";
    value: ForecastProperty | number;
  }) => void;
  removeProperty: (index: number) => void;
  addProperty: () => void;
  getPropertyUnit: (property: string) => string;
  getPropertyMaxRange: (property: string) => number;
  getPropertyStep: (property: string) => number;
  handleStarRatingChange: (rating: number) => void;
  handleSave: (config: AlertConfigTypes) => void;
  createAlertMutation: UseMutationResult<any, Error, AlertConfigTypes>;
  updateAlertMutation: UseMutationResult<any, Error, AlertConfig>;
  existingAlert?: AlertConfigTypes;
  onSaved?: () => void;
  beachDetails: BeachDetails | null;
  isLoadingBeachDetails: boolean;
  onClose: () => void;
};

const AlertContext = createContext<AlertContextType | undefined>(undefined);

interface AlertContextState {
  alertConfig: AlertConfigTypes;
  properties: AlertProperty[];
  selectedLogEntry: LogEntry | null;
  beachDetails: BeachDetails | null;
  alertType: "variables" | "rating";
  starRating: number;
  creationMode: "logEntry" | "beachVariables";
  searchTerm: string;
  isFetchingForecast: boolean;
  forecastData: any;
  fetchedCombinations: Set<string>;
}

const initialState: AlertContextState = {
  alertConfig: {
    id: uuidv4(),
    name: "",
    region: "",
    properties: [],
    notificationMethod: "app",
    contactInfo: "",
    active: true,
    forecastDate: new Date(),
    alertType: "variables",
    starRating: 3,
    userId: "",
    logEntryId: null,
    forecast: null,
    forecastId: null,
  },
  properties: [],
  selectedLogEntry: null,
  beachDetails: null,
  alertType: "variables",
  starRating: 3,
  creationMode: "logEntry",
  searchTerm: "",
  isFetchingForecast: false,
  forecastData: null,
  fetchedCombinations: new Set(),
};

type AlertAction =
  | { type: "SET_ALERT_CONFIG"; payload: AlertConfigTypes }
  | { type: "SET_PROPERTIES"; payload: AlertProperty[] }
  | { type: "SET_SELECTED_LOG_ENTRY"; payload: LogEntry | null }
  | { type: "SET_BEACH_DETAILS"; payload: BeachDetails | null }
  | { type: "SET_ALERT_TYPE"; payload: "variables" | "rating" }
  | { type: "SET_STAR_RATING"; payload: number }
  | { type: "SET_CREATION_MODE"; payload: "logEntry" | "beachVariables" }
  | { type: "SET_SEARCH_TERM"; payload: string }
  | { type: "SET_FETCHING_FORECAST"; payload: boolean }
  | { type: "SET_FORECAST_DATA"; payload: any }
  | { type: "SET_FETCHED_COMBINATIONS"; payload: Set<string> };

const alertReducer = (
  state: AlertContextState,
  action: AlertAction
): AlertContextState => {
  switch (action.type) {
    case "SET_ALERT_CONFIG":
      return { ...state, alertConfig: action.payload };
    case "SET_PROPERTIES":
      return { ...state, properties: action.payload };
    case "SET_SELECTED_LOG_ENTRY":
      return { ...state, selectedLogEntry: action.payload };
    case "SET_BEACH_DETAILS":
      return { ...state, beachDetails: action.payload };
    case "SET_ALERT_TYPE":
      return { ...state, alertType: action.payload };
    case "SET_STAR_RATING":
      return { ...state, starRating: action.payload };
    case "SET_CREATION_MODE":
      return { ...state, creationMode: action.payload };
    case "SET_SEARCH_TERM":
      return { ...state, searchTerm: action.payload };
    case "SET_FETCHING_FORECAST":
      return { ...state, isFetchingForecast: action.payload };
    case "SET_FORECAST_DATA":
      return { ...state, forecastData: action.payload };
    case "SET_FETCHED_COMBINATIONS":
      return { ...state, fetchedCombinations: action.payload };
    default:
      return state;
  }
};

const fetchBeachDetails = async (region: string) => {
  const response = await fetch(`/api/beaches/${region}`);
  if (!response.ok) throw new Error("Failed to fetch beach details");
  return response.json();
};

export function AlertProvider({
  children,
  existingAlert,
  logEntry,
  onSaved,
  onClose,
}: {
  children: React.ReactNode;
  existingAlert?: AlertConfigTypes;
  logEntry?: LogEntry | null;
  onSaved?: () => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [state, dispatch] = useReducer(alertReducer, initialState);

  // Single source of truth for beach details
  const { data: beachDetails, isLoading: isLoadingBeachDetails } = useQuery({
    queryKey: ["beach", state.alertConfig.region],
    queryFn: () => fetchBeachDetails(state.alertConfig.region || ""),
    enabled: !!state.alertConfig.region,
  });

  // Single property manager hook
  const propertyManager = usePropertyManager(state.properties);

  // Move mutations inside the component
  const createAlertMutation = useMutation({
    mutationFn: async (data: AlertConfigTypes) => {
      const response = await fetch("/api/alerts", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create alert");
      return response.json();
    },
    onSuccess: (data) => {
      toast.success("Alert created successfully");
      onClose?.(); // Close the modal
      onSaved?.(); // Call the onSaved callback if provided
      router.push("/dashboard/alerts"); // Redirect to alerts dashboard
    },
    onError: (error) => {
      toast.error("Failed to create alert", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });

  const updateAlertMutation = useMutation({
    mutationFn: async (data: AlertConfig) => {
      const response = await fetch(`/api/alerts/${data.id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update alert");
      return response.json();
    },
  });

  const value = {
    ...state,
    ...propertyManager,
    beachDetails,
    isLoadingBeachDetails,
    setAlertConfig: (config: AlertConfigTypes) =>
      dispatch({ type: "SET_ALERT_CONFIG", payload: config }),
    setSelectedLogEntry: (entry: LogEntry | null) =>
      dispatch({ type: "SET_SELECTED_LOG_ENTRY", payload: entry }),
    setAlertType: (type: "variables" | "rating") =>
      dispatch({ type: "SET_ALERT_TYPE", payload: type }),
    setStarRating: (rating: number) =>
      dispatch({ type: "SET_STAR_RATING", payload: rating }),
    setCreationMode: (mode: "logEntry" | "beachVariables") =>
      dispatch({ type: "SET_CREATION_MODE", payload: mode }),
    setSearchTerm: (term: string) =>
      dispatch({ type: "SET_SEARCH_TERM", payload: term }),
    setIsFetchingForecast: (value: boolean) =>
      dispatch({ type: "SET_FETCHING_FORECAST", payload: value }),
    setForecastData: (data: any) =>
      dispatch({ type: "SET_FORECAST_DATA", payload: data }),
    setFetchedCombinations: (combinations: Set<string>) =>
      dispatch({ type: "SET_FETCHED_COMBINATIONS", payload: combinations }),
    handleStarRatingChange: (rating: number) =>
      dispatch({ type: "SET_STAR_RATING", payload: rating }),
    handleSave: (config: AlertConfigTypes) =>
      dispatch({ type: "SET_ALERT_CONFIG", payload: config }),
    createAlertMutation,
    updateAlertMutation,
    existingAlert,
    onSaved,
    fetchAlert: async () => {
      // Implement fetchAlert logic
    },
    fetchForecast: async (region: string, date: Date | string) => {
      const response = await fetch(
        `/api/forecast?region=${region}&date=${date}`
      );
      if (!response.ok) throw new Error("Failed to fetch forecast");
      return response.json();
    },
    onClose,
  };

  return (
    <AlertContext.Provider value={value}>{children}</AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
}
