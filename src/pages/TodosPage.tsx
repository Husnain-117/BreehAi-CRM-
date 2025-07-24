import React, { useState, useMemo } from 'react';
import { 
  useTodosQuery, 
  useTodoStatsQuery,
  useCreateTodoMutation, 
  useUpdateTodoMutation 
} from '../hooks/queries/useTodosQuery';
import { useAuth } from '../contexts/AuthContext';
import { Todo, TodoFilters, TodoSortOptions, CreateTodoData, UpdateTodoData } from '../types';
import TodoList from '../components/todos/TodoList';
import TodoForm from '../components/todos/TodoForm';
import {
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const TodosPage: React.FC = () => {
  const { profile } = useAuth();
  const [filters, setFilters] = useState<TodoFilters>({});
  const [sort, setSort] = useState<TodoSortOptions>({ field: 'order_position', direction: 'asc' });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Queries
  const { data: todos = [], isLoading, error } = useTodosQuery(
    { ...filters, search: searchQuery },
    sort,
    { enableRealtime: true }
  );
  
  const { data: stats } = useTodoStatsQuery(profile?.id);

  // Mutations
  const createTodoMutation = useCreateTodoMutation();
  const updateTodoMutation = useUpdateTodoMutation();

  // Filter options
  const filterOptions = useMemo(() => {
    const categories = [...new Set(todos.map(todo => todo.category).filter(Boolean))];
    const tags = [...new Set(todos.flatMap(todo => todo.tags || []))];
    
    return { categories, tags };
  }, [todos]);

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

  const handleFilterChange = (newFilters: Partial<TodoFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
  };

  const hasActiveFilters = Object.keys(filters).length > 0 || searchQuery.length > 0;

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <ChartBarIcon className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load todos</h3>
        <p className="text-gray-500">{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Todos</h1>
          <p className="text-gray-600 mt-1">
            Manage your tasks and stay organized
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Todo
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
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
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
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
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
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
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
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
                <p className="text-2xl font-bold text-gray-900">{stats.overdue}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search todos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
              showFilters || hasActiveFilters
                ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                Active
              </span>
            )}
          </button>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <XMarkIcon className="h-4 w-4 mr-2" />
              Clear
            </button>
          )}
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  multiple
                  value={filters.status || []}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => option.value);
                    handleFilterChange({ status: values.length > 0 ? values as any : undefined });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  size={4}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  multiple
                  value={filters.priority || []}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => option.value);
                    handleFilterChange({ priority: values.length > 0 ? values as any : undefined });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  size={4}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  multiple
                  value={filters.category || []}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => option.value);
                    handleFilterChange({ category: values.length > 0 ? values : undefined });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  size={Math.min(filterOptions.categories.length + 1, 4)}
                >
                  {filterOptions.categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Due Date From</label>
                <input
                  type="date"
                  value={filters.due_date_from || ''}
                  onChange={(e) => handleFilterChange({ due_date_from: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Due Date To</label>
                <input
                  type="date"
                  value={filters.due_date_to || ''}
                  onChange={(e) => handleFilterChange({ due_date_to: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Quick Filters */}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => handleFilterChange({ is_overdue: !filters.is_overdue })}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filters.is_overdue
                    ? 'bg-red-100 text-red-800 border border-red-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                Overdue Only
              </button>
              <button
                onClick={() => handleFilterChange({ 
                  due_date_from: new Date().toISOString().split('T')[0],
                  due_date_to: new Date().toISOString().split('T')[0]
                })}
                className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-colors"
              >
                Due Today
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Todo List */}
      <TodoList
        todos={todos}
        filters={filters}
        onFiltersChange={setFilters}
        sort={sort}
        onSortChange={setSort}
        onTodoEdit={setEditingTodo}
        isLoading={isLoading}
        canEdit={true}
        canDelete={true}
        canReorder={true}
      />

      {/* Create Todo Form */}
      {showCreateForm && (
        <TodoForm
          onSubmit={handleCreateTodo}
          onCancel={() => setShowCreateForm(false)}
          isLoading={createTodoMutation.isLoading}
        />
      )}

      {/* Edit Todo Form */}
      {editingTodo && (
        <TodoForm
          todo={editingTodo}
          onSubmit={handleUpdateTodo}
          onCancel={() => setEditingTodo(null)}
          isLoading={updateTodoMutation.isLoading}
        />
      )}
    </div>
  );
};

export default TodosPage; 