import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and anon key from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Supabase URL is not defined. Please check your .env file and VITE_SUPABASE_URL variable.");
}

if (!supabaseAnonKey) {
  throw new Error("Supabase anon key is not defined. Please check your .env file and VITE_SUPABASE_ANON_KEY variable.");
}

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey); 