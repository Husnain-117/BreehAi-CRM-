import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../api/supabaseClient';
import { UserProfile } from '../../types'; // Assuming UserProfile is relevant for query invalidation

// Define the expected shape of the form data for creating a user
interface CreateUserFormData {
  full_name: string;
  email: string;
  role: 'agent' | 'manager'; // Be more specific with role type
  manager_id?: string | null;
  password: string;
}

export const useCreateUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (userData: CreateUserFormData) => {
      // Prepare data for the Edge Function
      const payload = {
        ...userData,
        manager_id: userData.role === 'agent' && userData.manager_id ? userData.manager_id : null,
      };

      const { data, error } = await supabase.functions.invoke('create-user', {
        body: payload, // Send the modified payload
      });

      if (error) {
        console.error("Error invoking create-user function:", error);
        // Attempt to parse Supabase Edge Function error if possible
        let errorMessage = error.message;
        if (data && data.error) { // Supabase functions often return error details in data.error
            errorMessage = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
        }
        throw new Error(errorMessage || 'Failed to create user via function.');
      }
      
      // Check if the function returned an error in its body (as per our Edge Function design)
      if (data && data.error) {
        console.error("Function returned error in body:", data.error);
        throw new Error(typeof data.error === 'string' ? data.error : JSON.stringify(data.error));
      }

      // If function invocation was successful and no error in body, expect success message and userId
      if (!data || !data.userId) {
        console.error("Function response missing userId:", data);
        throw new Error('User creation function did not return a userId.');
      }

      return data; // Contains { message: string, userId: string }
    },
    {
      onSuccess: () => {
        // Invalidate and refetch queries that should be updated after a user is created
        queryClient.invalidateQueries(['users']);
        // Potentially invalidate other related queries if necessary
      },
      onError: (error) => {
        // The error should already be a proper Error instance from the mutationFn
        console.error("Create user mutation failed:", error);
        // Toast notifications or further error handling can be done here or in the component
      },
    }
  );
}; 