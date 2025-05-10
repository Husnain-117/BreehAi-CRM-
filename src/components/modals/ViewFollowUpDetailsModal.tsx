import React from 'react';
import { FollowUp } from '../../types';

interface ViewFollowUpDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  followUp: FollowUp | null;
}

// Placeholder icons (can be shared or made more specific)
const SimpleUserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5 text-gray-500 inline" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>;
const SimpleLeadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5 text-gray-500 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
const SimpleCalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5 text-gray-500 inline" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>;
const SimpleClipboardListIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5 text-gray-500 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;

const getStatusClass = (status: FollowUp['status'] | undefined) => {
  switch (status) {
    case 'Pending': return 'bg-yellow-100 text-yellow-800';
    case 'Completed': return 'bg-green-100 text-green-800';
    case 'Rescheduled': return 'bg-blue-100 text-blue-800';
    case 'Cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const ViewFollowUpDetailsModal: React.FC<ViewFollowUpDetailsModalProps> = ({ isOpen, onClose, followUp }) => {
  if (!isOpen || !followUp) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Follow-Up Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl">&times;</button>
        </div>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold text-indigo-700 mb-1">
              Follow-up for Lead: {followUp.leads?.clients?.client_name || followUp.leads?.client_id || 'N/A'}
            </h3>
            {followUp.status && (
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusClass(followUp.status)}`}>
                    {followUp.status}
                </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div className="flex items-center text-gray-700">
              <SimpleLeadIcon /> <strong className="mr-2">Lead Name:</strong> {followUp.leads?.clients?.client_name || 'N/A'}
            </div>
            <div className="flex items-center text-gray-700">
              <SimpleLeadIcon /> <strong className="mr-2">Lead ID:</strong> {followUp.lead_id}
            </div>
            <div className="flex items-center text-gray-700">
              <SimpleUserIcon /> <strong className="mr-2">Agent:</strong> {followUp.users?.full_name || followUp.agent_id || 'N/A'}
            </div>
            <div className="flex items-center text-gray-700">
              <SimpleCalendarIcon /> <strong className="mr-2">Due Date:</strong> {new Date(followUp.due_date).toLocaleDateString()}
            </div>
          </div>

          {followUp.notes && (
            <div className="mt-4 pt-3 border-t border-gray-200">
              <h4 className="text-md font-semibold text-gray-700 mb-1 flex items-center"><SimpleClipboardListIcon /> Notes:</h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded-md">{followUp.notes}</p>
            </div>
          )}
          
          <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500">
            <p>Follow-Up ID: {followUp.id}</p>
            <p>Created At: {new Date(followUp.created_at).toLocaleString()}</p>
            <p>Last Updated: {new Date(followUp.updated_at).toLocaleString()}</p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewFollowUpDetailsModal; 