import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

console.log("Reset user password function started");

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*', // Adjust for production if needed
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle OPTIONS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const { userId, newPassword } = await req.json();
    console.log("Request body received for user:", userId); // Log userId, omit password

    if (!userId || !newPassword) {
      return new Response(JSON.stringify({ error: "Missing required fields: userId and newPassword" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    if (newPassword.length < 6) {
      return new Response(JSON.stringify({ error: "Password must be at least 6 characters long" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      // Set auth persistency to none for server-side operations
      { global: { headers: { Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` } } }
    );
    console.log("Supabase admin client initialized for password reset.");

    const { data, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (updateError) {
      console.error("Auth update error:", updateError);
      return new Response(JSON.stringify({ error: updateError.message || 'Failed to update user password in Auth' }), {
        status: updateError.status || 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    console.log("User password updated successfully for user:", userId);

    return new Response(JSON.stringify({ message: "User password updated successfully", user: data?.user }), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("General error in reset-user-password function:", error);
    return new Response(JSON.stringify({ error: error.message || "An unexpected error occurred" }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
}); 