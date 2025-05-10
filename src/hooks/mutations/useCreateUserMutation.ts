import { useMutation } from '@tanstack/react-query';
import { supabase } from '../../api/supabaseClient';

export const useCreateUserMutation = () => {
  return useMutation(async (form: { full_name: string; email: string; role: string; manager_id?: string; password: string }) => {
    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: form.email,
      password: form.password,
      email_confirm: true,
      user_metadata: { full_name: form.full_name },
    });
    if (authError || !authData?.user?.id) throw new Error(authError?.message || 'Failed to create user in Auth');
    // 2. Insert into users table
    const { error: dbError } = await supabase.from('users').insert({
      id: authData.user.id,
      full_name: form.full_name,
      email: form.email,
      role: form.role,
      manager_id: form.role === 'agent' ? (form.manager_id || null) : null,
    });
    if (dbError) throw new Error(dbError.message);
    return true;
  });
}; 