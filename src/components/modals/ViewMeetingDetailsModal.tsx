import React from 'react';
import { Meeting } from '../../types';

interface ViewMeetingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: Meeting | null;
}

// Placeholder icons if not imported from a shared file
const DefaultLocationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5 text-gray-500 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const DefaultClipboardListIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5 text-gray-500 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;

// Define these if you don't have them from MeetingsPage to avoid prop drilling or context
const SimpleCalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5 text-gray-500 inline" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>;
const SimpleUserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5 text-gray-500 inline" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>;
const SimpleLeadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5 text-gray-500 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
const SimpleClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5 text-gray-500 inline" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clipRule="evenodd" /></svg>;

const getStatusClass = (status: Meeting['status'] | undefined) => {
  switch (status) {
    case 'Scheduled': return 'bg-blue-100 text-blue-800';
    case 'Completed': return 'bg-green-100 text-green-800';
    case 'Pending': return 'bg-yellow-100 text-yellow-800';
    case 'Cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const ViewMeetingDetailsModal: React.FC<ViewMeetingDetailsModalProps> = ({ isOpen, onClose, meeting }) => {
  if (!isOpen || !meeting) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Meeting Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl">&times;</button>
        </div>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold text-indigo-700 mb-1">{meeting.title}</h3>
            {meeting.status && (
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusClass(meeting.status)}`}>
                    {meeting.status}
                </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div className="flex items-center text-gray-700">
              <SimpleLeadIcon /> <strong className="mr-2">Lead:</strong> {meeting.leads?.clients?.client_name || meeting.leads?.client_id || 'N/A'}
            </div>
            <div className="flex items-center text-gray-700">
              <SimpleUserIcon /> <strong className="mr-2">Agent:</strong> {meeting.users?.full_name || 'N/A'}
            </div>
            <div className="flex items-center text-gray-700">
              <SimpleCalendarIcon /> <strong className="mr-2">Date:</strong> {new Date(meeting.start_time).toLocaleDateString()}
            </div>
            <div className="flex items-center text-gray-700">
              <SimpleClockIcon /> <strong className="mr-2">Time:</strong> 
              {new Date(meeting.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })} - 
              {new Date(meeting.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
            </div>
            {meeting.location && (
              <div className="flex items-center text-gray-700 md:col-span-2">
                <DefaultLocationIcon /> <strong className="mr-2">Location:</strong> {meeting.location}
              </div>
            )}
          </div>

          {meeting.notes && (
            <div className="mt-4 pt-3 border-t border-gray-200">
              <h4 className="text-md font-semibold text-gray-700 mb-1 flex items-center"><DefaultClipboardListIcon /> Notes:</h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded-md">{meeting.notes}</p>
            </div>
          )}
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

export default ViewMeetingDetailsModal; 