import { useMutation } from '@tanstack/react-query';
import { supabase } from '../../api/supabaseClient';
import { UserProfile } from '../../types';

export const useUpdateUserMutation = () => {
  return useMutation(async (user: Partial<UserProfile>) => {
    if (!user.id) throw new Error('User ID required');
    const { error } = await supabase.from('users').update({
      full_name: user.full_name,
      role: user.role,
      manager_id: user.role === 'agent' ? (user.manager_id || null) : null,
    }).eq('id', user.id);
    if (error) throw new Error(error.message);
    return true;
  });
}; 