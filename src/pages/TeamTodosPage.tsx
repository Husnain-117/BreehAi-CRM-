import React, { useState, useMemo } from 'react';
import { 
  useTeamTodosQuery, 
  useCreateTodoMutation, 
  useUpdateTodoMutation 
} from '../hooks/queries/useTodosQuery';
import { useAuth } from '../contexts/AuthContext';
import { Todo, TodoFilters, TodoSortOptions, CreateTodoData, UpdateTodoData, UserProfile } from '../types';
import TodoList from '../components/todos/TodoList';
import TodoForm from '../components/todos/TodoForm';
import { supabase } from '../api/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import {
  PlusIcon,
  UsersIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

const TeamTodosPage: React.FC = () => {
  const { profile } = useAuth();
  const [filters, setFilters] = useState<TodoFilters>({});
  const [sort, setSort] = useState<TodoSortOptions>({ field: 'order_position', direction: 'asc' });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [selectedTeamMember, setSelectedTeamMember] = useState<string>('all');

  // Fetch team members
  const { data: teamMembers = [], isLoading: loadingTeamMembers } = useQuery({
    queryKey: ['team-members', profile?.id],
    queryFn: async (): Promise<UserProfile[]> => {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, role')
        .eq('manager_id', profile?.id);
      
      if (error) {
        throw new Error(`Failed to fetch team members: ${error.message}`);
      }
      
      return data || [];
    },
    enabled: !!profile?.id && profile?.role === 'manager',
  });

  const teamMemberIds = useMemo(() => {
    if (selectedTeamMember === 'all') {
      return teamMembers.map(member => member.id);
    }
    return [selectedTeamMember];
  }, [teamMembers, selectedTeamMember]);

  // Queries
  const { data: todos = [], isLoading, error } = useTeamTodosQuery(
    teamMemberIds,
    filters
  );

  // Mutations
  const createTodoMutation = useCreateTodoMutation();
  const updateTodoMutation = useUpdateTodoMutation();

  const handleCreateTodo = (data: CreateTodoData | UpdateTodoData) => {
    createTodoMutation.mutateAsync(data as CreateTodoData).then(() => {
      setShowCreateForm(false);
    }).catch((error) => {
      console.error('Failed to create todo:', error);
    });
  };

  const handleUpdateTodo = (data: CreateTodoData | UpdateTodoData) => {
    if (!editingTodo) return;
    
    updateTodoMutation.mutateAsync({
      id: editingTodo.id,
      data: data as UpdateTodoData,
    }).then(() => {
      setEditingTodo(null);
    }).catch((error) => {
      console.error('Failed to update todo:', error);
    });
  };

  // Team stats
  const teamStats = useMemo(() => {
    const stats = {
      total: todos.length,
      pending: 0,
      in_progress: 0,
      completed: 0,
      overdue: 0,
      by_member: {} as Record<string, number>,
    };

    const now = new Date();

    todos.forEach(todo => {
      stats[todo.status as keyof typeof stats]++;
      
      if (todo.due_date && new Date(todo.due_date) < now && todo.status !== 'completed') {
        stats.overdue++;
      }

      if (todo.users) {
        stats.by_member[todo.users.full_name] = (stats.by_member[todo.users.full_name] || 0) + 1;
      }
    });

    return stats;
  }, [todos]);

  if (profile?.role !== 'manager') {
    return (
      <div className="text-center py-12">
        <UsersIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-500">Only managers can access team todos.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <ChartBarIcon className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load team todos</h3>
        <p className="text-gray-500">{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Todos</h1>
          <p className="text-gray-600 mt-1">
            Manage and assign tasks to your team members
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Assign Todo
        </button>
      </div>

      {/* Team Member Filter */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Filter by Team Member:</label>
          <select
            value={selectedTeamMember}
            onChange={(e) => setSelectedTeamMember(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Team Members ({teamMembers.length})</option>
            {teamMembers.map(member => (
              <option key={member.id} value={member.id}>
                {member.full_name} ({teamStats.by_member[member.full_name] || 0} todos)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{teamStats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{teamStats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <div className="w-3 h-3 bg-green-600 rounded-full"></div>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{teamStats.completed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <div className="w-3 h-3 bg-red-600 rounded-full"></div>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-gray-900">{teamStats.overdue}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Member Performance */}
      {Object.keys(teamStats.by_member).length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Team Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(teamStats.by_member).map(([memberName, count]) => (
              <div key={memberName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-900">{memberName}</span>
                <span className="text-sm text-gray-600">{count} todos</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Todo List */}
      <TodoList
        todos={todos}
        filters={filters}
        onFiltersChange={setFilters}
        sort={sort}
        onSortChange={setSort}
        onTodoEdit={setEditingTodo}
        isLoading={isLoading || loadingTeamMembers}
        showAssignee={true}
        canEdit={true}
        canDelete={true}
        canReorder={false} // Disable reordering for team todos
      />

      {/* Create Todo Form */}
      {showCreateForm && (
        <TodoForm
          onSubmit={handleCreateTodo}
          onCancel={() => setShowCreateForm(false)}
          isLoading={createTodoMutation.isLoading}
          teamMembers={teamMembers}
          canAssign={true}
        />
      )}

      {/* Edit Todo Form */}
      {editingTodo && (
        <TodoForm
          todo={editingTodo}
          onSubmit={handleUpdateTodo}
          onCancel={() => setEditingTodo(null)}
          isLoading={updateTodoMutation.isLoading}
          teamMembers={teamMembers}
          canAssign={true}
        />
      )}
    </div>
  );
};

export default TeamTodosPage; 