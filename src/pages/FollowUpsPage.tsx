// src/pages/FollowUpsPage.tsx
import React from 'react';
import { useFollowUpsQuery } from '../hooks/queries/useFollowUpsQuery';
import { FollowUp } from '../types'; // Assuming FollowUp type is exported

const FollowUpsPage: React.FC = () => {
  const { data: followUps, isLoading, error } = useFollowUpsQuery({}); // Fetch all follow-ups

  if (isLoading) return <p>Loading follow-ups...</p>;
  if (error) return <p>Error fetching follow-ups: {error.message}</p>;
  if (!followUps || followUps.length === 0) return <p>No follow-ups scheduled yet.</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Follow-Ups Management</h1>
      <div className="space-y-4">
        {followUps.map((followUp: FollowUp) => (
          <div key={followUp.id} className="bg-white shadow rounded-lg p-4">
            <h2 className="text-lg font-semibold text-blue-600">
              {followUp.leads?.client_id ? `Follow-Up for ${followUp.leads.client_id}` : 'Follow-Up'}
            </h2>
            <p className="text-sm text-gray-700">
              Lead: {followUp.leads?.client_id || 'N/A'} {/* Adjust as needed */}
            </p>
            <p className="text-sm text-gray-700">
              Agent: {followUp.users?.full_name || 'N/A'} {/* Adjust as needed */}
            </p>
            <p className="text-sm text-gray-500">
              Due Date: {new Date(followUp.due_date).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-500">Status: {followUp.status}</p>
            {followUp.notes && <p className="text-sm text-gray-500 mt-2">Notes: {followUp.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FollowUpsPage; 