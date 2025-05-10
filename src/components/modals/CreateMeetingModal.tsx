import React, { useState, useEffect } from 'react';
import { Meeting, Lead, UserProfile } from '../../types'; // Assuming these types are available
import { SelectField } from '../ui/SelectField'; // Import SelectField

interface CreateMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (meetingData: Omit<Meeting, 'id' | 'created_at' | 'updated_at' | 'leads' | 'users'> & { lead_id: string; agent_id: string }) => void;
  leads: Lead[]; 
  agents: UserProfile[];
  isLoadingLeads?: boolean;
  isLoadingAgents?: boolean;
}

const CreateMeetingModal: React.FC<CreateMeetingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  leads,
  agents,
  isLoadingLeads,
  isLoadingAgents,
}) => {
  const [title, setTitle] = useState('');
  const [leadId, setLeadId] = useState(''); 
  const [agentId, setAgentId] = useState(''); 
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'Scheduled' | 'Pending'>('Scheduled');

  useEffect(() => {
    if (isOpen) {
        const today = new Date().toISOString().split('T')[0];
        setDate(today);
        setTitle('New Meeting'); 
        setLeadId('');
        setAgentId('');
        setStartTime('09:00'); 
        setEndTime('10:00');   
        setLocation('');
        setNotes('');
        setStatus('Scheduled');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !leadId || !agentId || !date || !startTime || !endTime) {
      alert('Please fill in all required fields: Title, Lead, Agent, Date, Start Time, and End Time.');
      return;
    }
    const start_time = new Date(`${date}T${startTime}`).toISOString();
    const end_time = new Date(`${date}T${endTime}`).toISOString();

    onSubmit({
      title,
      lead_id: leadId,
      agent_id: agentId,
      start_time,
      end_time,
      status,
      location: location || undefined,
      notes: notes || undefined,
    });
  };

  if (!isOpen) return null;

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
          <h2 className="text-xl font-semibold text-gray-800">Create New Meeting</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>
          
          <SelectField
            id="leadId"
            label="Lead"
            value={leadId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setLeadId(e.target.value)}
            options={leadOptions}
            isLoading={isLoadingLeads}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />

          <SelectField
            id="agentId"
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
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">Start Time <span className="text-red-500">*</span></label>
              <input
                type="time"
                id="startTime"
                value={startTime}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartTime(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">End Time <span className="text-red-500">*</span></label>
              <input
                type="time"
                id="endTime"
                value={endTime}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndTime(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
              />
            </div>
          </div>
           <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
            <select
              id="status"
              value={status}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value as 'Scheduled' | 'Pending')}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="Scheduled">Scheduled</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location (Optional)</label>
            <input
              type="text"
              id="location"
              value={location}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocation(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
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
              Create Meeting
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMeetingModal; 