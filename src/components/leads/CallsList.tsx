import React from 'react';
import { PhoneIcon, ArrowPathIcon, PhoneArrowUpRightIcon, PhoneXMarkIcon, PhoneArrowDownLeftIcon, VoicemailIcon } from '@heroicons/react/24/outline';
import { format, formatDistanceToNow } from 'date-fns';

type Call = {
  id: string;
  call_type: 'inbound' | 'outbound' | 'callback' | 'voicemail';
  outcome: 'completed' | 'no_answer' | 'busy' | 'failed' | 'voicemail';
  duration: number; // in seconds
  notes: string | null;
  call_start_time: string;
  created_at: string;
  user: {
    id: string;
    full_name: string;
    avatar_url?: string;
  } | null;
};

interface CallsListProps {
  calls: Call[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export const CallsList: React.FC<CallsListProps> = ({ calls, isLoading, onRefresh }) => {
  const getCallIcon = (callType: string) => {
    switch (callType) {
      case 'outbound':
        return <PhoneArrowUpRightIcon className="h-4 w-4 text-blue-500" />;
      case 'inbound':
        return <PhoneArrowDownLeftIcon className="h-4 w-4 text-green-500" />;
      case 'voicemail':
        return <VoicemailIcon className="h-4 w-4 text-purple-500" />;
      default:
        return <PhoneIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getOutcomeBadge = (outcome: string) => {
    const baseClasses = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium';
    
    switch (outcome) {
      case 'completed':
        return <span className={`${baseClasses} bg-green-100 text-green-800`}>Completed</span>;
      case 'no_answer':
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>No Answer</span>;
      case 'busy':
        return <span className={`${baseClasses} bg-orange-100 text-orange-800`}>Busy</span>;
      case 'failed':
        return <span className={`${baseClasses} bg-red-100 text-red-800`}>Failed</span>;
      case 'voicemail':
        return <span className={`${baseClasses} bg-purple-100 text-purple-800`}>Voicemail</span>;
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>Unknown</span>;
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (calls.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <PhoneIcon className="mx-auto h-12 w-12 text-gray-300" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No calls found</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by making your first call.</p>
      </div>
    );
  }

  return (
    <div className="flow-root">
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  When
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  By
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {calls.map((call) => (
                <tr key={call.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {getCallIcon(call.call_type)}
                      </div>
                      <div className="ml-2 text-sm font-medium text-gray-900 capitalize">
                        {call.call_type}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900">
                      {getOutcomeBadge(call.outcome)}
                    </div>
                    {call.notes && (
                      <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {call.notes}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {formatDuration(call.duration)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    <div title={format(new Date(call.call_start_time), 'PPpp')}>
                      {formatDistanceToNow(new Date(call.call_start_time), { addSuffix: true })}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {call.user?.full_name || 'System'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CallsList;
