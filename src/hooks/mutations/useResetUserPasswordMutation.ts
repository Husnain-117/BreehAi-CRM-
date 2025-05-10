import { useMutation } from '@tanstack/react-query';
import { supabase } from '../../api/supabaseClient';

export const useResetUserPasswordMutation = () => {
  return useMutation(async ({ userId, password }: { userId: string; password: string }) => {
    const { error } = await supabase.auth.admin.updateUserById(userId, { password });
    if (error) throw new Error(error.message);
    return true;
  });
}; 