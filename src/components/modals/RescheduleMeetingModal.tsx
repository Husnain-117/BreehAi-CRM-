import React, { useState, useEffect } from 'react';
import { Meeting } from '../../types';

interface RescheduleMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { id: string; start_time: string; end_time: string }) => void;
  meetingToReschedule: Meeting | null;
}

const RescheduleMeetingModal: React.FC<RescheduleMeetingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  meetingToReschedule,
}) => {
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  useEffect(() => {
    if (isOpen && meetingToReschedule) {
      const startDate = new Date(meetingToReschedule.start_time);
      const endDate = new Date(meetingToReschedule.end_time);

      setDate(startDate.toISOString().split('T')[0]);
      setStartTime(startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
      setEndTime(endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    } else if (!isOpen) {
        // Reset if needed when closed, though useEffect dependency on meetingToReschedule should handle new data
        const today = new Date().toISOString().split('T')[0];
        setDate(today);
        setStartTime('09:00');
        setEndTime('10:00');
    }
  }, [isOpen, meetingToReschedule]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingToReschedule) {
        alert('No meeting selected for rescheduling.');
        return;
    }
    if (!date || !startTime || !endTime) {
      alert('Please fill in Date, Start Time, and End Time.');
      return;
    }

    const start_time_iso = new Date(`${date}T${startTime}`).toISOString();
    const end_time_iso = new Date(`${date}T${endTime}`).toISOString();

    onSubmit({
      id: meetingToReschedule.id,
      start_time: start_time_iso,
      end_time: end_time_iso,
    });
  };

  if (!isOpen || !meetingToReschedule) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Reschedule Meeting</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        <p className="text-sm text-gray-600 mb-1">Meeting: <span className="font-semibold">{meetingToReschedule.title}</span></p>
        <p className="text-sm text-gray-600 mb-4">Current: {new Date(meetingToReschedule.start_time).toLocaleString()} - {new Date(meetingToReschedule.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div>
              <label htmlFor="reschedule-date" className="block text-sm font-medium text-gray-700">New Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                id="reschedule-date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="reschedule-startTime" className="block text-sm font-medium text-gray-700">Start Time <span className="text-red-500">*</span></label>
              <input
                type="time"
                id="reschedule-startTime"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="reschedule-endTime" className="block text-sm font-medium text-gray-700">End Time <span className="text-red-500">*</span></label>
              <input
                type="time"
                id="reschedule-endTime"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
              />
            </div>
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
              Reschedule Meeting
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RescheduleMeetingModal; 