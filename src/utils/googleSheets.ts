
import { toast } from "sonner";

// Google Sheets API configuration
const SHEET_ID = "1JhgmQy_oobmZa1IDV_GaWDwpzA9xvsACD-nwe8jxrVI";
const API_KEY = "AIzaSyBJ9-TWKH_0LRQmk3rBaOfpVMEpi8rkn0I"; // This is a frontend key, so it's okay to expose
const RANGE = "A2:E100"; // Adjust range as needed

export interface CandidateData {
  email: string;
  selected: boolean;
  designation: string;
  team: string;
}

/**
 * Fetches candidate data from Google Sheets
 */
export const fetchCandidateData = async (): Promise<CandidateData[]> => {
  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Sheet1!${RANGE}?key=${API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error("Failed to fetch data from Google Sheets");
    }
    
    const data = await response.json();
    const candidates: CandidateData[] = [];
    
    if (data.values && data.values.length > 0) {
      data.values.forEach((row: any[]) => {
        if (row[0]) { // Make sure email exists
          candidates.push({
            email: row[0],
            selected: row[1]?.toLowerCase() === "selected",
            designation: row[2] || "",
            team: row[3] || ""
          });
        }
      });
    }
    
    return candidates;
  } catch (error) {
    console.error("Error fetching Google Sheet data:", error);
    toast.error("Unable to connect to our database. Please try again later.");
    return [];
  }
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
