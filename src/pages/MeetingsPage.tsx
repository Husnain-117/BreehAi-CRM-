// src/pages/MeetingsPage.tsx
import React from 'react';
import { useMeetingsQuery } from '../hooks/queries/useMeetingsQuery';
import { Meeting } from '../types'; // Assuming Meeting type is exported from types

const MeetingsPage: React.FC = () => {
  const { data: meetings, isLoading, error } = useMeetingsQuery({}); // Fetch all meetings

  if (isLoading) return <p>Loading meetings...</p>;
  if (error) return <p>Error fetching meetings: {error.message}</p>;
  if (!meetings || meetings.length === 0) return <p>No meetings scheduled yet.</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Meetings Management</h1>
      <div className="space-y-4">
        {meetings.map((meeting: Meeting) => (
          <div key={meeting.id} className="bg-white shadow rounded-lg p-4">
            <h2 className="text-lg font-semibold text-indigo-600">{meeting.title}</h2>
            <p className="text-sm text-gray-700">
              Lead: {meeting.leads?.client_id || 'N/A'} {/* Adjust based on actual structure */}
            </p>
            <p className="text-sm text-gray-700">
              Agent: {meeting.users?.full_name || 'N/A'} {/* Adjust based on actual structure */}
            </p>
            <p className="text-sm text-gray-500">
              Date: {new Date(meeting.start_time).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-500">
              Time: {new Date(meeting.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(meeting.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            {meeting.location && <p className="text-sm text-gray-500">Location: {meeting.location}</p>}
            {meeting.notes && <p className="text-sm text-gray-500">Notes: {meeting.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MeetingsPage; 