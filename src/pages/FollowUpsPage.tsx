// src/pages/FollowUpsPage.tsx
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom'; // Import useSearchParams
import { useFollowUpsQuery } from '../hooks/queries/useFollowUpsQuery';
import { FollowUp, Lead, UserProfile } from '../types'; // Assuming FollowUp type is exported
import { useLeadsQuery } from '../hooks/queries/useLeadsQuery'; // Import useLeadsQuery
import { useUsersQuery } from '../hooks/queries/useUsersQuery'; // Import useUsersQuery
import { toast } from 'react-hot-toast'; // Import toast
import { playNotificationSound } from '../utils/soundUtils'; // Import the sound utility

import CreateFollowUpModal, { NewFollowUpData } from '../components/modals/CreateFollowUpModal'; // Import the modal and type
import EditFollowUpModal, { UpdateFollowUpData } from '../components/modals/EditFollowUpModal'; // Import Edit modal and type
import RescheduleFollowUpModal from '../components/modals/RescheduleFollowUpModal'; // Import Reschedule modal
import ViewFollowUpDetailsModal from '../components/modals/ViewFollowUpDetailsModal'; // Ensure this import is present

import { useCreateFollowUpMutation } from '../hooks/mutations/useCreateFollowUpMutation'; // Import the mutation
import { useUpdateFollowUpMutation } from '../hooks/mutations/useUpdateFollowUpMutation'; // Import Update mutation
import { useDeleteFollowUpMutation } from '../hooks/mutations/useDeleteFollowUpMutation'; // Import Delete mutation


// --- SVG Icons (Copied from MeetingsPage.tsx, adjust if needed) ---
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
const LeadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5 text-gray-500 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);
// Action Icons
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
const CalendarEditIcon = () => (
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
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);
// --- End SVG Icons ---

const FollowUpsPage: React.FC = () => {
  const { data: followUpsData, isLoading: isLoadingFollowUps, error: errorFollowUps, refetch: refetchFollowUps } = useFollowUpsQuery({});
  const { data: leadsResponse, isLoading: isLoadingLeads } = useLeadsQuery({});
  const { data: usersArray, isLoading: isLoadingUsers } = useUsersQuery({});
  const [searchParams, setSearchParams] = useSearchParams(); // Initialize useSearchParams

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [selectedLead, setSelectedLead] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<FollowUp['status'] | ''>(
    () => (searchParams.get('status') as FollowUp['status']) || '' // Initialize from URL
  );
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('due_date_asc'); // Default sort
  const [currentPage, setCurrentPage] = useState<number>(1);
  const followUpsPerPage = 9;

  // Modal states (initially all false)
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentEditingFollowUp, setCurrentEditingFollowUp] = useState<FollowUp | null>(null);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [currentReschedulingFollowUp, setCurrentReschedulingFollowUp] = useState<FollowUp | null>(null);
  const [isViewDetailsModalOpen, setIsViewDetailsModalOpen] = useState(false);
  const [currentViewingFollowUp, setCurrentViewingFollowUp] = useState<FollowUp | null>(null);

  const createFollowUpMutation = useCreateFollowUpMutation(); // Initialize the mutation hook
  const updateFollowUpMutation = useUpdateFollowUpMutation(); // Initialize the update mutation hook
  const deleteFollowUpMutation = useDeleteFollowUpMutation(); // Initialize the delete mutation hook

  const agents = Array.isArray(usersArray) ? usersArray.filter(user => user.role === 'agent') : [];
  const leadsList = leadsResponse?.leads || [];

  // Filtering and Sorting Logic (Simplified placeholders for now)
  let processedFollowUps = (followUpsData || []).filter(followUp => {
    const searchMatch = searchTerm === '' ||
      (followUp.leads?.clients?.client_name || followUp.leads?.client_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (followUp.users?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (followUp.notes || '').toLowerCase().includes(searchTerm.toLowerCase());

    const agentMatch = selectedAgent === '' || followUp.agent_id === selectedAgent;
    const leadMatch = selectedLead === '' || followUp.lead_id === selectedLead;
    const statusMatch = selectedStatus === '' || followUp.status === selectedStatus;
    
    let dateMatch = true;
    if (dateFrom) {
        dateMatch = dateMatch && new Date(followUp.due_date) >= new Date(dateFrom);
    }
    if (dateTo) {
        const inclusiveDateTo = new Date(dateTo);
        inclusiveDateTo.setDate(inclusiveDateTo.getDate() + 1);
        dateMatch = dateMatch && new Date(followUp.due_date) < inclusiveDateTo;
    }
    return searchMatch && agentMatch && leadMatch && statusMatch && dateMatch;
  });

  // Sorting logic placeholder
  if (sortBy === 'due_date_asc') {
    processedFollowUps.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  } else if (sortBy === 'due_date_desc') {
    processedFollowUps.sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime());
  } else if (sortBy === 'lead_name_asc') {
    processedFollowUps.sort((a, b) => 
      (a.leads?.clients?.client_name || a.leads?.client_id || '').localeCompare(b.leads?.clients?.client_name || b.leads?.client_id || '')
    );
  } else if (sortBy === 'lead_name_desc') {
    processedFollowUps.sort((a, b) => 
      (b.leads?.clients?.client_name || b.leads?.client_id || '').localeCompare(a.leads?.clients?.client_name || a.leads?.client_id || '')
    );
  } else if (sortBy === 'status_asc') {
    processedFollowUps.sort((a, b) => (a.status || '').localeCompare(b.status || ''));
  } else if (sortBy === 'status_desc') {
    processedFollowUps.sort((a, b) => (b.status || '').localeCompare(a.status || ''));
  }

  const getStatusColor = (status: FollowUp['status']) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Rescheduled': return 'bg-blue-100 text-blue-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // --- Placeholder Handlers ---
  const handleCreateFollowUpSubmit = async (formData: NewFollowUpData) => { 
    try {
      await createFollowUpMutation.mutateAsync(formData);
      setCreateModalOpen(false);
      refetchFollowUps(); // refetchFollowUps is available from useFollowUpsQuery
    } catch (err) { 
      console.error("Error creating follow-up from page:", err); 
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      toast.error(`Failed to create follow-up: ${errorMessage}`);
    }
  };

  const handleOpenEditModal = (followUp: FollowUp) => {
    setCurrentEditingFollowUp(followUp);
    setIsEditModalOpen(true);
    // toast('Edit functionality to be implemented.'); // Remove placeholder toast
  };

  const handleUpdateFollowUpSubmit = async (data: UpdateFollowUpData) => { 
    try {
      await updateFollowUpMutation.mutateAsync(data);
      setIsEditModalOpen(false);
      setCurrentEditingFollowUp(null);
      refetchFollowUps();
      // toast.success('Follow-up updated successfully!'); // Already handled by mutation hook
    } catch (err) {
      console.error("Error updating follow-up from page:", err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      toast.error(`Failed to update follow-up: ${errorMessage}`);
    }
  };

  const handleDeleteFollowUp = async (id: string, leadInfo: string) => {
    if (window.confirm(`Are you sure you want to delete the follow-up for "${leadInfo}"? This action cannot be undone.`)) {
      try {
        await deleteFollowUpMutation.mutateAsync(id);
        refetchFollowUps();
        // toast.success('Follow-up deleted successfully!'); // Already handled by mutation hook
      } catch (err) {
        console.error("Error deleting follow-up from page:", err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        toast.error(`Failed to delete follow-up: ${errorMessage}`);
      }
    }
  };

  const handleCompleteFollowUp = async (id: string, leadInfo: string) => {
    const followUpToComplete = processedFollowUps.find(f => f.id === id);
    if (!followUpToComplete) {
      toast.error("Could not find the follow-up to complete.");
      playNotificationSound('error');
      return;
    }
    if (followUpToComplete.status === 'Completed' || followUpToComplete.status === 'Cancelled') {
      toast(`Follow-up for "${leadInfo}" is already ${followUpToComplete.status.toLowerCase()}.`, { icon: 'ℹ️' });
      playNotificationSound('info');
      return;
    }

    if (window.confirm(`Are you sure you want to mark the follow-up for "${leadInfo}" as Completed?`)) {
      try {
        await updateFollowUpMutation.mutateAsync({ id, status: 'Completed' });
        refetchFollowUps();
        // toast.success('Follow-up marked as completed!'); // Toast is handled by mutation hook, but we can play sound here
        playNotificationSound('success');
      } catch (err) {
        console.error("Error completing follow-up from page:", err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        toast.error(`Failed to mark follow-up as completed: ${errorMessage}`);
        playNotificationSound('error');
      }
    }
  };
  
  const handleOpenRescheduleModal = (followUp: FollowUp) => {
    const followUpToReschedule = processedFollowUps.find(f => f.id === followUp.id);
    if (!followUpToReschedule) {
      toast.error("Could not find the follow-up to reschedule.");
      return;
    }
    if (followUpToReschedule.status === 'Completed' || followUpToReschedule.status === 'Cancelled') {
      toast(`Follow-up for "${followUpToReschedule.leads?.clients?.client_name || followUpToReschedule.leads?.client_id || 'N/A'}" is already ${followUpToReschedule.status.toLowerCase()} and cannot be rescheduled.`);
      return;
    }
    setCurrentReschedulingFollowUp(followUp);
    setIsRescheduleModalOpen(true);
  };
  
  const handleRescheduleFollowUpSubmit = async (data: { id: string; due_date: string }) => {
    try {
      await updateFollowUpMutation.mutateAsync({
        id: data.id,
        due_date: data.due_date,
        status: 'Rescheduled',
      });
      setIsRescheduleModalOpen(false);
      setCurrentReschedulingFollowUp(null);
      refetchFollowUps();
    } catch (err) {
      console.error("Error rescheduling follow-up from page:", err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      toast.error(`Failed to reschedule follow-up: ${errorMessage}`);
    }
  };

  const handleOpenViewDetailsModal = (followUp: FollowUp) => {
    setCurrentViewingFollowUp(followUp);
    setIsViewDetailsModalOpen(true);
  };

  // Pagination Logic
  const indexOfLastFollowUp = currentPage * followUpsPerPage;
  const indexOfFirstFollowUp = indexOfLastFollowUp - followUpsPerPage;
  const currentFollowUpsToDisplay = processedFollowUps.slice(indexOfFirstFollowUp, indexOfLastFollowUp);
  const totalPages = Math.ceil(processedFollowUps.length / followUpsPerPage);

  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
        setCurrentPage(pageNumber);
    }
  };
  const handlePrevPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };
  const handleNextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedAgent, selectedLead, selectedStatus, dateFrom, dateTo, sortBy]);

  useEffect(() => {
    const statusFromQuery = searchParams.get('status') as FollowUp['status'] | null;
    if (statusFromQuery && ['Pending', 'Completed', 'Rescheduled', 'Cancelled'].includes(statusFromQuery)) {
      if (selectedStatus !== statusFromQuery) {
        setSelectedStatus(statusFromQuery);
      }
    } else if (!statusFromQuery && selectedStatus !== '') {
      // Optional: If the query param is removed or invalid, clear the filter
      // setSelectedStatus(''); 
    }
  }, [searchParams, selectedStatus]);

  // When a filter changes, update the URL (optional, but good for shareable links)
  useEffect(() => {
    const newParams = new URLSearchParams();
    if (selectedStatus) newParams.set('status', selectedStatus);
    // Add other filters to params if desired (selectedAgent, selectedLead, etc.)
    // if (selectedAgent) newParams.set('agent', selectedAgent);
    // if (selectedLead) newParams.set('lead', selectedLead);
    // if (dateFrom) newParams.set('dateFrom', dateFrom);
    // if (dateTo) newParams.set('dateTo', dateTo);
    // if (searchTerm) newParams.set('search', searchTerm);

    // Update URL only if params actually change to avoid unnecessary re-renders/history entries
    if (newParams.toString() !== searchParams.toString()) {
        setSearchParams(newParams, { replace: true }); // Use replace to avoid too many history entries
    }
  }, [selectedStatus, setSearchParams]); // Add other state dependencies if they should update URL

  const isLoading = isLoadingFollowUps || isLoadingLeads || isLoadingUsers;

  if (isLoading) return <div className="p-4 text-center">Loading data...</div>;
  if (errorFollowUps) return <div className="p-4 text-center text-red-500">Error fetching follow-ups: {errorFollowUps.message}</div>;

  return (
    <div className="p-4 sm:p-6 bg-gray-100 min-h-screen flex flex-col">
      <div className="flex-grow">
        {/* Header: Title, Search, Create Button */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 md:mb-0">Follow-Up Management</h1>
            <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3 w-full md:w-auto">
              <input
                type="text"
                placeholder="Search follow-ups..."
                className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-auto"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                onClick={() => setCreateModalOpen(true)} // Remove toast.info, just open modal
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition duration-150 w-full sm:w-auto whitespace-nowrap"
              >
                + Create New Follow-Up
              </button>
            </div>
          </div>

          {/* Filter & Sort Section */}
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
                onChange={(e) => setSelectedStatus(e.target.value as FollowUp['status'] | '')} 
                className="p-2 border border-gray-300 rounded-md text-sm w-full focus:ring-indigo-500 focus:border-indigo-500">
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Rescheduled">Rescheduled</option>
                <option value="Cancelled">Cancelled</option>
            </select>
            <div className="flex flex-col">
                <label htmlFor="dateFrom" className="text-xs text-gray-600 mb-0.5">Due From:</label>
                <input type="date" id="dateFrom" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="p-2 border border-gray-300 rounded-md text-sm w-full focus:ring-indigo-500 focus:border-indigo-500" /> 
            </div>
            <div className="flex flex-col">
                <label htmlFor="dateTo" className="text-xs text-gray-600 mb-0.5">Due To:</label>
                <input type="date" id="dateTo" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="p-2 border border-gray-300 rounded-md text-sm w-full focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div className="flex flex-col">
                <label htmlFor="sortBy" className="text-xs text-gray-600 mb-0.5">Sort By:</label>
                <select 
                    id="sortBy"
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)} 
                    className="p-2 border border-gray-300 rounded-md text-sm w-full focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="due_date_asc">Due Date (Oldest First)</option>
                    <option value="due_date_desc">Due Date (Newest First)</option>
                    <option value="lead_name_asc">Lead Name (A-Z)</option>
                    <option value="lead_name_desc">Lead Name (Z-A)</option>
                    <option value="status_asc">Status (A-Z)</option>
                    <option value="status_desc">Status (Z-A)</option>
                </select>
            </div>
          </div>
        </div>

        {/* Follow-Ups Grid / List */}
        {processedFollowUps.length === 0 && !isLoading && (
          <div className="text-center text-gray-500 py-10">
            <p className="text-xl">No follow-ups found.</p>
            {followUpsData && followUpsData.length > 0 && <p>Try adjusting your search or filters.</p>}
            {(!followUpsData || followUpsData.length === 0) && <p>No follow-ups scheduled yet. Click "Create New Follow-Up" to add one.</p>}
          </div>
        )}

        {processedFollowUps.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {currentFollowUpsToDisplay.map((followUp: FollowUp) => (
              <div key={followUp.id} className="bg-white shadow-lg rounded-xl p-5 border border-gray-200 hover:shadow-xl transition-shadow duration-300 ease-in-out flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <h2 className="text-lg font-semibold text-indigo-700 flex items-center flex-grow truncate pr-2">
                      <LeadIcon /> 
                      <span className="ml-1.5">Follow-up for {followUp.leads?.clients?.client_name || followUp.leads?.contact_person || (followUp.lead_id ? `Lead ID ${followUp.lead_id.substring(0,8)}...` : 'N/A')}
                    </span>
            </h2>
                    {followUp.status && (
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(followUp.status)}`}>
                        {followUp.status}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p className="flex items-center">
                      <UserIcon />
                      <span className="font-medium text-gray-800 mr-1">Agent:</span> {followUp.users?.full_name || 'N/A'}
                    </p>
                    <p className="flex items-center">
                      <CalendarIcon />
                      <span className="font-medium text-gray-800 mr-1">Due Date:</span> {new Date(followUp.due_date).toLocaleDateString()}
                    </p>
                    {followUp.notes && (
                      <p className="mt-3 pt-3 border-t border-gray-200 text-gray-600">
                        <span className="font-medium text-gray-800 block mb-1">Notes:</span>
                        <span className="text-xs italic">{followUp.notes}</span>
                      </p>
                    )}
                  </div>
                </div>
                {/* Action Buttons Section Placeholder */}
                <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-2 justify-center">
                    <button 
                        onClick={() => handleOpenViewDetailsModal(followUp)}
                        className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md shadow-sm flex items-center transition-colors">
                        <EyeIcon /> View
                    </button>
                    <button 
                        onClick={() => handleOpenEditModal(followUp)}
                        className="text-xs px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md shadow-sm flex items-center transition-colors">
                        <PencilIcon /> Edit
                    </button>
                    <button 
                        onClick={() => handleCompleteFollowUp(followUp.id, followUp.leads?.clients?.client_name || followUp.leads?.client_id || 'N/A')}
                        disabled={followUp.status === 'Completed' || followUp.status === 'Cancelled'}
                        className={`text-xs px-3 py-1.5 rounded-md shadow-sm flex items-center transition-colors 
                                    ${followUp.status === 'Completed' || followUp.status === 'Cancelled' 
                                      ? 'bg-gray-50 text-gray-400 cursor-not-allowed' 
                                      : 'bg-green-100 hover:bg-green-200 text-green-700'}`}>
                        <CheckCircleIcon /> Complete
                    </button>
                    <button 
                        onClick={() => handleOpenRescheduleModal(followUp)}
                        disabled={followUp.status === 'Completed' || followUp.status === 'Cancelled'}
                        className={`text-xs px-3 py-1.5 rounded-md shadow-sm flex items-center transition-colors 
                                    ${followUp.status === 'Completed' || followUp.status === 'Cancelled' 
                                      ? 'bg-gray-50 text-gray-400 cursor-not-allowed' 
                                      : 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700'}`}>
                        <CalendarEditIcon /> Reschedule
                    </button>
                    <button 
                        onClick={() => handleDeleteFollowUp(followUp.id, followUp.leads?.clients?.client_name || followUp.leads?.client_id || 'N/A')}
                        className="text-xs px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-md shadow-sm flex items-center transition-colors">
                        <TrashIcon /> Delete
                    </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
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

            if (showEllipsisBefore) return <span key={`ellipsis-before-${pageNumber}`} className="px-4 py-2 text-sm text-gray-500">...</span>;
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
            if (showEllipsisAfter) return <span key={`ellipsis-after-${pageNumber}`} className="px-4 py-2 text-sm text-gray-500">...</span>;
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
      
      {isCreateModalOpen && (
        <CreateFollowUpModal
          isOpen={isCreateModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSubmit={handleCreateFollowUpSubmit}
          leads={leadsList}
          agents={agents}
          isLoadingLeads={isLoadingLeads}
          isLoadingAgents={isLoadingUsers}
        />
      )}

      {currentEditingFollowUp && isEditModalOpen && (
        <EditFollowUpModal
          isOpen={isEditModalOpen}
          onClose={() => { 
            setIsEditModalOpen(false); 
            setCurrentEditingFollowUp(null); 
          }}
          onSubmit={handleUpdateFollowUpSubmit}
          followUpToEdit={currentEditingFollowUp}
          leads={leadsList}
          agents={agents}
          isLoadingLeads={isLoadingLeads}
          isLoadingAgents={isLoadingUsers}
        />
      )}

      {currentReschedulingFollowUp && isRescheduleModalOpen && (
        <RescheduleFollowUpModal
          isOpen={isRescheduleModalOpen}
          onClose={() => {
            setIsRescheduleModalOpen(false);
            setCurrentReschedulingFollowUp(null);
          }}
          onSubmit={handleRescheduleFollowUpSubmit}
          followUpToReschedule={currentReschedulingFollowUp}
        />
      )}

      {currentViewingFollowUp && isViewDetailsModalOpen && (
        <ViewFollowUpDetailsModal
          isOpen={isViewDetailsModalOpen}
          onClose={() => {
            setIsViewDetailsModalOpen(false);
            setCurrentViewingFollowUp(null);
          }}
          followUp={currentViewingFollowUp}
        />
      )}
    </div>
  );
};

export default FollowUpsPage; 