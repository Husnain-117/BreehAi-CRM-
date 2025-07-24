import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Todo, TodoStatus, TodoPriority } from '../../types';
import { useUpdateTodoMutation, useDeleteTodoMutation } from '../../hooks/queries/useTodosQuery';
import { useAuth } from '../../contexts/AuthContext';
import { format, formatDistanceToNow, isToday, isPast } from 'date-fns';
import {
  Bars3Icon,
  CheckIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  ChatBubbleLeftIcon,
  PaperClipIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon as ClockSolidIcon,
} from '@heroicons/react/24/solid';

interface TodoItemProps {
  todo: Todo;
  onEdit?: (todo: Todo) => void;
  onView?: (todo: Todo) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  showAssignee?: boolean;
  isDragDisabled?: boolean;
}

const TodoItem: React.FC<TodoItemProps> = ({
  todo,
  onEdit,
  onView,
  canEdit = true,
  canDelete = true,
  showAssignee = false,
  isDragDisabled = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const titleInputRef = useRef<HTMLInputElement>(null);
  
  const { profile } = useAuth();
  const updateTodoMutation = useUpdateTodoMutation();
  const deleteTodoMutation = useDeleteTodoMutation();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: todo.id,
    disabled: isDragDisabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditing]);

  const handleStatusChange = async (newStatus: TodoStatus) => {
    try {
      await updateTodoMutation.mutateAsync({
        id: todo.id,
        data: { status: newStatus },
      });
    } catch (error) {
      console.error('Failed to update todo status:', error);
    }
  };

  const handlePriorityChange = async (newPriority: TodoPriority) => {
    try {
      await updateTodoMutation.mutateAsync({
        id: todo.id,
        data: { priority: newPriority },
      });
    } catch (error) {
      console.error('Failed to update todo priority:', error);
    }
  };

  const handleTitleSave = async () => {
    if (editTitle.trim() && editTitle !== todo.title) {
      try {
        await updateTodoMutation.mutateAsync({
          id: todo.id,
          data: { title: editTitle.trim() },
        });
      } catch (error) {
        console.error('Failed to update todo title:', error);
        setEditTitle(todo.title); // Reset on error
      }
    } else {
      setEditTitle(todo.title); // Reset if no change
    }
    setIsEditing(false);
  };

  const handleTitleCancel = () => {
    setEditTitle(todo.title);
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      handleTitleCancel();
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this todo?')) {
      try {
        await deleteTodoMutation.mutateAsync(todo.id);
      } catch (error) {
        console.error('Failed to delete todo:', error);
      }
    }
  };

  const getPriorityColor = (priority: TodoPriority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: TodoStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'in_progress':
        return <ClockSolidIcon className="h-5 w-5 text-blue-600" />;
      case 'cancelled':
        return <XMarkIcon className="h-5 w-5 text-red-600" />;
      default:
        return <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />;
    }
  };

  const isOverdue = todo.due_date && isPast(new Date(todo.due_date)) && todo.status !== 'completed';
  const isDueToday = todo.due_date && isToday(new Date(todo.due_date));

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group relative bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200
        ${todo.status === 'completed' ? 'opacity-75' : ''}
        ${isOverdue ? 'border-red-300 bg-red-50' : ''}
        ${isDueToday ? 'border-yellow-300 bg-yellow-50' : ''}
        ${isDragging ? 'shadow-lg z-10' : ''}
      `}
    >
      {/* Drag Handle */}
      {!isDragDisabled && (
        <div
          {...attributes}
          {...listeners}
          className="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        >
          <Bars3Icon className="h-4 w-4 text-gray-400" />
        </div>
      )}

      <div className={`${!isDragDisabled ? 'ml-6' : ''}`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-3 flex-1">
            {/* Status Checkbox */}
            <button
              onClick={() => handleStatusChange(todo.status === 'completed' ? 'pending' : 'completed')}
              className="flex-shrink-0 hover:scale-110 transition-transform"
              disabled={!canEdit}
            >
              {getStatusIcon(todo.status)}
            </button>

            {/* Title */}
            <div className="flex-1">
              {isEditing ? (
                <input
                  ref={titleInputRef}
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={handleKeyPress}
                  className="w-full text-sm font-medium bg-transparent border-none outline-none focus:ring-0 p-0"
                  disabled={updateTodoMutation.isLoading}
                />
              ) : (
                <h3
                  className={`text-sm font-medium cursor-pointer hover:text-blue-600 transition-colors ${
                    todo.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'
                  }`}
                  onClick={() => {
                    if (canEdit) {
                      setIsEditing(true);
                    } else if (onView) {
                      onView(todo);
                    }
                  }}
                >
                  {todo.title}
                </h3>
              )}
            </div>

            {/* Priority Badge */}
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(todo.priority)}`}>
              {todo.priority}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {canEdit && (
              <button
                onClick={() => onEdit?.(todo)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
                title="Edit todo"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
            )}
            {canDelete && (
              <button
                onClick={handleDelete}
                className="p-1 text-gray-400 hover:text-red-600 rounded"
                title="Delete todo"
                disabled={deleteTodoMutation.isLoading}
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Description */}
        {todo.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {todo.description}
          </p>
        )}

        {/* Meta Information */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            {/* Due Date */}
            {todo.due_date && (
              <div className={`flex items-center space-x-1 ${
                isOverdue ? 'text-red-600' : isDueToday ? 'text-yellow-600' : ''
              }`}>
                <CalendarIcon className="h-3 w-3" />
                <span>
                  {isOverdue && <ExclamationTriangleIcon className="h-3 w-3 inline mr-1" />}
                  {format(new Date(todo.due_date), 'MMM d')}
                  {isDueToday && ' (Today)'}
                </span>
              </div>
            )}

            {/* Comments Count */}
            {todo.comments_count && todo.comments_count > 0 && (
              <div className="flex items-center space-x-1">
                <ChatBubbleLeftIcon className="h-3 w-3" />
                <span>{todo.comments_count}</span>
              </div>
            )}

            {/* Attachments Count */}
            {todo.attachments_count && todo.attachments_count > 0 && (
              <div className="flex items-center space-x-1">
                <PaperClipIcon className="h-3 w-3" />
                <span>{todo.attachments_count}</span>
              </div>
            )}

            {/* Category */}
            {todo.category && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                {todo.category}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Assignee */}
            {showAssignee && todo.users && (
              <div className="flex items-center space-x-1">
                <UserIcon className="h-3 w-3" />
                <span>{todo.users.full_name}</span>
              </div>
            )}

            {/* Created Time */}
            <div className="flex items-center space-x-1">
              <ClockIcon className="h-3 w-3" />
              <span>{formatDistanceToNow(new Date(todo.created_at), { addSuffix: true })}</span>
            </div>
          </div>
        </div>

        {/* Tags */}
        {todo.tags && todo.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {todo.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Team Task Indicator */}
        {todo.is_team_task && todo.assigned_by_user && (
          <div className="mt-2 text-xs text-gray-500 flex items-center space-x-1">
            <UserIcon className="h-3 w-3" />
            <span>Assigned by {todo.assigned_by_user.full_name}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TodoItem; 