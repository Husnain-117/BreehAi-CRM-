import React, { useState, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { Todo, TodoFilters, TodoSortOptions, TodoStatus, TodoPriority } from '../../types';
import { useReorderTodosMutation, useBulkTodoOperationMutation } from '../../hooks/queries/useTodosQuery';
import { useAuth } from '../../contexts/AuthContext';
import TodoItem from './TodoItem';
import {
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  CheckIcon,
  XMarkIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/react/24/outline';

interface TodoListProps {
  todos: Todo[];
  filters: TodoFilters;
  onFiltersChange: (filters: TodoFilters) => void;
  sort: TodoSortOptions;
  onSortChange: (sort: TodoSortOptions) => void;
  onTodoEdit?: (todo: Todo) => void;
  onTodoView?: (todo: Todo) => void;
  isLoading?: boolean;
  showAssignee?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canReorder?: boolean;
}

const TodoList: React.FC<TodoListProps> = ({
  todos,
  filters,
  onFiltersChange,
  sort,
  onSortChange,
  onTodoEdit,
  onTodoView,
  isLoading = false,
  showAssignee = false,
  canEdit = true,
  canDelete = true,
  canReorder = true,
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedTodos, setSelectedTodos] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  
  const { profile } = useAuth();
  const reorderMutation = useReorderTodosMutation();
  const bulkOperationMutation = useBulkTodoOperationMutation();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Sort and filter todos
  const sortedTodos = useMemo(() => {
    let filtered = [...todos];

    // Apply local filters for immediate UI feedback
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(todo => 
        todo.title.toLowerCase().includes(searchLower) ||
        (todo.description && todo.description.toLowerCase().includes(searchLower))
      );
    }

    // Sort todos
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sort.field) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'due_date':
          aValue = a.due_date ? new Date(a.due_date).getTime() : 0;
          bValue = b.due_date ? new Date(b.due_date).getTime() : 0;
          break;
        case 'priority':
          const priorityOrder = { 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'updated_at':
          aValue = new Date(a.updated_at).getTime();
          bValue = new Date(b.updated_at).getTime();
          break;
        case 'order_position':
        default:
          aValue = a.order_position;
          bValue = b.order_position;
          break;
      }

      if (sort.direction === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [todos, filters, sort]);

  const activeTodo = useMemo(() => {
    return sortedTodos.find(todo => todo.id === activeId);
  }, [sortedTodos, activeId]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      setActiveId(null);
      return;
    }

    const oldIndex = sortedTodos.findIndex(todo => todo.id === active.id);
    const newIndex = sortedTodos.findIndex(todo => todo.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reorderedTodos = arrayMove(sortedTodos, oldIndex, newIndex);
      
      // Update order positions
      const reorderData = reorderedTodos.map((todo, index) => ({
        todoId: todo.id,
        newPosition: index,
      }));

      reorderMutation.mutate(reorderData);
    }

    setActiveId(null);
  };

  const handleSelectTodo = (todoId: string, selected: boolean) => {
    const newSelected = new Set(selectedTodos);
    if (selected) {
      newSelected.add(todoId);
    } else {
      newSelected.delete(todoId);
    }
    setSelectedTodos(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleSelectAll = () => {
    if (selectedTodos.size === sortedTodos.length) {
      setSelectedTodos(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedTodos(new Set(sortedTodos.map(todo => todo.id)));
      setShowBulkActions(true);
    }
  };

  const handleBulkOperation = async (action: string, data?: any) => {
    if (selectedTodos.size === 0) return;

    try {
      await bulkOperationMutation.mutateAsync({
        action: action as any,
        todo_ids: Array.from(selectedTodos),
        data,
      });
      setSelectedTodos(new Set());
      setShowBulkActions(false);
    } catch (error) {
      console.error('Bulk operation failed:', error);
    }
  };

  const statusCounts = useMemo(() => {
    return sortedTodos.reduce((acc, todo) => {
      acc[todo.status] = (acc[todo.status] || 0) + 1;
      return acc;
    }, {} as Record<TodoStatus, number>);
  }, [sortedTodos]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Stats and Controls */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center space-x-6">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{sortedTodos.length}</span> todos
          </div>
          
          {/* Status Counts */}
          <div className="flex items-center space-x-4 text-sm">
            {statusCounts.pending > 0 && (
              <span className="text-gray-600">
                <span className="font-medium">{statusCounts.pending}</span> pending
              </span>
            )}
            {statusCounts.in_progress > 0 && (
              <span className="text-blue-600">
                <span className="font-medium">{statusCounts.in_progress}</span> in progress
              </span>
            )}
            {statusCounts.completed > 0 && (
              <span className="text-green-600">
                <span className="font-medium">{statusCounts.completed}</span> completed
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-l-lg transition-colors ${
                viewMode === 'list' 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <ListBulletIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-r-lg transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Squares2X2Icon className="h-4 w-4" />
            </button>
          </div>

          {/* Sort Dropdown */}
          <select
            value={`${sort.field}-${sort.direction}`}
            onChange={(e) => {
              const [field, direction] = e.target.value.split('-');
              onSortChange({ 
                field: field as TodoSortOptions['field'], 
                direction: direction as 'asc' | 'desc' 
              });
            }}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="order_position-asc">Manual Order</option>
            <option value="due_date-asc">Due Date (Earliest)</option>
            <option value="due_date-desc">Due Date (Latest)</option>
            <option value="priority-desc">Priority (High to Low)</option>
            <option value="priority-asc">Priority (Low to High)</option>
            <option value="created_at-desc">Recently Created</option>
            <option value="created_at-asc">Oldest First</option>
            <option value="title-asc">Title (A-Z)</option>
            <option value="title-desc">Title (Z-A)</option>
          </select>

          {/* Bulk Select */}
          {canEdit && (
            <button
              onClick={handleSelectAll}
              className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={selectedTodos.size === sortedTodos.length && sortedTodos.length > 0}
                onChange={() => {}}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Select All</span>
            </button>
          )}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-indigo-800">
              <span className="font-medium">{selectedTodos.size}</span> todos selected
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkOperation('update_status', { status: 'completed' })}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
              >
                Mark Complete
              </button>
              <button
                onClick={() => handleBulkOperation('update_status', { status: 'in_progress' })}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                In Progress
              </button>
              <button
                onClick={() => handleBulkOperation('update_priority', { priority: 'high' })}
                className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700"
              >
                High Priority
              </button>
              {canDelete && (
                <button
                  onClick={() => {
                    if (window.confirm(`Delete ${selectedTodos.size} todos?`)) {
                      handleBulkOperation('delete');
                    }
                  }}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                >
                  Delete
                </button>
              )}
              <button
                onClick={() => {
                  setSelectedTodos(new Set());
                  setShowBulkActions(false);
                }}
                className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Todo List */}
      {sortedTodos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="text-gray-400 mb-4">
            <ListBulletIcon className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No todos found</h3>
          <p className="text-gray-500">
            {filters.search || Object.keys(filters).length > 0
              ? 'Try adjusting your filters to see more todos.'
              : 'Create your first todo to get started!'
            }
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={sortedTodos.map(todo => todo.id)} 
            strategy={verticalListSortingStrategy}
          >
            <div className={`
              ${viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' 
                : 'space-y-3'
              }
            `}>
              {sortedTodos.map((todo) => (
                <div key={todo.id} className="relative">
                  {canEdit && (
                    <div className="absolute top-2 left-2 z-10">
                      <input
                        type="checkbox"
                        checked={selectedTodos.has(todo.id)}
                        onChange={(e) => handleSelectTodo(todo.id, e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </div>
                  )}
                  <TodoItem
                    todo={todo}
                    onEdit={onTodoEdit}
                    onView={onTodoView}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    showAssignee={showAssignee}
                    isDragDisabled={!canReorder || sort.field !== 'order_position'}
                  />
                </div>
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeTodo && (
              <TodoItem
                todo={activeTodo}
                canEdit={false}
                canDelete={false}
                isDragDisabled={true}
              />
            )}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
};

export default TodoList; 