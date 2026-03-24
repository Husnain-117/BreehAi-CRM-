import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { supabase } from '../../api/supabaseClient';
import {
  Todo,
  TodoComment,
  TodoAttachment,
  CreateTodoData,
  UpdateTodoData,
  CreateTodoCommentData,
  TodoFilters,
  TodoSortOptions,
  TodoStats,
  TeamTodoStats,
  BulkTodoOperation
} from '../../types';
import { RealtimeChannel } from '@supabase/supabase-js';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

// Helper function to build todo query with filters
const buildTodoQuery = (filters: TodoFilters = {}, sort: TodoSortOptions = { field: 'order_position', direction: 'asc' }) => {
  let query = supabase
    .from('todos')
    .select(`
      *,
      users!todos_user_id_fkey(id, full_name, email),
      assigned_by_user:users!todos_assigned_by_fkey(id, full_name, email),
      comments:todo_comments(count),
      attachments:todo_attachments(count)
    `);

  // Apply filters
  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }

  if (filters.priority && filters.priority.length > 0) {
    query = query.in('priority', filters.priority);
  }

  if (filters.category && filters.category.length > 0) {
    query = query.in('category', filters.category);
  }

  if (filters.user_id && filters.user_id.length > 0) {
    query = query.in('user_id', filters.user_id);
  }

  if (filters.involved_user_id) {
    query = query.or(`user_id.eq.${filters.involved_user_id},assigned_by.eq.${filters.involved_user_id}`);
  }

  if (filters.assigned_by && filters.assigned_by.length > 0) {
    query = query.in('assigned_by', filters.assigned_by);
  }

  if (filters.due_date_from) {
    query = query.gte('due_date', filters.due_date_from);
  }

  if (filters.due_date_to) {
    query = query.lte('due_date', filters.due_date_to);
  }

  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  if (filters.is_overdue) {
    query = query.lt('due_date', new Date().toISOString()).neq('status', 'completed');
  }

  if (filters.is_team_task !== undefined) {
    query = query.eq('is_team_task', filters.is_team_task);
  }

  if (filters.tags && filters.tags.length > 0) {
    query = query.overlaps('tags', filters.tags);
  }

  // Apply sorting
  query = query.order(sort.field, { ascending: sort.direction === 'asc' });

  return query;
};

// Hook for fetching todos
export const useTodosQuery = (
  filters: TodoFilters = {},
  sort: TodoSortOptions = { field: 'order_position', direction: 'asc' },
  options: { enableRealtime?: boolean } = {}
) => {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const { user } = useAuth();

  const queryKey = ['todos', filters, sort];

  // Set up real-time subscription
  useEffect(() => {
    if (!options.enableRealtime || !user) return;

    const channelName = `todos_${user.id}_${Math.random().toString(36).substr(2, 9)}`;
    const channel = supabase.channel(channelName);

    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'todos'
        },
        (payload) => {
          console.log('[useTodosQuery] Todo change received:', payload);

          // Invalidate queries to refresh the todo list
          queryClient.invalidateQueries({
            queryKey: ['todos'],
            refetchType: 'active',
          });
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.error('[useTodosQuery] Subscription error:', err);
          return;
        }
        console.log(`[useTodosQuery] Realtime status → ${status}`);
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [queryClient, options.enableRealtime, user]);

  return useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await buildTodoQuery(filters, sort);

      if (error) {
        console.error('Error fetching todos:', error);
        throw new Error(`Failed to fetch todos: ${error.message}`);
      }

      return data || [];
    },
    staleTime: 30000, // 30 seconds
    enabled: !!user,
  });
};

// Hook for fetching single todo with details
export const useTodoQuery = (todoId: string) => {
  return useQuery({
    queryKey: ['todos', todoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('todos')
        .select(`
          *,
          users!todos_user_id_fkey(id, full_name, email),
          assigned_by_user:users!todos_assigned_by_fkey(id, full_name, email),
          comments:todo_comments(
            *,
            users(id, full_name, email)
          ),
          attachments:todo_attachments(
            *,
            uploaded_by_user:users(id, full_name, email)
          )
        `)
        .eq('id', todoId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch todo: ${error.message}`);
      }

      return data;
    },
    enabled: !!todoId,
  });
};

// Hook for fetching team todos (for managers)
export const useTeamTodosQuery = (teamMemberIds: string[], filters: TodoFilters = {}) => {
  const { user, profile } = useAuth();

  return useQuery({
    queryKey: ['team-todos', teamMemberIds, filters],
    queryFn: async () => {
      const { data, error } = await buildTodoQuery({
        ...filters,
        user_id: teamMemberIds,
      });

      if (error) {
        throw new Error(`Failed to fetch team todos: ${error.message}`);
      }

      return data || [];
    },
    enabled: !!user && profile?.role === 'manager' && teamMemberIds.length > 0,
  });
};

// Hook for fetching all todos (for super admins)
export const useAllTodosQuery = (filters: TodoFilters = {}) => {
  const { user, profile } = useAuth();

  return useQuery({
    queryKey: ['all-todos', filters],
    queryFn: async () => {
      const { data, error } = await buildTodoQuery(filters);

      if (error) {
        throw new Error(`Failed to fetch all todos: ${error.message}`);
      }

      return data || [];
    },
    enabled: !!user && profile?.role === 'super_admin',
  });
};

// Hook for fetching todo statistics
export const useTodoStatsQuery = (userId?: string) => {
  return useQuery({
    queryKey: ['todo-stats', userId],
    queryFn: async (): Promise<TodoStats> => {
      let query = supabase.from('todos').select('status, due_date');

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch todo stats: ${error.message}`);
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const stats: TodoStats = {
        total: data.length,
        pending: 0,
        in_progress: 0,
        completed: 0,
        cancelled: 0,
        overdue: 0,
        due_today: 0,
        due_this_week: 0,
        completion_rate: 0,
      };

      data.forEach(todo => {
        stats[todo.status as keyof TodoStats]++;

        if (todo.due_date) {
          const dueDate = new Date(todo.due_date);

          if (dueDate < now && todo.status !== 'completed') {
            stats.overdue++;
          }

          if (dueDate >= today && dueDate < new Date(today.getTime() + 24 * 60 * 60 * 1000)) {
            stats.due_today++;
          }

          if (dueDate >= now && dueDate <= weekFromNow) {
            stats.due_this_week++;
          }
        }
      });

      stats.completion_rate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

      return stats;
    },
  });
};

// Create todo mutation
export const useCreateTodoMutation = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async (todoData: CreateTodoData): Promise<Todo> => {
      const { data, error } = await supabase
        .from('todos')
        .insert([{ ...todoData, status: 'pending' }])
        .select(`
          *,
          users!todos_user_id_fkey(id, full_name, email),
          assigned_by_user:users!todos_assigned_by_fkey(id, full_name, email)
        `)
        .single();

      if (error) {
        throw new Error(`Failed to create todo: ${error.message}`);
      }

      return data;
    },
    onSuccess: async (newTodo) => {
      toast.success('Todo created successfully!');
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      queryClient.invalidateQueries({ queryKey: ['todo-stats'] });

      // Notify the assignee if it's not the creator
      if (profile && newTodo.user_id !== profile.id) {
        try {
          await supabase.from('notifications').insert([{
            user_id: newTodo.user_id,
            type: 'task_assigned',
            title: 'New Task Assigned',
            message: `${profile.full_name || 'A team member'} assigned you a new task: "${newTodo.title}"`,
            entity_type: 'task',
            entity_id: newTodo.id,
            is_read: false,
            delivery_method: ['in_app'],
            notification_date: new Date().toISOString()
          }]);
        } catch (e) {
          console.error('Failed to notify assignee:', e);
        }
      }
    },
    onError: (error: Error) => {
      console.error('Error creating todo:', error);
      toast.error(`Failed to create todo: ${error.message}`);
    },
  });
};

// Update todo mutation
export const useUpdateTodoMutation = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTodoData }): Promise<Todo> => {
      const { data: updatedTodo, error } = await supabase
        .from('todos')
        .update(data)
        .eq('id', id)
        .select(`
          *,
          users!todos_user_id_fkey(id, full_name, email),
          assigned_by_user:users!todos_assigned_by_fkey(id, full_name, email)
        `)
        .single();

      if (error) {
        throw new Error(`Failed to update todo: ${error.message}`);
      }

      return updatedTodo;
    },
    onSuccess: async (updatedTodo) => {
      toast.success('Todo updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      queryClient.invalidateQueries({ queryKey: ['todos', updatedTodo.id] });
      queryClient.invalidateQueries({ queryKey: ['todo-stats'] });

      // If the assignee updates the progress of a team task, notify the assigner
      if (profile && updatedTodo.assigned_by && updatedTodo.user_id === profile.id && updatedTodo.is_team_task) {
        try {
          await supabase.from('notifications').insert([{
            user_id: updatedTodo.assigned_by,
            type: 'task_updated',
            title: 'Assigned Task Updated',
            message: `${profile.full_name || 'A team member'} updated the status of their assigned task to "${updatedTodo.status.replace('_', ' ')}": "${updatedTodo.title}"`,
            entity_type: 'task',
            entity_id: updatedTodo.id,
            is_read: false,
            delivery_method: ['in_app'],
            notification_date: new Date().toISOString()
          }]);
        } catch (e) {
          console.error('Failed to notify assigner:', e);
        }
      }
    },
    onError: (error: Error) => {
      console.error('Error updating todo:', error);
      toast.error(`Failed to update todo: ${error.message}`);
    },
  });
};

// Delete todo mutation
export const useDeleteTodoMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (todoId: string): Promise<void> => {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', todoId);

      if (error) {
        throw new Error(`Failed to delete todo: ${error.message}`);
      }
    },
    onSuccess: () => {
      toast.success('Todo deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      queryClient.invalidateQueries({ queryKey: ['todo-stats'] });
    },
    onError: (error: Error) => {
      console.error('Error deleting todo:', error);
      toast.error(`Failed to delete todo: ${error.message}`);
    },
  });
};

// Reorder todos mutation (for drag and drop)
export const useReorderTodosMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reorderData: { todoId: string; newPosition: number }[]): Promise<void> => {
      const updates = reorderData.map(({ todoId, newPosition }) =>
        supabase
          .from('todos')
          .update({ order_position: newPosition })
          .eq('id', todoId)
      );

      const results = await Promise.all(updates);

      for (const result of results) {
        if (result.error) {
          throw new Error(`Failed to reorder todos: ${result.error.message}`);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
    onError: (error: Error) => {
      console.error('Error reordering todos:', error);
      toast.error(`Failed to reorder todos: ${error.message}`);
    },
  });
};

// Add comment mutation
export const useAddCommentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentData: CreateTodoCommentData): Promise<TodoComment> => {
      const { data, error } = await supabase
        .from('todo_comments')
        .insert([commentData])
        .select(`
          *,
          users(id, full_name, email)
        `)
        .single();

      if (error) {
        throw new Error(`Failed to add comment: ${error.message}`);
      }

      return data;
    },
    onSuccess: (newComment) => {
      toast.success('Comment added successfully!');
      queryClient.invalidateQueries({ queryKey: ['todos', newComment.todo_id] });
    },
    onError: (error: Error) => {
      console.error('Error adding comment:', error);
      toast.error(`Failed to add comment: ${error.message}`);
    },
  });
};

// Bulk operations mutation
export const useBulkTodoOperationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (operation: BulkTodoOperation): Promise<void> => {
      const { action, todo_ids, data } = operation;

      switch (action) {
        case 'update_status':
          const { error: statusError } = await supabase
            .from('todos')
            .update({ status: data?.status })
            .in('id', todo_ids);

          if (statusError) {
            throw new Error(`Failed to update status: ${statusError.message}`);
          }
          break;

        case 'update_priority':
          const { error: priorityError } = await supabase
            .from('todos')
            .update({ priority: data?.priority })
            .in('id', todo_ids);

          if (priorityError) {
            throw new Error(`Failed to update priority: ${priorityError.message}`);
          }
          break;

        case 'delete':
          const { error: deleteError } = await supabase
            .from('todos')
            .delete()
            .in('id', todo_ids);

          if (deleteError) {
            throw new Error(`Failed to delete todos: ${deleteError.message}`);
          }
          break;

        case 'assign':
          const { error: assignError } = await supabase
            .from('todos')
            .update({
              assigned_by: data?.assigned_by,
              is_team_task: true
            })
            .in('id', todo_ids);

          if (assignError) {
            throw new Error(`Failed to assign todos: ${assignError.message}`);
          }
          break;

        default:
          throw new Error(`Unsupported bulk operation: ${action}`);
      }
    },
    onSuccess: (_, operation) => {
      toast.success(`Bulk operation completed: ${operation.todo_ids.length} todos affected`);
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      queryClient.invalidateQueries({ queryKey: ['todo-stats'] });
    },
    onError: (error: Error) => {
      console.error('Error performing bulk operation:', error);
      toast.error(`Bulk operation failed: ${error.message}`);
    },
  });
}; 