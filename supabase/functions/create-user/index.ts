import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

console.log("Create user function V2 started"); // V2 for logging

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Original code below, effectively commented out by the early return
  // console.log("Create user function: Received request method:", req.method);
  // // Handle OPTIONS preflight request

  try {
    console.log("Create user function: Attempting to read request body as text...");
    const rawBody = await req.text(); // Read body as text first
    console.log("Create user function: Raw request body:", rawBody);

    let parsedBody;
    try {
      parsedBody = JSON.parse(rawBody); // Then parse
    } catch (jsonError) {
      console.error("Create user function: JSON parsing error:", jsonError.message);
      return new Response(JSON.stringify({ error: "Invalid JSON format in request body", details: jsonError.message }), {
        status: 400, // Bad Request, as the JSON is malformed
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }
    
    console.log("Create user function: Parsed request body:", { 
      email: parsedBody.email, 
      // Omitting password from log for security
      full_name: parsedBody.full_name, 
      role: parsedBody.role, 
      manager_id: parsedBody.manager_id 
    });

    const { email, password, full_name, role, manager_id } = parsedBody;

    if (!email || !password || !full_name || !role) {
      console.warn("Create user function: Missing required fields. Provided:", { email_present: !!email, password_present: !!password, full_name_present: !!full_name, role_present: !!role });
      return new Response(JSON.stringify({ error: "Missing required fields: email, password, full_name, role" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }
    if (password.length < 6) {
      console.warn("Create user function: Password too short. Length:", password.length);
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
    console.log("Create user function: Admin client initialized");

    console.log("Create user function: Attempting to create user in Auth...");
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { full_name },
      app_metadata: { role }
    });

    if (authError) {
      console.error("Create user function: Auth error:", authError, "Status:", authError.status);
      return new Response(JSON.stringify({ error: authError.message || 'Failed to create user in Auth' }), {
        status: authError.status || 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }
    if (!authData?.user?.id) {
        console.error("Create user function: Auth data missing user ID. AuthData:", authData);
        return new Response(JSON.stringify({ error: 'User created in Auth but ID missing' }), {
            status: 500,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
    }
    console.log("Create user function: User created in Auth. User ID:", authData.user.id);

    const dbPayload = {
      id: authData.user.id,
      full_name,
      email,
      role,
      manager_id: role === 'agent' ? (manager_id || null) : null,
    };
    console.log("Create user function: Attempting to insert user into DB with payload:", dbPayload);

    const { error: dbError } = await supabaseAdmin.from('users').insert(dbPayload);

    if (dbError) {
      console.error("Create user function: DB insert error:", dbError, "Code:", dbError.code);
      // Consider deleting the auth user if DB insert fails
      // await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return new Response(JSON.stringify({ error: dbError.message || 'Failed to insert user into database' }), {
        status: dbError.code && !isNaN(parseInt(dbError.code)) ? parseInt(dbError.code) : 500, // Use DB error code if valid HTTP status
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }
    console.log("Create user function: User inserted into DB successfully");

    return new Response(JSON.stringify({ message: "User created successfully", userId: authData.user.id }), {
      status: 201,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Create user function: General error catch block:", error, "Message:", error.message);
    return new Response(JSON.stringify({ error: error.message || "An unexpected error occurred" }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
}); 