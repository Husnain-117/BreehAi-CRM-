import React, { useState, useEffect } from 'react';
import { Meeting, Lead, UserProfile } from '../../types'; // Assuming Meeting type is available
import { UpdateMeetingData } from '../../hooks/mutations/useUpdateMeetingMutation'; // For the onSubmit prop
import { SelectField } from '../ui/SelectField'; // Import SelectField

interface EditMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (meetingData: UpdateMeetingData) => void;
  meetingToEdit: Meeting | null;
  leads: Lead[];
  agents: UserProfile[];
  isLoadingLeads?: boolean;
  isLoadingAgents?: boolean;
}

const EditMeetingModal: React.FC<EditMeetingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  meetingToEdit,
  leads,
  agents,
  isLoadingLeads,
  isLoadingAgents,
}) => {
  const [title, setTitle] = useState('');
  const [leadId, setLeadId] = useState<string>(''); // Changed from string | null
  const [agentId, setAgentId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [status, setStatus] = useState<Meeting['status']>('Scheduled');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen && meetingToEdit) {
      setTitle(meetingToEdit.title);
      setLeadId(meetingToEdit.lead_id || ''); // Handle possible null from meetingToEdit.lead_id
      setAgentId(meetingToEdit.agent_id);
      
      const startDate = new Date(meetingToEdit.start_time);
      const endDate = new Date(meetingToEdit.end_time);

      setDate(startDate.toISOString().split('T')[0]);
      setStartTime(startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
      setEndTime(endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
      
      setStatus(meetingToEdit.status || 'Scheduled');
      setLocation(meetingToEdit.location || '');
      setNotes(meetingToEdit.notes || '');
    } else if (!isOpen) {
      // Reset fields if needed when modal closes and no meeting is being edited
      // For now, useEffect handles re-population if a new meetingToEdit is passed
    }
  }, [isOpen, meetingToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingToEdit) {
        alert('No meeting selected for editing.');
        return;
    }
    if (!title || !leadId || !agentId || !date || !startTime || !endTime) {
      alert('Please fill in all required fields: Title, Lead, Agent, Date, Start Time, and End Time.');
      return;
    }

    const start_time = new Date(`${date}T${startTime}`).toISOString();
    const end_time = new Date(`${date}T${endTime}`).toISOString();

    onSubmit({
      id: meetingToEdit.id,
      title,
      lead_id: leadId, // This will be string, or empty string if unselected (which is fine if lead_id can be null in DB)
      agent_id: agentId,
      start_time,
      end_time,
      status,
      location: location || undefined,
      notes: notes || undefined,
    });
  };

  if (!isOpen || !meetingToEdit) return null;

  const leadOptions = [
    { value: '', label: 'Select Lead' },
    ...(leads?.map(lead => ({
      value: lead.id,
      label: `${lead.clients?.client_name || lead.contact_person || 'Unnamed Lead'} (ID: ${lead.id.substring(0, 8)}...)`
    })) || [])
  ];

  const agentOptions = [
    { value: '', label: 'Select Agent' },
    ...(agents?.map(agent => ({
      value: agent.id,
      label: agent.full_name || agent.email || 'Unnamed Agent'
    })) || [])
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Edit Meeting</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700">Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              id="edit-title"
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>
          <SelectField
            id="edit-leadId"
            label="Lead"
            value={leadId} // leadId is now always string
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setLeadId(e.target.value)}
            options={leadOptions}
            isLoading={isLoadingLeads}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          <SelectField
            id="edit-agentId"
            label="Agent"
            value={agentId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setAgentId(e.target.value)}
            options={agentOptions}
            isLoading={isLoadingAgents}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="edit-date" className="block text-sm font-medium text-gray-700">Date <span className="text-red-500">*</span></label>
              <input type="date" id="edit-date" value={date} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)} required className="mt-1 block w-full date-input" />
            </div>
            <div>
              <label htmlFor="edit-startTime" className="block text-sm font-medium text-gray-700">Start Time <span className="text-red-500">*</span></label>
              <input type="time" id="edit-startTime" value={startTime} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartTime(e.target.value)} required className="mt-1 block w-full time-input" />
            </div>
            <div>
              <label htmlFor="edit-endTime" className="block text-sm font-medium text-gray-700">End Time <span className="text-red-500">*</span></label>
              <input type="time" id="edit-endTime" value={endTime} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndTime(e.target.value)} required className="mt-1 block w-full time-input" />
            </div>
          </div>
          <div>
            <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700">Status</label>
            <select
              id="edit-status"
              value={status}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value as Meeting['status'])}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label htmlFor="edit-location" className="block text-sm font-medium text-gray-700">Location (Optional)</label>
            <input
              type="text"
              id="edit-location"
              value={location}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocation(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="edit-notes" className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
            <textarea
              id="edit-notes"
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200"> 
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMeetingModal; 