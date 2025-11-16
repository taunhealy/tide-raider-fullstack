/**
 * Shared type for alert matching results
 * This matches the backend AlertMatch interface
 */
export interface AlertMatch {
  alertId: string;
  alertName: string;
  region: string;
  timestamp: Date;
  matchedProperties: Array<{
    property: string;
    logValue: any;
    forecastValue: any;
    difference: number;
    withinRange: boolean;
  }>;
  matchDetails: string;
}

