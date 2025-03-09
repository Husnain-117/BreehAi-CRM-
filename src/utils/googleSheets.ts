
import { toast } from "sonner";

// Google Sheets API configuration
const SHEET_ID = import.meta.env.VITE_SHEET_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;
const RANGE = "A2:E1000"; // Increased range to handle more entries

export interface CandidateData {
  email: string;
  selected: boolean;
  designation: string;
  team: string;
}

// Constants
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Utility functions
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const processSheetData = (data: any): CandidateData[] => {
  const candidates: CandidateData[] = [];
  
  if (!data.values) {
    console.warn('No data found in the spreadsheet');
    return [];
  }
  
  data.values.forEach((row: any[]) => {
    if (row[0] && typeof row[0] === 'string') {
      candidates.push({
        email: row[0].trim().toLowerCase(),
        selected: row[1]?.toLowerCase() === 'selected',
        designation: row[2]?.trim() || '',
        team: row[3]?.trim() || ''
      });
    }
  });
  
  console.log('Successfully fetched candidates:', candidates.length);
  return candidates;
};

/**
 * Fetches candidate data from Google Sheets
 */
export const fetchCandidateData = async (): Promise<CandidateData[]> => {
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
 * Searches for a candidate by email in the dataset
 */
export const findCandidateByEmail = (
  candidates: CandidateData[],
  email: string
): CandidateData | null => {
  const candidate = candidates.find(
    (c) => c.email.toLowerCase() === email.toLowerCase()
  );
  return candidate || null;
};
