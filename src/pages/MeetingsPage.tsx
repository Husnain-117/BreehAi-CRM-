import React, { useState, useEffect } from 'react';
import { useMeetingsQuery } from '../hooks/queries/useMeetingsQuery';
import { useLeadsQuery } from '../hooks/queries/useLeadsQuery';
import { useUsersQuery } from '../hooks/queries/useUsersQuery';
import { useCreateMeetingMutation, NewMeetingData } from '../hooks/mutations/useCreateMeetingMutation';
import { useUpdateMeetingMutation, UpdateMeetingData } from '../hooks/mutations/useUpdateMeetingMutation';
import { useDeleteMeetingMutation } from '../hooks/mutations/useDeleteMeetingMutation';
import CreateMeetingModal from '../components/modals/CreateMeetingModal';
import EditMeetingModal from '../components/modals/EditMeetingModal';
import RescheduleMeetingModal from '../components/modals/RescheduleMeetingModal';
import ViewMeetingDetailsModal from '../components/modals/ViewMeetingDetailsModal';
import MeetingList from '../components/meeting/MeetingList';
import { Meeting } from '../types';
import { toast } from 'react-hot-toast';

const MeetingsPage: React.FC = () => {
  const { data: meetings, refetch: refetchMeetings, isFetching: isFetchingMeetings } = useMeetingsQuery({});
  const { data: leadsResponse, isLoading: isLoadingLeads } = useLeadsQuery({});
  const { data: usersArray, isLoading: isLoadingUsers } = useUsersQuery({});

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [selectedLead, setSelectedLead] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<Meeting['status'] | ''>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('start_time_asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const meetingsPerPage = 9;
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentEditingMeeting, setCurrentEditingMeeting] = useState<Meeting | null>(null);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [currentReschedulingMeeting, setCurrentReschedulingMeeting] = useState<Meeting | null>(null);
  const [isViewDetailsModalOpen, setIsViewDetailsModalOpen] = useState(false);
  const [currentViewingMeeting, setCurrentViewingMeeting] = useState<Meeting | null>(null);

  const createMeetingMutation = useCreateMeetingMutation();
  const updateMeetingMutation = useUpdateMeetingMutation();
  const deleteMeetingMutation = useDeleteMeetingMutation();

  const agents = Array.isArray(usersArray) ? usersArray.filter(user => user.role === 'agent') : [];
  const leadsList = leadsResponse?.leads || [];

  const handleCreateMeetingSubmit = async (formData: Omit<Meeting, 'id' | 'created_at' | 'updated_at' | 'leads' | 'users'> & { lead_id: string; agent_id: string }) => {
    const meetingPayload: NewMeetingData = {
      title: formData.title,
      lead_id: formData.lead_id,
      agent_id: formData.agent_id,
      start_time: formData.start_time,
      end_time: formData.end_time,
      location: formData.location || undefined,
      notes: formData.notes || undefined,
    };

    try {
      await createMeetingMutation.mutateAsync(meetingPayload);
      setCreateModalOpen(false);
      await refetchMeetings();
      toast.success('Meeting created successfully!');
    } catch (err) {
      console.error("Error creating meeting:", err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      toast.error(`Error creating meeting: ${errorMessage}`);
    }
  };

  const handleOpenEditModal = (meeting: Meeting) => {
    setCurrentEditingMeeting(meeting);
    setIsEditModalOpen(true);
  };

  const handleUpdateMeetingSubmit = async (meetingData: UpdateMeetingData) => {
    try {
      await updateMeetingMutation.mutateAsync(meetingData);
      setIsEditModalOpen(false);
      setCurrentEditingMeeting(null);
      await refetchMeetings();
      toast.success('Meeting updated successfully!');
    } catch (err) {
      console.error("Error updating meeting:", err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      toast.error(`Error updating meeting: ${errorMessage}`);
    }
  };

  const handleDeleteMeeting = async (meetingId: string, meetingTitle: string) => {
    if (window.confirm(`Are you sure you want to delete the meeting "${meetingTitle}"? This action cannot be undone.`)) {
      try {
        await deleteMeetingMutation.mutateAsync(meetingId);
        await refetchMeetings();
      } catch (err) {
        console.error("Error deleting meeting (from component):", err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during deletion.';
        toast.error(`Failed to delete meeting: ${errorMessage}`);
      }
    }
  };

  const handleCompleteMeeting = async (meetingId: string, meetingTitle: string) => {
    console.log('handleCompleteMeeting called with ID:', meetingId, 'Title:', meetingTitle);
    if (window.confirm(`Are you sure you want to mark the meeting "${meetingTitle}" as Completed?`)) {
      try {
        // Wait for the refetch to complete and get the updated data
        const { data: updatedMeetings } = await refetchMeetings();
        console.log('Refetched meetings:', updatedMeetings);

        // Check if the meeting still exists in the updated data
        const meetingToUpdate = updatedMeetings?.find(m => m.id === meetingId);
        if (!meetingToUpdate) {
          toast.error(`Meeting "${meetingTitle}" not found. It may have been deleted or modified.`);
          return;
        }

        // Proceed with the update
        await updateMeetingMutation.mutateAsync({
          id: meetingId,
          status: 'Completed',
        });

        // Refetch again to ensure UI is up-to-date
        await refetchMeetings();
        toast.success('Meeting marked as completed!');
      } catch (err) {
        console.error("Error completing meeting:", err);
      }
    }
  };

  const handleOpenRescheduleModal = (meeting: Meeting) => {
    setCurrentReschedulingMeeting(meeting);
    setIsRescheduleModalOpen(true);
  };

  const handleRescheduleMeetingSubmit = async (data: { id: string; start_time: string; end_time: string }) => {
    try {
      const { data: updatedMeetings } = await refetchMeetings();
      const meetingToUpdate = updatedMeetings?.find(m => m.id === data.id);
      if (!meetingToUpdate) {
        toast.error('Meeting not found. It may have been deleted or modified.');
        return;
      }

      await updateMeetingMutation.mutateAsync({
        id: data.id,
        start_time: data.start_time,
        end_time: data.end_time,
        status: 'Scheduled',
      });

      setIsRescheduleModalOpen(false);
      setCurrentReschedulingMeeting(null);
      await refetchMeetings();
      toast.success('Meeting rescheduled successfully!');
    } catch (err) {
      console.error("Error rescheduling meeting:", err);
    }
  };

  const handleOpenViewDetailsModal = (meeting: Meeting) => {
    setCurrentViewingMeeting(meeting);
    setIsViewDetailsModalOpen(true);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedAgent, selectedLead, selectedStatus, dateFrom, dateTo, sortBy]);

  return (
    <div className="p-4 sm:p-6 bg-gray-100 min-h-screen flex flex-col">
      {isFetchingMeetings && (
        <div className="p-4 text-center text-gray-600">Loading meetings...</div>
      )}
      <div className="flex-grow">
        <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 md:mb-0">Scheduled Meetings</h1>
            <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3 w-full md:w-auto">
              <input
                type="text"
                placeholder="Search meetings..."
                className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-auto"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                onClick={() => setCreateModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition duration-150 w-full sm:w-auto whitespace-nowrap"
              >
                + Create New Meeting
              </button>
            </div>
          </div>
        </div>

        <MeetingList
          searchTerm={searchTerm}
          selectedAgent={selectedAgent}
          selectedLead={selectedLead}
          selectedStatus={selectedStatus}
          dateFrom={dateFrom}
          dateTo={dateTo}
          sortBy={sortBy}
          currentPage={currentPage}
          meetingsPerPage={meetingsPerPage}
          onOpenCreateModal={() => setCreateModalOpen(true)}
          onOpenEditModal={handleOpenEditModal}
          onCompleteMeeting={handleCompleteMeeting}
          onOpenRescheduleModal={handleOpenRescheduleModal}
          onDeleteMeeting={handleDeleteMeeting}
          onOpenViewDetailsModal={handleOpenViewDetailsModal}
          setCurrentPage={setCurrentPage}
          setSelectedAgent={setSelectedAgent}
          setSelectedLead={setSelectedLead}
          setSelectedStatus={setSelectedStatus}
          setDateFrom={setDateFrom}
          setDateTo={setDateTo}
          setSortBy={setSortBy}
        />
      </div>

      <CreateMeetingModal
        isOpen={isCreateModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateMeetingSubmit}
        leads={leadsList}
        agents={agents}
        isLoadingLeads={isLoadingLeads}
        isLoadingAgents={isLoadingUsers}
      />

      {currentEditingMeeting && (
        <EditMeetingModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setCurrentEditingMeeting(null);
          }}
          onSubmit={handleUpdateMeetingSubmit}
          meetingToEdit={currentEditingMeeting}
          leads={leadsList}
          agents={agents}
          isLoadingLeads={isLoadingLeads}
          isLoadingAgents={isLoadingUsers}
        />
      )}

      {currentReschedulingMeeting && (
        <RescheduleMeetingModal
          isOpen={isRescheduleModalOpen}
          onClose={() => {
            setIsRescheduleModalOpen(false);
            setCurrentReschedulingMeeting(null);
          }}
          onSubmit={handleRescheduleMeetingSubmit}
          meetingToReschedule={currentReschedulingMeeting}
        />
      )}

      {currentViewingMeeting && (
        <ViewMeetingDetailsModal
          isOpen={isViewDetailsModalOpen}
          onClose={() => {
            setIsViewDetailsModalOpen(false);
            setCurrentViewingMeeting(null);
          }}
          meeting={currentViewingMeeting}
        />
      )}
    </div>
  );
};

export default MeetingsPage;