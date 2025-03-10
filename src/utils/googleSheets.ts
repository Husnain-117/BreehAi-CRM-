
import { toast } from "sonner";

// Google Sheets API configuration
const SHEET_ID = import.meta.env.VITE_SHEET_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;
const RANGE = "A2:E1000"; // Increased range to handle more entries

export interface PropertyData {
  unitId: string;
  verified: boolean;
  ownerName: string;
  floorLevel: string;
  unitType: string;
}

// Constants
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Utility functions
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const processSheetData = (data: any): PropertyData[] => {
  const properties: PropertyData[] = [];
  
  if (!data.values) {
    console.warn('No data found in the spreadsheet');
    return [];
  }
  
  data.values.forEach((row: any[]) => {
    if (row[0] && typeof row[0] === 'string') {
      properties.push({
        unitId: row[0].trim().toUpperCase(),
        verified: row[1]?.toLowerCase() === 'verified',
        ownerName: row[2]?.trim() || '',
        floorLevel: row[3]?.trim() || '',
        unitType: row[4]?.trim() || ''
      });
    }
  });
  
  console.log('Successfully fetched properties:', properties.length);
  return properties;
};

/**
 * Fetches property data from Google Sheets
 */
export const fetchPropertyData = async (): Promise<PropertyData[]> => {
  if (!SHEET_ID || !API_KEY) {
    console.error('Missing required environment variables');
    toast.error('Database configuration error. Please contact support.');
    return [];
  }

  let retries = 0;
  
  while (retries < MAX_RETRIES) {
    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Sheet1!${RANGE}?key=${API_KEY}`,
        {
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          }
        }
      );
      
      // If successful, break out of retry loop
      if (response.ok) {
        const data = await response.json();
        return processSheetData(data);
      }
      
      // Handle error responses
      const errorData = await response.json();
      console.error('Google Sheets API Error:', errorData);
      
      if (response.status === 403) {
        toast.error('Authentication error. Please contact support.');
        return [];
      } else if (response.status === 404) {
        toast.error('Database not found. Please contact support.');
        return [];
      } else if (retries < MAX_RETRIES - 1) {
        console.log(`Attempt ${retries + 1} failed, retrying...`);
        await delay(RETRY_DELAY);
        retries++;
        continue;
      } else {
        toast.error(`Database error (${response.status}). Please try again later.`);
        return [];
      }
    } catch (error) {
      if (retries < MAX_RETRIES - 1) {
        console.log(`Attempt ${retries + 1} failed, retrying...`);
        await delay(RETRY_DELAY);
        retries++;
        continue;
      }
      
      console.error('Error fetching Google Sheet data:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        toast.error('Network error. Please check your internet connection.');
      } else {
        toast.error('Unable to connect to our database. Please try again later.');
      }
      return [];
    }
  }
  
  return [];
}

/**
 * Searches for a property by unit ID in the dataset
 */
export const findPropertyByUnitId = (
  properties: PropertyData[],
  unitId: string
): PropertyData | null => {
  const property = properties.find(
    (p) => p.unitId.toUpperCase() === unitId.toUpperCase()
  );
  return property || null;
};
