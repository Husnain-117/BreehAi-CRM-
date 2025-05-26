import React, { useState, useEffect } from 'react';
import { useMeetingsQuery } from '../hooks/queries/useMeetingsQuery';
import { Meeting } from '../types'; // Assuming Meeting type is exported from types
import CreateMeetingModal from '../components/modals/CreateMeetingModal'; // Import the modal
import { useCreateMeetingMutation, NewMeetingData } from '../hooks/mutations/useCreateMeetingMutation'; // Import the mutation and NewMeetingData
import EditMeetingModal from '../components/modals/EditMeetingModal'; // Import Edit modal
import { useUpdateMeetingMutation, UpdateMeetingData } from '../hooks/mutations/useUpdateMeetingMutation'; // Import Update mutation and type
import { useDeleteMeetingMutation } from '../hooks/mutations/useDeleteMeetingMutation'; // Import Delete mutation
import RescheduleMeetingModal from '../components/modals/RescheduleMeetingModal'; // Added Import
import ViewMeetingDetailsModal from '../components/modals/ViewMeetingDetailsModal'; // Import View Details modal
import { useLeadsQuery } from '../hooks/queries/useLeadsQuery'; // Import useLeadsQuery
import { useUsersQuery } from '../hooks/queries/useUsersQuery'; // Import useUsersQuery
import { toast } from 'react-hot-toast'; // Import toast

// Simple SVG Icons (can be replaced with an icon library)
const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5 text-gray-500 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5 text-gray-500 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const LeadIcon = () => ( // Using a generic document icon for Lead for now
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5 text-gray-500 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5 text-gray-500 inline" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clipRule="evenodd" />
    </svg>
);

// More specific icons for actions
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-.07.207-.141.414-.218.623M15 12a3 3 0 11-6 0 3 3 0 016 0z" /> 
  </svg>
);
const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);
const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const CalendarEditIcon = () => ( // For Reschedule
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2zm11-14H5.01M17 12h.01M17 16h.01M11 12h.01M11 16h.01M7 12h.01M7 16h.01M12 21.5c-1.234 0-2.42-.313-3.5-.905M12 2.5c1.234 0 2.42.313 3.5.905" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" transform="translate(2 2) scale(0.6)"/>
  </svg>
);
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
const FilterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6 Life
    .586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const MeetingsPage: React.FC = () => {
  const { data: meetings, isLoading: isLoadingMeetings, error: errorMeetings, refetch: refetchMeetings } = useMeetingsQuery({});
  const { data: leadsResponse, isLoading: isLoadingLeads } = useLeadsQuery({}); // Renamed to leadsResponse
  const { data: usersArray, isLoading: isLoadingUsers } = useUsersQuery({}); // Renamed to usersArray

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [selectedLead, setSelectedLead] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<Meeting['status'] | '' >('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('start_time_asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const meetingsPerPage = 9; // Display 9 meetings per page (fits 3x3 grid well)
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // State for Edit modal
  const [currentEditingMeeting, setCurrentEditingMeeting] = useState<Meeting | null>(null); // State for meeting being edited

  const createMeetingMutation = useCreateMeetingMutation();
  const updateMeetingMutation = useUpdateMeetingMutation();
  const deleteMeetingMutation = useDeleteMeetingMutation(); // Init delete mutation hook

  const agents = Array.isArray(usersArray) ? usersArray.filter(user => user.role === 'agent') : [];
  const leadsList = leadsResponse?.leads || []; // Access .leads property

  let processedMeetings = (meetings || []).filter(meeting => {
    const searchMatch = searchTerm === '' ||
      meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (meeting.leads?.clients?.client_name || meeting.leads?.client_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (meeting.users?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase());

    const agentMatch = selectedAgent === '' || meeting.agent_id === selectedAgent;
    const leadMatch = selectedLead === '' || meeting.lead_id === selectedLead;
    const statusMatch = selectedStatus === '' || meeting.status === selectedStatus;
    
    let dateMatch = true;
    if (dateFrom) {
        dateMatch = dateMatch && new Date(meeting.start_time) >= new Date(dateFrom);
    }
    if (dateTo) {
        const inclusiveDateTo = new Date(dateTo);
        inclusiveDateTo.setDate(inclusiveDateTo.getDate() + 1);
        dateMatch = dateMatch && new Date(meeting.start_time) < inclusiveDateTo;
    }

    return searchMatch && agentMatch && leadMatch && statusMatch && dateMatch;
  });

  // Sorting logic
  if (sortBy === 'start_time_asc') {
    processedMeetings.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  } else if (sortBy === 'start_time_desc') {
    processedMeetings.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
  } else if (sortBy === 'lead_name_asc') {
    processedMeetings.sort((a, b) => 
      (a.leads?.clients?.client_name || a.leads?.client_id || '').localeCompare(b.leads?.clients?.client_name || b.leads?.client_id || '')
    );
  } else if (sortBy === 'lead_name_desc') {
    processedMeetings.sort((a, b) => 
      (b.leads?.clients?.client_name || b.leads?.client_id || '').localeCompare(a.leads?.clients?.client_name || a.leads?.client_id || '')
    );
  } else if (sortBy === 'status_asc') {
    processedMeetings.sort((a, b) => (a.status || '').localeCompare(b.status || ''));
  } else if (sortBy === 'status_desc') {
    processedMeetings.sort((a, b) => (b.status || '').localeCompare(a.status || ''));
  }

  const getStatusColor = (status: Meeting['status']) => {
    switch (status) {
      case 'Scheduled': return 'bg-blue-100 text-blue-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
      refetchMeetings();
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
      refetchMeetings();
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
        refetchMeetings();
      } catch (err) {
        console.error("Error deleting meeting (from component):", err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during deletion.';
        toast.error(`Failed to delete meeting: ${errorMessage}`);
      }
    }
  };

  const handleCompleteMeeting = async (meetingId: string, meetingTitle: string) => {
    if (window.confirm(`Are you sure you want to mark the meeting "${meetingTitle}" as Completed?`)) {
      try {
        // Refetch meetings to ensure we have the latest data
        await refetchMeetings();
        const meetingToUpdate = meetings?.find(m => m.id === meetingId);
        
        if (!meetingToUpdate) {
          toast.error(`Meeting "${meetingTitle}" not found. It may have been deleted or modified.`);
          return;
        }

        await updateMeetingMutation.mutateAsync({
          id: meetingId,
          status: 'Completed',
          start_time: meetingToUpdate.start_time,
          end_time: meetingToUpdate.end_time,
          location: meetingToUpdate.location,
          notes: meetingToUpdate.notes,
          lead_id: meetingToUpdate.lead_id,
          agent_id: meetingToUpdate.agent_id,
        });
        refetchMeetings();
        toast.success('Meeting marked as completed!');
      } catch (err) {
        console.error("Error completing meeting:", err);
        const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
        if (errorMessage.includes('PGRST116')) {
          toast.error(`Failed to mark meeting as completed: Meeting "${meetingTitle}" not found in the database.`);
        } else {
          toast.error(`Failed to mark meeting as completed: ${errorMessage}`);
        }
      }
    }
  };

  // State for Reschedule Modal
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [currentReschedulingMeeting, setCurrentReschedulingMeeting] = useState<Meeting | null>(null);
  const [isViewDetailsModalOpen, setIsViewDetailsModalOpen] = useState(false); // State for View Details modal
  const [currentViewingMeeting, setCurrentViewingMeeting] = useState<Meeting | null>(null); // State for meeting being viewed

  const handleOpenRescheduleModal = (meeting: Meeting) => {
    setCurrentReschedulingMeeting(meeting);
    setIsRescheduleModalOpen(true);
  };

  const handleRescheduleMeetingSubmit = async (data: { id: string; start_time: string; end_time: string }) => {
    try {
      await refetchMeetings();
      const meetingToUpdate = meetings?.find(m => m.id === data.id);
      if (!meetingToUpdate) {
        toast.error('Meeting not found. It may have been deleted or modified.');
        return;
      }
      await updateMeetingMutation.mutateAsync({
        id: data.id,
        start_time: data.start_time,
        end_time: data.end_time,
        status: 'Scheduled',
        location: meetingToUpdate?.location,
        notes: meetingToUpdate?.notes,
        lead_id: meetingToUpdate?.lead_id,
        agent_id: meetingToUpdate?.agent_id,
      });
      setIsRescheduleModalOpen(false);
      setCurrentReschedulingMeeting(null);
      refetchMeetings();
      toast.success('Meeting rescheduled successfully!');
    } catch (err) {
      console.error("Error rescheduling meeting:", err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      toast.error(`Failed to reschedule meeting: ${errorMessage}`);
    }
  };

  const handleOpenViewDetailsModal = (meeting: Meeting) => {
    setCurrentViewingMeeting(meeting);
    setIsViewDetailsModalOpen(true);
  };

  // Pagination Logic
  const indexOfLastMeeting = currentPage * meetingsPerPage;
  const indexOfFirstMeeting = indexOfLastMeeting - meetingsPerPage;
  const currentMeetingsToDisplay = processedMeetings.slice(indexOfFirstMeeting, indexOfLastMeeting);
  const totalPages = Math.ceil(processedMeetings.length / meetingsPerPage);

  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
        setCurrentPage(pageNumber);
    }
  };
  
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Reset to page 1 if filters or sort order change, to avoid being on an empty page
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedAgent, selectedLead, selectedStatus, dateFrom, dateTo, sortBy]);

  const isLoading = isLoadingMeetings || isLoadingLeads || isLoadingUsers;

  if (isLoading) return <div className="p-4 text-center">Loading data...</div>;
  if (errorMeetings) return <div className="p-4 text-center text-red-500">Error fetching meetings: {errorMeetings.message}</div>;

  return (
    <div className="p-4 sm:p-6 bg-gray-100 min-h-screen flex flex-col">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end p-3 bg-white rounded-lg shadow mb-6">
              <div className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-1 flex items-center">
                  <FilterIcon /> 
                  <span className="text-sm font-medium text-gray-700 ml-1">Filters & Sort:</span>
              </div>
              <select 
                  value={selectedAgent} 
                  onChange={(e) => setSelectedAgent(e.target.value)} 
                  className="p-2 border border-gray-300 rounded-md text-sm w-full focus:ring-indigo-500 focus:border-indigo-500">
                  <option value="">All Agents</option>
                  {agents.map(agent => (
                      <option key={agent.id} value={agent.id}>{agent.full_name || agent.email}</option>
                  ))}
              </select>
              <select 
                  value={selectedLead} 
                  onChange={(e) => setSelectedLead(e.target.value)} 
                  className="p-2 border border-gray-300 rounded-md text-sm w-full focus:ring-indigo-500 focus:border-indigo-500">
                  <option value="">All Leads</option>
                  {leadsList.map(lead => (
                      <option key={lead.id} value={lead.id}>{lead.clients?.client_name || lead.id}</option>
                  ))}
              </select>
              <select 
                  value={selectedStatus} 
                  onChange={(e) => setSelectedStatus(e.target.value as Meeting['status'] | '')} 
                  className="p-2 border border-gray-300 rounded-md text-sm w-full focus:ring-indigo-500 focus:border-indigo-500">
                  <option value="">All Statuses</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Completed">Completed</option>
                  <option value="Pending">Pending</option>
                  <option value="Cancelled">Cancelled</option>
              </select>
              <div className="flex flex-col">
                  <label htmlFor="dateFrom" className="text-xs text-gray-600 mb-0.5">Date From:</label>
                  <input type="date" id="dateFrom" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="p-2 border border-gray-300 rounded-md text-sm w-full focus:ring-indigo-500 focus:border-indigo-500" /> 
              </div>
              <div className="flex flex-col">
                  <label htmlFor="dateTo" className="text-xs text-gray-600 mb-0.5">Date To:</label>
                  <input type="date" id="dateTo" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="p-2 border border-gray-300 rounded-md text-sm w-full focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div className="flex flex-col">
                  <label htmlFor="sortBy" className="text-xs text-gray-600 mb-0.5">Sort By:</label>
                  <select 
                      id="sortBy"
                      value={sortBy} 
                      onChange={(e) => setSortBy(e.target.value)} 
                      className="p-2 border border-gray-300 rounded-md text-sm w-full focus:ring-indigo-500 focus:border-indigo-500">
                      <option value="start_time_asc">Date (Oldest First)</option>
                      <option value="start_time_desc">Date (Newest First)</option>
                      <option value="lead_name_asc">Lead Name (A-Z)</option>
                      <option value="lead_name_desc">Lead Name (Z-A)</option>
                      <option value="status_asc">Status (A-Z)</option>
                      <option value="status_desc">Status (Z-A)</option>
                  </select>
              </div>
          </div>
        </div>

        {processedMeetings.length === 0 && !isLoading && (
          <div className="text-center text-gray-500 py-10">
            <p className="text-xl">No meetings found.</p>
            {meetings && meetings.length > 0 && <p>Try adjusting your search or filters.</p>}
            {(!meetings || meetings.length === 0) && <p>No meetings scheduled yet. Click "Create New Meeting" to add one.</p>}
          </div>
        )}

        {processedMeetings.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                {currentMeetingsToDisplay.map((meeting: Meeting) => (
                  <div key={meeting.id} className="bg-white shadow-lg rounded-xl p-5 border border-gray-200 hover:shadow-xl transition-shadow duration-300 ease-in-out flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <h2 className="text-xl font-semibold text-indigo-700 flex-grow truncate pr-2">{meeting.title}</h2>
                        {meeting.status && (
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(meeting.status)}`}>
                            {meeting.status}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2 text-sm text-gray-700">
                        <p className="flex items-center">
                          <LeadIcon />
                          <span className="font-medium text-gray-800 mr-1">Lead:</span> {meeting.leads?.clients?.client_name || meeting.leads?.contact_person || (meeting.lead_id ? `Lead ID ${meeting.lead_id.substring(0,8)}...` : 'N/A')}
                        </p>
                        <p className="flex items-center">
                          <UserIcon />
                          <span className="font-medium text-gray-800 mr-1">Agent:</span> {meeting.users?.full_name || 'N/A'}
                        </p>
                        <p className="flex items-center">
                          <CalendarIcon />
                          <span className="font-medium text-gray-800 mr-1">Date:</span> {new Date(meeting.start_time).toLocaleDateString()}
                        </p>
                        <p className="flex items-center">
                          <ClockIcon />
                          <span className="font-medium text-gray-800 mr-1">Time:</span>
                          {new Date(meeting.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })} - {new Date(meeting.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </p>
                        {meeting.location && (
                          <p>
                            <span className="font-medium text-gray-800">Location:</span> {meeting.location}
                          </p>
                        )}
                        {meeting.notes && (
                          <p className="mt-3 pt-3 border-t border-gray-200 text-gray-600">
                            <span className="font-medium text-gray-800 block mb-1">Notes:</span>
                            <span className="text-xs italic">{meeting.notes}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-2 justify-center">
                        <button 
                            onClick={() => handleOpenViewDetailsModal(meeting)}
                            className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md shadow-sm flex items-center transition-colors">
                            <EyeIcon /> View
                        </button>
                        <button 
                            onClick={() => handleOpenEditModal(meeting)}
                            className="text-xs px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md shadow-sm flex items-center transition-colors">
                            <PencilIcon /> Edit
                        </button>
                        <button 
                            onClick={() => handleCompleteMeeting(meeting.id, meeting.title)}
                            disabled={meeting.status === 'Completed' || meeting.status === 'Cancelled'}
                            className={`text-xs px-3 py-1.5 rounded-md shadow-sm flex items-center transition-colors 
                                        ${meeting.status === 'Completed' || meeting.status === 'Cancelled' 
                                          ? 'bg-gray-50 text-gray-400 cursor-not-allowed' 
                                          : 'bg-green-100 hover:bg-green-200 text-green-700'}`}>
                            <CheckCircleIcon /> Complete
                        </button>
                        <button 
                            onClick={() => handleOpenRescheduleModal(meeting)}
                            disabled={meeting.status === 'Completed' || meeting.status === 'Cancelled'}
                            className={`text-xs px-3 py-1.5 rounded-md shadow-sm flex items-center transition-colors 
                                        ${meeting.status === 'Completed' || meeting.status === 'Cancelled' 
                                          ? 'bg-gray-50 text-gray-400 cursor-not-allowed' 
                                          : 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700'}`}>
                            <CalendarEditIcon /> Reschedule
                        </button>
                        <button 
                            onClick={() => handleDeleteMeeting(meeting.id, meeting.title)}
                            className="text-xs px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-md shadow-sm flex items-center transition-colors">
                            <TrashIcon /> Delete
                        </button>
                    </div>
                  </div>
                ))}
            </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="py-6 flex justify-center items-center space-x-2 bg-white shadow-md rounded-b-lg mt-auto">
          <button 
            onClick={handlePrevPage} 
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          {[...Array(totalPages).keys()].map(number => {
            const pageNumber = number + 1;
            const showButton = pageNumber === 1 || pageNumber === totalPages || 
                               (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1) ||
                               (currentPage <= 3 && pageNumber <=3) || 
                               (currentPage >= totalPages - 2 && pageNumber >= totalPages -2);
            
            const showEllipsisBefore = currentPage > 3 && pageNumber === currentPage - 2 && pageNumber > 2;
            const showEllipsisAfter = currentPage < totalPages - 2 && pageNumber === currentPage + 2 && pageNumber < totalPages -1;

            if (showEllipsisBefore) {
                return <span key={`ellipsis-before-${pageNumber}`} className="px-4 py-2 text-sm text-gray-500">...</span>;
            }
            if (showButton) {
                return (
                    <button 
                        key={pageNumber} 
                        onClick={() => paginate(pageNumber)} 
                        className={`px-4 py-2 text-sm font-medium border rounded-md transition-colors 
                                    ${currentPage === pageNumber 
                                        ? 'bg-indigo-600 text-white border-indigo-600' 
                                        : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-100'}`}
                    >
                        {pageNumber}
                    </button>
                );
            }
            if (showEllipsisAfter) {
                 return <span key={`ellipsis-after-${pageNumber}`} className="px-4 py-2 text-sm text-gray-500">...</span>;
            }
            return null;
          })}
          <button 
            onClick={handleNextPage} 
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}

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