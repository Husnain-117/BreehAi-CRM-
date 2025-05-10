import React, { useState, useEffect } from 'react';
import { FollowUp } from '../../types';

interface RescheduleFollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { id: string; due_date: string }) => void; // Only ID and new due_date needed
  followUpToReschedule: FollowUp | null;
}

const RescheduleFollowUpModal: React.FC<RescheduleFollowUpModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  followUpToReschedule,
}) => {
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (isOpen && followUpToReschedule) {
      setDueDate(new Date(followUpToReschedule.due_date).toISOString().split('T')[0]);
    } else if (!isOpen) {
      // Reset to a default or clear if needed when closed
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDueDate(tomorrow.toISOString().split('T')[0]);
    }
  }, [isOpen, followUpToReschedule]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpToReschedule) {
      alert('No follow-up selected for rescheduling.');
      return;
    }
    if (!dueDate) {
      alert('Please select a new Due Date.');
      return;
    }

    onSubmit({
      id: followUpToReschedule.id,
      due_date: new Date(dueDate).toISOString(),
    });
  };

  if (!isOpen || !followUpToReschedule) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Reschedule Follow-Up</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        <p className="text-sm text-gray-600 mb-1">
          Lead: <span className="font-semibold">{followUpToReschedule.leads?.clients?.client_name || followUpToReschedule.leads?.client_id || 'N/A'}</span>
        </p>
        <p className="text-sm text-gray-600 mb-4">
          Current Due Date: <span className="font-semibold">{new Date(followUpToReschedule.due_date).toLocaleDateString()}</span>
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="reschedule-followup-dueDate" className="block text-sm font-medium text-gray-700">New Due Date <span className="text-red-500">*</span></label>
            <input
              type="date"
              id="reschedule-followup-dueDate"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Reschedule Follow-Up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RescheduleFollowUpModal; 