import React, { useState, useEffect } from 'react';
import { FollowUp } from '../../types';

// Type for the data needed to update a follow-up (subset of FollowUp fields)
export interface UpdateFollowUpData {
  id: string;
  lead_id?: string;
  agent_id?: string;
  due_date?: string; // ISO string
  status?: 'Pending' | 'Completed' | 'Rescheduled' | 'Cancelled';
  notes?: string;
}

interface EditFollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (followUpData: UpdateFollowUpData) => void;
  followUpToEdit: FollowUp | null;
}

const EditFollowUpModal: React.FC<EditFollowUpModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  followUpToEdit,
}) => {
  const [leadId, setLeadId] = useState('');
  const [agentId, setAgentId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<FollowUp['status']>('Pending');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen && followUpToEdit) {
      setLeadId(followUpToEdit.lead_id);
      setAgentId(followUpToEdit.agent_id);
      setDueDate(new Date(followUpToEdit.due_date).toISOString().split('T')[0]);
      setStatus(followUpToEdit.status || 'Pending');
      setNotes(followUpToEdit.notes || '');
    } else if (!isOpen) {
      // Optionally reset fields when modal is closed if not re-initializing through followUpToEdit
    }
  }, [isOpen, followUpToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpToEdit) {
      alert('No follow-up selected for editing.');
      return;
    }
    if (!leadId || !agentId || !dueDate) {
      alert('Please fill in all required fields: Lead, Agent, and Due Date.');
      return;
    }

    onSubmit({
      id: followUpToEdit.id,
      lead_id: leadId,
      agent_id: agentId,
      due_date: new Date(dueDate).toISOString(),
      status,
      notes: notes || undefined,
    });
  };

  if (!isOpen || !followUpToEdit) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Edit Follow-Up</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="edit-followup-leadId" className="block text-sm font-medium text-gray-700">Lead <span className="text-red-500">*</span> (ID)</label>
            <input
              type="text"
              id="edit-followup-leadId"
              placeholder="Lead ID"
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
              // Potentially make read-only or use a selector
            />
          </div>
          <div>
            <label htmlFor="edit-followup-agentId" className="block text-sm font-medium text-gray-700">Agent <span className="text-red-500">*</span> (ID)</label>
            <input
              type="text"
              id="edit-followup-agentId"
              placeholder="Agent ID"
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="edit-followup-dueDate" className="block text-sm font-medium text-gray-700">Due Date <span className="text-red-500">*</span></label>
            <input
              type="date"
              id="edit-followup-dueDate"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="edit-followup-status" className="block text-sm font-medium text-gray-700">Status</label>
            <select
              id="edit-followup-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as FollowUp['status'])}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Rescheduled">Rescheduled</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label htmlFor="edit-followup-notes" className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
            <textarea
              id="edit-followup-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditFollowUpModal; 