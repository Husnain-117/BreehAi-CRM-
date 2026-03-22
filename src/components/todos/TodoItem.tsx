import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Todo, TodoStatus, TodoPriority } from '../../types';
import { useUpdateTodoMutation, useDeleteTodoMutation } from '../../hooks/queries/useTodosQuery';
import { useAuth } from '../../contexts/AuthContext';
import { format, isToday, isPast } from 'date-fns';
import {
  Bars4Icon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  ChatBubbleLeftIcon,
  PaperClipIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import {
  CheckCircleIcon,
  XMarkIcon,
  PlayCircleIcon,
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
  canEdit = true, // Left original props intact so it doesn't break parent expectations
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

  // Role Based Permission Logic
  const isCreator = profile ? (todo.is_team_task ? profile.id === todo.assigned_by : profile.id === todo.user_id) : false;
  const isAssignee = profile ? profile.id === todo.user_id : false;
  const isSuperAdmin = profile?.role === 'super_admin';

  // Strict Permissions Override
  const canEditTask = canEdit && (isCreator || isSuperAdmin);
  const canUpdateProgress = canEdit && (isCreator || isAssignee || isSuperAdmin);
  const canDeleteTask = canDelete && (isCreator || isSuperAdmin);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: todo.id,
    disabled: isDragDisabled || !canEditTask,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : 1,
  };

  useEffect(() => {
    if (isEditing && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditing]);

  const handleStatusChange = async (newStatus: TodoStatus) => {
    if (!canUpdateProgress) return;
    try {
      await updateTodoMutation.mutateAsync({
        id: todo.id,
        data: { status: newStatus },
      });
    } catch (error) {
      console.error('Failed to update todo status:', error);
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
        setEditTitle(todo.title);
      }
    } else {
      setEditTitle(todo.title);
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
    if (!canDeleteTask) return;
    if (window.confirm(`Are you sure you want to delete "${todo.title}"?`)) {
      try {
        await deleteTodoMutation.mutateAsync(todo.id);
      } catch (error) {
        console.error('Failed to delete todo:', error);
      }
    }
  };

  const getPriorityColor = (priority: TodoPriority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-50 text-red-700 border-red-200';
      case 'high': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: TodoStatus) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon className="h-6 w-6 text-emerald-500" />;
      case 'in_progress': return <PlayCircleIcon className="h-6 w-6 text-indigo-500" />;
      case 'cancelled': return <XMarkIcon className="h-6 w-6 text-slate-400" />;
      default: return <div className="h-5 w-5 border-2 border-slate-300 rounded-full m-0.5" />;
    }
  };

  const isOverdue = todo.due_date && isPast(new Date(todo.due_date)) && todo.status !== 'completed';
  const isDueToday = todo.due_date && isToday(new Date(todo.due_date));

  // Determine border edge color for subtle status indication
  const edgeColor = todo.status === 'completed' ? 'border-l-emerald-500'
    : todo.status === 'in_progress' ? 'border-l-indigo-500'
      : isOverdue ? 'border-l-red-500' : 'border-l-transparent';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group relative flex items-start gap-3 bg-white border border-slate-200 border-l-4 ${edgeColor}
        rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200
        ${todo.status === 'completed' ? 'opacity-70 bg-slate-50' : ''}
        ${isOverdue ? 'bg-red-50/30' : ''}
      `}
    >
      {/* Drag Handle */}
      {(!isDragDisabled && canEditTask) && (
        <div
          {...attributes}
          {...listeners}
          className="absolute left-[-12px] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing transition-opacity"
        >
          <Bars4Icon className="h-4 w-4" />
        </div>
      )}

      {/* Checkbox / Status Toggle */}
      <button
        onClick={() => {
          if (!canUpdateProgress) return;
          const nextStatus = todo.status === 'completed' ? 'pending' : todo.status === 'pending' ? 'in_progress' : 'completed';
          handleStatusChange(nextStatus);
        }}
        className={`flex-shrink-0 mt-0.5 rounded-full transition-transform ${canUpdateProgress ? 'cursor-pointer hover:scale-110 hover:shadow-sm' : 'cursor-not-allowed opacity-60'}`}
        disabled={!canUpdateProgress}
        title={canUpdateProgress ? "Click to cycle progress (Pending \u2192 In Progress \u2192 Completed)" : "You do not have permission to update task status"}
      >
        {getStatusIcon(todo.status)}
      </button>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">

          <div className="flex-1">
            {isEditing && canEditTask ? (
              <input
                ref={titleInputRef}
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleKeyPress}
                className="w-full text-base font-semibold text-slate-900 bg-white border border-indigo-300 rounded px-2 py-1 outline-none ring-2 ring-indigo-500/20"
                disabled={updateTodoMutation.isLoading}
              />
            ) : (
              <h3
                className={`text-base font-semibold truncate leading-snippet transition-colors ${todo.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-900'
                  } ${canEditTask ? 'cursor-text hover:text-indigo-600' : ''}`}
                onClick={() => {
                  if (canEditTask) setIsEditing(true);
                  else if (onView) onView(todo);
                }}
              >
                {todo.title}
              </h3>
            )}

            {todo.description && (
              <p className="mt-1 text-sm text-slate-500 line-clamp-1 group-hover:line-clamp-none transition-all duration-300">
                {todo.description}
              </p>
            )}
          </div>

          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${getPriorityColor(todo.priority)} shadow-sm uppercase tracking-wider`}>
              {todo.priority}
            </span>

            {/* Actions Menu */}
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {canEditTask && (
                <button onClick={() => onEdit?.(todo)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="Edit details">
                  <PencilIcon className="h-4 w-4" />
                </button>
              )}
              {canDeleteTask && (
                <button onClick={handleDelete} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete task" disabled={deleteTodoMutation.isLoading}>
                  <TrashIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer info (Metadata, Tags) */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">

          {/* Due Date */}
          {todo.due_date && (
            <div className={`flex items-center gap-1.5 font-medium ${isOverdue ? 'text-red-600' : isDueToday ? 'text-amber-600' : 'text-slate-600'}`}>
              <CalendarIcon className="h-3.5 w-3.5" />
              <span>
                {isOverdue && <ExclamationTriangleIcon className="h-3 w-3 inline mr-1" />}
                {format(new Date(todo.due_date), 'MMM d, yyyy')}
                {isDueToday && ' (Today)'}
              </span>
            </div>
          )}

          {/* Creators/Assignees Avatars */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
            <div className="flex flex-col text-[10px] leading-tight text-slate-400">
              {todo.is_team_task && todo.assigned_by_user && (
                <span><span className="font-semibold text-slate-500">From:</span> {todo.assigned_by_user.full_name?.split(' ')[0]}</span>
              )}
              {showAssignee && todo.users && (
                <span><span className="font-semibold text-slate-500">To:</span> {todo.users.full_name?.split(' ')[0]}</span>
              )}
            </div>
          </div>

          {/* Counts */}
          {(todo.comments_count! > 0 || todo.attachments_count! > 0) && (
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
              {todo.comments_count! > 0 && (
                <div className="flex items-center gap-1 hover:text-slate-700 transition-colors" title={`${todo.comments_count} comments`}>
                  <ChatBubbleLeftIcon className="h-3.5 w-3.5" />
                  <span>{todo.comments_count}</span>
                </div>
              )}
              {todo.attachments_count! > 0 && (
                <div className="flex items-center gap-1 hover:text-slate-700 transition-colors" title={`${todo.attachments_count} attachments`}>
                  <PaperClipIcon className="h-3.5 w-3.5" />
                  <span>{todo.attachments_count}</span>
                </div>
              )}
            </div>
          )}

          {/* Category */}
          {todo.category && (
            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-medium">
              {todo.category}
            </span>
          )}

          {/* Tags */}
          {todo.tags && todo.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {todo.tags.map((tag, idx) => (
                <span key={idx} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded text-[10px] font-semibold tracking-wide">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TodoItem;