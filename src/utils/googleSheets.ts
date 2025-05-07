import { toast } from "sonner";

// Google Sheets API configuration
const SHEET_ID = import.meta.env.VITE_SHEET_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;
const RANGE = "A2:K100"; // A: Name, B: Email, C: Status, D: Position, E: Lead Name, F: Instagram Handle, G: Instagram Post Link, H: LinkedIn Post Link, I: Instagram Followed, J: LinkedIn Shared, K: Timestamp

export interface CandidateData {
  name: string;
  email: string;
  status: string;
  position: string;
  leadName: string;
  instagramHandle?: string;
  instagramPostLink?: string;
  linkedinPostLink?: string;
  instagramFollowed?: boolean;
  linkedinShared?: boolean;
  timestamp?: string;
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
        leadName: row[4]?.trim() || '',
        instagramHandle: row[5]?.trim() || '',
        instagramPostLink: row[6]?.trim() || '',
        linkedinPostLink: row[7]?.trim() || '',
        instagramFollowed: row[8]?.toLowerCase() === 'true',
        linkedinShared: row[9]?.toLowerCase() === 'true',
        timestamp: row[10]?.trim() || ''
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

export const updateCandidateData = async (email: string, updates: Partial<CandidateData>): Promise<boolean> => {
  try {
    console.log('Sending update request with:', { email, ...updates });

    const response = await fetch(
      'https://script.google.com/macros/s/AKfycbzORBJzA2nLF7pfTUWIvLGPGqrpHMODeY0CAPepdXtj92K2_20pXk5eI8_Z6VphoXaw/exec',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, ...updates }),
        mode: 'cors',
        cache: 'no-cache',
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response error:', errorText);
      throw new Error(`HTTP error! Status: ${response.status}, ${errorText}`);
    }

    const result = await response.json();
    console.log('Response from server:', result);

    if (result.success) {
      toast.success('Data updated successfully!');
      return true;
    } else {
      toast.error(`Failed to update data: ${result.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.error('Update error:', error);
    toast.error(`An error occurred while updating data: ${error.message}`);
    return false;
  }
};

export const findCandidateByEmail = (candidates: CandidateData[], email: string): CandidateData | null => {
  const lowerEmail = email.trim().toLowerCase();
  return candidates.find((c) => c.email === lowerEmail) || null;
};
