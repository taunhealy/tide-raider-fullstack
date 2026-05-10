
import fetch from 'node-fetch';
import { BaseForecastData } from '../types';

export async function fetchArchiveFromOpenMeteo(regionId: string, date: Date): Promise<BaseForecastData[]> {
  console.log(`[openmeteo] Stub: Fetching archive for ${regionId} on ${date.toISOString()}`);
  // In a real implementation, this would call the Open-Meteo API
  return [];
}
