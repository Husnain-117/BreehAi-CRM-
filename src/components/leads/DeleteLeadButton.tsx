// DeleteLeadButton.tsx - Reusable component for deleting leads
import React, { useState } from 'react';
import { TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/20/solid';
import { Button } from '@/components/ui/button';
import { useDeleteLeadMutation } from '@/hooks/mutations/useDeleteLeadMutation';
import { Lead } from '@/types';
import toast from 'react-hot-toast';

interface DeleteLeadButtonProps {
  lead: Lead;
  variant?: 'button' | 'icon' | 'text';
  size?: 'sm' | 'lg';
  showConfirmDialog?: boolean;
  onDeleteSuccess?: () => void;
  className?: string;
}

export const DeleteLeadButton: React.FC<DeleteLeadButtonProps> = ({
  lead,
  variant = 'button',
  size = 'sm',
  showConfirmDialog = true,
  onDeleteSuccess,
  className = ''
}) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const deleteLeadMutation = useDeleteLeadMutation();

  const handleDelete = async () => {
    if (showConfirmDialog && !showConfirm) {
      setShowConfirm(true);
      return;
    }

    try {
      await deleteLeadMutation.mutateAsync(lead.id);
      toast.success(`Lead for ${lead.clients?.client_name || 'Unknown'} deleted successfully`);
      onDeleteSuccess?.();
      setShowConfirm(false);
    } catch (error) {
      console.error('Error deleting lead:', error);
      setShowConfirm(false);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  const clientName = lead.clients?.client_name || lead.contact_person || 'Unknown Client';

  // Render different variants
  if (variant === 'icon') {
    return (
      <>
        <Button
          size={size}
          variant="outline"
          onClick={handleDelete}
          disabled={deleteLeadMutation.isLoading}
          className={`border-red-300 text-red-700 hover:bg-red-50 ${className}`}
          title="Delete this lead"
        >
          <TrashIcon className="h-4 w-4" />
        </Button>

        {/* Confirmation Dialog */}
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center mb-4">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-500 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Confirm Delete</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete the lead for "{clientName}"? 
                This will also delete all associated follow-ups and meetings. This action cannot be undone.
              </p>
              
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button
                  onClick={handleDelete}
                  disabled={deleteLeadMutation.isLoading}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  {deleteLeadMutation.isLoading ? 'Deleting...' : 'Delete Lead'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  if (variant === 'text') {
    return (
      <>
        <button
          onClick={handleDelete}
          disabled={deleteLeadMutation.isLoading}
          className={`text-red-600 hover:text-red-800 text-sm font-medium ${className}`}
        >
          {deleteLeadMutation.isLoading ? 'Deleting...' : 'Delete'}
        </button>

        {/* Confirmation Dialog */}
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center mb-4">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-500 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Confirm Delete</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete the lead for "{clientName}"? 
                This will also delete all associated follow-ups and meetings. This action cannot be undone.
              </p>
              
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button
                  onClick={handleDelete}
                  disabled={deleteLeadMutation.isLoading}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  {deleteLeadMutation.isLoading ? 'Deleting...' : 'Delete Lead'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Default button variant
  return (
    <>
      <Button
        size={size}
        variant="outline"
        onClick={handleDelete}
        disabled={deleteLeadMutation.isLoading}
        className={`border-red-300 text-red-700 hover:bg-red-50 ${className}`}
      >
        <TrashIcon className="h-4 w-4 mr-2" />
        {deleteLeadMutation.isLoading ? 'Deleting...' : 'Delete Lead'}
      </Button>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center mb-4">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Confirm Delete</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the lead for "{clientName}"? 
              This will also delete all associated follow-ups and meetings. This action cannot be undone.
            </p>
            
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={deleteLeadMutation.isLoading}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                {deleteLeadMutation.isLoading ? 'Deleting...' : 'Delete Lead'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Usage examples:

// 1. Icon only (for table actions)
// <DeleteLeadButton lead={lead} variant="icon" />

// 2. Text link (for dropdowns)
// <DeleteLeadButton lead={lead} variant="text" />

// 3. Full button (for forms or detailed views)
// <DeleteLeadButton lead={lead} variant="button" size="md" />

// 4. Without confirmation dialog (if you handle confirmation elsewhere)
// <DeleteLeadButton lead={lead} showConfirmDialog={false} />

// 5. With custom styling and callback
// <DeleteLeadButton 
//   lead={lead} 
//   className="my-custom-class" 
//   onDeleteSuccess={() => navigate('/leads')} 
// />