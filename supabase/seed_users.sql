-- Enable pgcrypto for password hashing if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  super_admin_id UUID := gen_random_uuid();
  manager_id UUID := gen_random_uuid();
  agent_id UUID := gen_random_uuid();
BEGIN
  -- 1. Insert Super Admin
  INSERT INTO auth.users (
    id, 
    instance_id, 
    aud, 
    role, 
    email, 
    encrypted_password, 
    email_confirmed_at, 
    raw_app_meta_data, 
    raw_user_meta_data, 
    created_at, 
    updated_at
  ) VALUES (
    super_admin_id, 
    '00000000-0000-0000-0000-000000000000', 
    'authenticated', 
    'authenticated', 
    'testsuperadmin@example.com', 
    crypt('SuperAdminPa$$w0rd', gen_salt('bf')), 
    now(), 
    '{"provider":"email","providers":["email"]}', 
    '{"role":"super_admin"}', 
    now(), 
    now()
  );

  INSERT INTO public.users (id, email, role, full_name, created_at, updated_at)
  VALUES (super_admin_id, 'testsuperadmin@example.com', 'super_admin', 'Test Super Admin', now(), now());

  -- 2. Insert Manager
  INSERT INTO auth.users (
    id, 
    instance_id, 
    aud, 
    role, 
    email, 
    encrypted_password, 
    email_confirmed_at, 
    raw_app_meta_data, 
    raw_user_meta_data, 
    created_at, 
    updated_at
  ) VALUES (
    manager_id, 
    '00000000-0000-0000-0000-000000000000', 
    'authenticated', 
    'authenticated', 
    'testmanager@example.com', 
    crypt('ManagerPa$$w0rd', gen_salt('bf')), 
    now(), 
    '{"provider":"email","providers":["email"]}', 
    '{"role":"manager"}', 
    now(), 
    now()
  );

  INSERT INTO public.users (id, email, role, full_name, manager_id, created_at, updated_at)
  VALUES (manager_id, 'testmanager@example.com', 'manager', 'Test Manager', super_admin_id, now(), now());

  -- 3. Insert Agent
  INSERT INTO auth.users (
    id, 
    instance_id, 
    aud, 
    role, 
    email, 
    encrypted_password, 
    email_confirmed_at, 
    raw_app_meta_data, 
    raw_user_meta_data, 
    created_at, 
    updated_at
  ) VALUES (
    agent_id, 
    '00000000-0000-0000-0000-000000000000', 
    'authenticated', 
    'authenticated', 
    'testagent@example.com', 
    crypt('AgentPa$$w0rd', gen_salt('bf')), 
    now(), 
    '{"provider":"email","providers":["email"]}', 
    '{"role":"agent"}', 
    now(), 
    now()
  );

  INSERT INTO public.users (id, email, role, full_name, manager_id, created_at, updated_at)
  VALUES (agent_id, 'testagent@example.com', 'agent', 'Test Agent', manager_id, now(), now());

END $$;
