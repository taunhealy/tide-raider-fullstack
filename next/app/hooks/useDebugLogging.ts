import { useEffect } from "react";

export function useDebugLogging(data: any, error: any, label: string) {
  useEffect(() => {
    if (data) {
      console.log(`Received ${label}:`, data);
    }
    if (error) {
      console.error(`${label} error:`, error);
    }
  }, [data, error, label]);
}
