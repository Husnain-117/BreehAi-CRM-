import React, { useState, useEffect } from 'react';
import { Todo, CreateTodoData, UpdateTodoData, TodoPriority, UserProfile } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import {
  XMarkIcon,
  CalendarIcon,
  TagIcon,
  UserIcon,
  FlagIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface TodoFormProps {
  todo?: Todo;
  onSubmit: (data: CreateTodoData | UpdateTodoData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  teamMembers?: UserProfile[];
  canAssign?: boolean;
}

const TodoForm: React.FC<TodoFormProps> = ({
  todo,
  onSubmit,
  onCancel,
  isLoading = false,
  teamMembers = [],
  canAssign = false,
}) => {
  const { profile } = useAuth();
  const [formData, setFormData] = useState({
    title: todo?.title || '',
    description: todo?.description || '',
    priority: todo?.priority || 'medium' as TodoPriority,
    due_date: todo?.due_date ? todo.due_date.split('T')[0] : '',
    due_time: todo?.due_date ? format(new Date(todo.due_date), 'HH:mm') : '',
    category: todo?.category || '',
    tags: todo?.tags || [],
    user_id: todo?.user_id || profile?.id || '',
    is_team_task: todo?.is_team_task || false,
  });

  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Categories for autocomplete
  const commonCategories = [
    'Work',
    'Personal',
    'Meeting',
    'Follow-up',
    'Research',
    'Development',
    'Marketing',
    'Sales',
    'Support',
    'Planning',
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.target === document.activeElement) {
      e.preventDefault();
      if (newTag.trim()) {
        handleAddTag();
      } else {
        handleSubmit();
      }
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (formData.due_date && formData.due_time) {
      const dueDateTime = new Date(`${formData.due_date}T${formData.due_time}`);
      if (dueDateTime < new Date()) {
        newErrors.due_date = 'Due date cannot be in the past';
      }
    }

    if (canAssign && !formData.user_id) {
      newErrors.user_id = 'Please assign this todo to someone';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const submitData: CreateTodoData | UpdateTodoData = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      priority: formData.priority,
      category: formData.category.trim() || undefined,
      tags: formData.tags.length > 0 ? formData.tags : undefined,
    };

    // Handle due date
    if (formData.due_date) {
      const dueDateTime = formData.due_time 
        ? `${formData.due_date}T${formData.due_time}:00.000Z`
        : `${formData.due_date}T23:59:59.000Z`;
      submitData.due_date = dueDateTime;
    }

    // Handle assignment (only for create or if user can assign)
    if (!todo || canAssign) {
      (submitData as CreateTodoData).user_id = formData.user_id;
      (submitData as CreateTodoData).is_team_task = formData.is_team_task;
    }

    onSubmit(submitData);
  };

  const priorityOptions: { value: TodoPriority; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: 'text-green-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'high', label: 'High', color: 'text-orange-600' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-600' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onCancel} />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              {todo ? 'Edit Todo' : 'Create New Todo'}
            </h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <div className="px-6 py-4 space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                onKeyPress={handleKeyPress}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter todo title..."
                autoFocus
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Add more details about this todo..."
              />
            </div>

            {/* Priority and Category Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Priority */}
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                  <FlagIcon className="h-4 w-4 inline mr-1" />
                  Priority
                </label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value as TodoPriority)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {priorityOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <input
                  type="text"
                  id="category"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  list="categories"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g. Work, Personal..."
                />
                <datalist id="categories">
                  {commonCategories.map(category => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Due Date and Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarIcon className="h-4 w-4 inline mr-1" />
                Due Date & Time
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => handleInputChange('due_date', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 ${
                      errors.due_date ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.due_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.due_date}</p>
                  )}
                </div>
                <div>
                  <input
                    type="time"
                    value={formData.due_time}
                    onChange={(e) => handleInputChange('due_time', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={!formData.due_date}
                  />
                </div>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <TagIcon className="h-4 w-4 inline mr-1" />
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Add a tag..."
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-200 text-sm"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Assignment (for managers/admins) */}
            {canAssign && teamMembers.length > 0 && (
              <div>
                <label htmlFor="user_id" className="block text-sm font-medium text-gray-700 mb-2">
                  <UserIcon className="h-4 w-4 inline mr-1" />
                  Assign To
                </label>
                <select
                  id="user_id"
                  value={formData.user_id}
                  onChange={(e) => {
                    handleInputChange('user_id', e.target.value);
                    handleInputChange('is_team_task', e.target.value !== profile?.id);
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 ${
                    errors.user_id ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select team member...</option>
                  {teamMembers.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.full_name} ({member.email})
                    </option>
                  ))}
                </select>
                {errors.user_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.user_id}</p>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end px-6 py-4 border-t border-gray-200 bg-gray-50 space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || !formData.title.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {todo ? 'Updating...' : 'Creating...'}
                </div>
              ) : (
                todo ? 'Update Todo' : 'Create Todo'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TodoForm; 