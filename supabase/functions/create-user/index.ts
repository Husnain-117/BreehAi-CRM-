import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

console.log("Create user function V2 started"); // V2 for logging

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle OPTIONS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const { email, password, full_name, role, manager_id } = await req.json();
    console.log("Request body:", { email, /* password omitted for security */ full_name, role, manager_id });

    if (!email || !password || !full_name || !role) {
      return new Response(JSON.stringify({ error: "Missing required fields: email, password, full_name, role" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }
    if (password.length < 6) {
      return new Response(JSON.stringify({ error: "Password must be at least 6 characters long" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { global: { headers: { Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` } } }
    );
    console.log("Supabase admin client initialized");

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (authError) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: authError.message || 'Failed to create user in Auth' }), {
        status: authError.status || 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }
    if (!authData?.user?.id) {
        console.error("Auth data missing user ID:", authData);
        return new Response(JSON.stringify({ error: 'User created in Auth but ID missing' }), {
            status: 500,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
    }
    console.log("User created in Auth:", authData.user.id);

    const { error: dbError } = await supabaseAdmin.from('users').insert({
      id: authData.user.id,
      full_name,
      email,
      role,
      manager_id: role === 'agent' ? (manager_id || null) : null,
    });

    if (dbError) {
      console.error("DB insert error:", dbError);
      // Consider deleting the auth user if DB insert fails
      // await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return new Response(JSON.stringify({ error: dbError.message || 'Failed to insert user into database' }), {
        status: dbError.code && !isNaN(parseInt(dbError.code)) ? parseInt(dbError.code) : 500, // Use DB error code if valid HTTP status
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }
    console.log("User inserted into DB successfully");

    return new Response(JSON.stringify({ message: "User created successfully", userId: authData.user.id }), {
      status: 201,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("General error:", error);
    return new Response(JSON.stringify({ error: error.message || "An unexpected error occurred" }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
}); 