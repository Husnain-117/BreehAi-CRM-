import { toast } from "sonner";

// Google Sheets API configuration
const SHEET_ID = import.meta.env.VITE_SHEET_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;
const RANGE = "A2:E100"; // A: Name, B: Email, C: Status, D: Position, E: Lead Name

export interface CandidateData {
  name: string;
  email: string;
  status: string;
  position: string;
  leadName: string;
}

// Constants
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Utility functions
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const processSheetData = (data: any): CandidateData[] => {
  const candidates: CandidateData[] = [];
  if (!data.values) return [];
  data.values.forEach((row: any[]) => {
    if (row[1] && typeof row[1] === 'string') {
      candidates.push({
        name: row[0]?.trim() || '',
        email: row[1]?.trim().toLowerCase() || '',
        status: row[2]?.trim() || '',
        position: row[3]?.trim() || '',
        leadName: row[4]?.trim() || ''
      });
    }
  });
  return candidates;
};

/**
 * Fetches property data from Google Sheets
 */
export const fetchCandidateData = async (): Promise<CandidateData[]> => {
  if (!SHEET_ID || !API_KEY) {
    toast.error('Database configuration error. Please contact support.');
    return [];
  }
  let retries = 0;
  while (retries < MAX_RETRIES) {
    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Sheet1!${RANGE}?key=${API_KEY}`,
        { headers: { 'Accept': 'application/json', 'Cache-Control': 'no-cache' } }
      );
      if (response.ok) {
        const data = await response.json();
        return processSheetData(data);
      }
      if (retries < MAX_RETRIES - 1) {
        await delay(RETRY_DELAY); retries++; continue;
      } else {
        toast.error(`Database error (${response.status}). Please try again later.`);
        return [];
      }
    } catch (error) {
      if (retries < MAX_RETRIES - 1) {
        await delay(RETRY_DELAY); retries++; continue;
      }
      toast.error('Unable to connect to our database. Please try again later.');
      return [];
    }
  }
  return [];
};

/**
 * Searches for a property by unit ID in the dataset
 */
export const findCandidateByEmail = (candidates: CandidateData[], email: string): CandidateData | null => {
  const lowerEmail = email.trim().toLowerCase();
  return candidates.find((c) => c.email === lowerEmail) || null;
};
