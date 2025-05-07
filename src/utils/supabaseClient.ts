import { createClient } from '@supabase/supabase-js';

// Log env variables for debugging
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY?.slice(0, 8) + '...');

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing!');
}

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

export async function saveUserLinks(
  email: string,
  instagramHandle: string,
  instagramLink: string,
  linkedinLink: string
) {
  console.log('saveUserLinks called with:', { email, instagramHandle, instagramLink, linkedinLink });
  const { data, error, status } = await supabase
    .from('user_links')
    .insert([{ email, instagram_handle: instagramHandle, instagram_link: instagramLink, linkedin_link: linkedinLink }]);
  console.log('Supabase insert status:', status);
  if (error) {
    console.error('Supabase insert error:', error);
    throw error;
  }
  console.log('Supabase insert data:', data);
  return data;
}
