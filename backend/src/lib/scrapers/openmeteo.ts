import fetch from 'node-fetch';
import { BaseForecastData } from '../types';

const REGION_COORDS: Record<string, { lat: number, lng: number }> = {
  "western-cape": { lat: -34.1275, lng: 18.4486 },
  "eastern-cape": { lat: -34.0494, lng: 24.9231 },
  "kwazulu-natal": { lat: -29.8587, lng: 31.0218 },
  "northern-cape": { lat: -29.2553, lng: 16.8633 },
  "swakopmund": { lat: -22.6833, lng: 14.5333 },
  "inhambane-province": { lat: -23.8547, lng: 35.4832 }
};

export async function fetchArchiveFromOpenMeteo(regionId: string, date: Date): Promise<BaseForecastData[]> {
  const coords = REGION_COORDS[regionId] || { lat: -33.9249, lng: 18.4241 }; // Default to Cape Town
  const dateStr = date.toISOString().split('T')[0];
  
  console.log(`[openmeteo] Fetching archive for ${regionId} (${coords.lat}, ${coords.lng}) on ${dateStr}`);
  
  // Use the Marine API which often has history, or fallback to Archive API if needed
  // We request hourly data and then aggregate into slots
  const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${coords.lat}&longitude=${coords.lng}&start_date=${dateStr}&end_date=${dateStr}&hourly=wave_height,wave_period,wave_direction,wind_speed_10m,wind_direction_10m&wind_speed_unit=kn`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Open-Meteo API failed with status ${response.status}`);
    }
    
    const data = await response.json();
    if (!data.hourly) {
      console.warn(`[openmeteo] No hourly data returned for ${regionId} on ${dateStr}`);
      return [];
    }
    
    const { 
      wave_height, 
      wave_period, 
      wave_direction, 
    } = data.hourly;

    let { wind_speed_10m, wind_direction_10m } = data.hourly;

    // Check if wind data is missing (common in Marine API for certain regions/dates)
    if (!wind_speed_10m || wind_speed_10m.every(v => v === null)) {
      console.log(`[openmeteo] Wind data missing in Marine API. Fetching from Archive API...`);
      try {
        const archiveUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${coords.lat}&longitude=${coords.lng}&start_date=${dateStr}&end_date=${dateStr}&hourly=wind_speed_10m,wind_direction_10m&wind_speed_unit=kn`;
        const archiveRes = await fetch(archiveUrl);
        if (archiveRes.ok) {
          const archiveData = await archiveRes.json();
          if (archiveData.hourly) {
            wind_speed_10m = archiveData.hourly.wind_speed_10m;
            wind_direction_10m = archiveData.hourly.wind_direction_10m;
            console.log(`[openmeteo] Wind data successfully fetched from Archive API`);
          }
        }
      } catch (e) {
        console.error(`[openmeteo] Archive API fallback failed:`, e);
      }
    }
    
    // Map hourly data to slots (Morning: 09:00, Noon: 13:00, Evening: 17:00)
    const slotIndices = {
      MORNING: 9,
      NOON: 13,
      EVENING: 17
    };
    
    const forecasts: BaseForecastData[] = [];
    
    for (const [slot, index] of Object.entries(slotIndices)) {
      forecasts.push({
        date: new Date(date),
        timeSlot: slot as any,
        windSpeed: wind_speed_10m?.[index] || 0,
        windDirection: wind_direction_10m?.[index] || 0,
        swellHeight: wave_height?.[index] || 0,
        swellPeriod: wave_period?.[index] || 0,
        swellDirection: wave_direction?.[index] || 0,
        source: "OPENMETEO_ARCHIVE"
      });
    }
    
    console.log(`[openmeteo] Successfully fetched ${forecasts.length} slots for ${regionId}`);
    return forecasts;
  } catch (error) {
    console.error(`[openmeteo] Failed to fetch archive for ${regionId}:`, error);
    return [];
  }
}
