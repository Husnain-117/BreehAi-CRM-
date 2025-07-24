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

// --- Modern SVG Icons ---
const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const LeadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const FilterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
  </svg>
);

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
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
  const [filtersExpanded, setFiltersExpanded] = useState<boolean>(false);
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
  const deleteFollowUpMutation = useDeleteFollowUpMutation();

  // Prepare data - fix duplicate declarations
  const followUps: FollowUp[] = followUpsData || [];
  const leadsList: Lead[] = leadsResponse?.leads || [];
  const agents: UserProfile[] = usersArray || [];

  const handleCreateFollowUpSubmit = async (newFollowUpData: NewFollowUpData) => {
    try {
      await createFollowUpMutation.mutateAsync(newFollowUpData);
      setCreateModalOpen(false);
      playNotificationSound('success');
      toast.success('Follow-up created successfully!');
      refetchFollowUps();
    } catch (error: any) {
      console.error('Error creating follow-up:', error);
      toast.error(`Failed to create follow-up: ${error.message || 'Unknown error'}`);
    }
  };

  const handleUpdateFollowUpSubmit = async (updateData: UpdateFollowUpData) => {
    if (!currentEditingFollowUp) return;
    
    try {
      // Destructure id from updateData and use the currentEditingFollowUp's id instead
      const { id, ...dataWithoutId } = updateData;
      await updateFollowUpMutation.mutateAsync({ 
        ...dataWithoutId,
        id: currentEditingFollowUp.id
      });
      setIsEditModalOpen(false);
      setCurrentEditingFollowUp(null);
      playNotificationSound('success');
      toast.success('Follow-up updated successfully!');
      refetchFollowUps();
    } catch (error: any) {
      console.error('Error updating follow-up:', error);
      toast.error(`Failed to update follow-up: ${error.message || 'Unknown error'}`);
    }
  };

  const handleRescheduleFollowUpSubmit = async (data: { id: string; due_date: string }) => {
    try {
      await updateFollowUpMutation.mutateAsync({ 
        id: data.id, 
        due_date: data.due_date, 
        status: 'Rescheduled' as FollowUp['status'] 
      });
      setIsRescheduleModalOpen(false);
      setCurrentReschedulingFollowUp(null);
      playNotificationSound('success');
      toast.success('Follow-up rescheduled successfully!');
      refetchFollowUps();
    } catch (error: any) {
      console.error('Error rescheduling follow-up:', error);
      toast.error(`Failed to reschedule follow-up: ${error.message || 'Unknown error'}`);
    }
  };

  const handleCompleteFollowUp = async (id: string, leadName?: string) => {
    try {
      await updateFollowUpMutation.mutateAsync({ id, status: 'Completed' as FollowUp['status'] });
      playNotificationSound('success');
      toast.success(`Follow-up for ${leadName || 'lead'} marked as completed!`);
      refetchFollowUps();
    } catch (error: any) {
      console.error('Error completing follow-up:', error);
      toast.error(`Failed to complete follow-up: ${error.message || 'Unknown error'}`);
    }
  };

  const handleDeleteFollowUp = async (id: string, leadName?: string) => {
    if (window.confirm(`Are you sure you want to delete this follow-up${leadName ? ` for ${leadName}` : ''}?`)) {
      try {
        await deleteFollowUpMutation.mutateAsync(id);
        playNotificationSound('success');
        toast.success(`Follow-up${leadName ? ` for ${leadName}` : ''} deleted successfully!`);
        refetchFollowUps();
      } catch (error: any) {
        console.error('Error deleting follow-up:', error);
        toast.error(`Failed to delete follow-up: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleOpenEditModal = (followUp: FollowUp) => {
    setCurrentEditingFollowUp(followUp);
    setIsEditModalOpen(true);
  };

  const handleOpenRescheduleModal = (followUp: FollowUp) => {
    setCurrentReschedulingFollowUp(followUp);
    setIsRescheduleModalOpen(true);
  };

  const handleOpenViewDetailsModal = (followUp: FollowUp) => {
    setCurrentViewingFollowUp(followUp);
    setIsViewDetailsModalOpen(true);
  };

  // Update URL params when status filter changes
  useEffect(() => {
    if (selectedStatus) {
      setSearchParams({ status: selectedStatus });
    } else {
      setSearchParams({});
    }
  }, [selectedStatus, setSearchParams]);

  // Handle loading state
  const isLoading = isLoadingFollowUps || isLoadingLeads || isLoadingUsers;

  // Filtering logic
  const filteredFollowUps = followUps.filter((followUp: FollowUp) => {
    const matchesSearch = !searchTerm || 
      followUp.leads?.clients?.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      followUp.leads?.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      followUp.notes?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAgent = !selectedAgent || followUp.agent_id === selectedAgent;
    const matchesLead = !selectedLead || followUp.lead_id === selectedLead;
    const matchesStatus = !selectedStatus || followUp.status === selectedStatus;

    const matchesDateFrom = !dateFrom || new Date(followUp.due_date) >= new Date(dateFrom);
    const matchesDateTo = !dateTo || new Date(followUp.due_date) <= new Date(dateTo);

    return matchesSearch && matchesAgent && matchesLead && matchesStatus && matchesDateFrom && matchesDateTo;
  });

  // Sorting logic
  const processedFollowUps = [...filteredFollowUps].sort((a, b) => {
    switch (sortBy) {
      case 'due_date_asc':
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      case 'due_date_desc':
        return new Date(b.due_date).getTime() - new Date(a.due_date).getTime();
      case 'lead_name_asc':
        return (a.leads?.clients?.client_name || '').localeCompare(b.leads?.clients?.client_name || '');
      case 'lead_name_desc':
        return (b.leads?.clients?.client_name || '').localeCompare(a.leads?.clients?.client_name || '');
      case 'status_asc':
        return (a.status || '').localeCompare(b.status || '');
      case 'status_desc':
        return (b.status || '').localeCompare(a.status || '');
      default:
        return 0;
    }
  });

  // Pagination logic
  const totalFollowUps = processedFollowUps.length;
  const totalPages = Math.ceil(totalFollowUps / followUpsPerPage);
  const startIndex = (currentPage - 1) * followUpsPerPage;
  const endIndex = startIndex + followUpsPerPage;
  const currentFollowUpsToDisplay = processedFollowUps.slice(startIndex, endIndex);

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

  // Status badge color helper
  const getStatusColor = (status: FollowUp['status']) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'Completed':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'Rescheduled':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  // Priority helper
  const getPriorityIndicator = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { color: 'bg-red-500', label: 'Overdue', textColor: 'text-red-600' };
    } else if (diffDays === 0) {
      return { color: 'bg-orange-500', label: 'Due Today', textColor: 'text-orange-600' };
    } else if (diffDays <= 3) {
      return { color: 'bg-yellow-500', label: 'Due Soon', textColor: 'text-yellow-600' };
    } else {
      return { color: 'bg-green-500', label: 'Upcoming', textColor: 'text-green-600' };
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedAgent('');
    setSelectedLead('');
    setSelectedStatus('');
    setDateFrom('');
    setDateTo('');
    setSortBy('due_date_asc');
    setCurrentPage(1);
  };

  // Count active filters
  const activeFiltersCount = [searchTerm, selectedAgent, selectedLead, selectedStatus, dateFrom, dateTo].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Follow-Up Management
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage and track your sales follow-ups efficiently
              </p>
              {totalFollowUps > 0 && (
                <div className="mt-2 flex items-center text-sm text-gray-600">
                  <span className="font-medium">{totalFollowUps}</span>
                  <span className="ml-1">follow-ups found</span>
                  {activeFiltersCount > 0 && (
                    <span className="ml-2 text-indigo-600">
                      ({activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} active)
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="mt-4 lg:mt-0 lg:ml-6">
              <button
                onClick={() => setCreateModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
              >
                <PlusIcon />
                Create Follow-Up
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Search Bar */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon />
              </div>
              <input
                type="text"
                placeholder="Search follow-ups by lead name, contact person, or notes..."
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setFiltersExpanded(!filtersExpanded)}
                className="flex items-center text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors duration-200"
              >
                <FilterIcon />
                <span className="ml-2">Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    {activeFiltersCount}
                  </span>
                )}
                <svg
                  className={`ml-2 h-4 w-4 transform transition-transform duration-200 ${filtersExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-gray-500 hover:text-red-600 transition-colors duration-200"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>

          {/* Expanded Filters */}
          {filtersExpanded && (
            <div className="p-4 bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* Agent Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Agent
                  </label>
                  <select
                    value={selectedAgent}
                    onChange={(e) => setSelectedAgent(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">All Agents</option>
                    {agents.map(agent => (
                      <option key={agent.id} value={agent.id}>
                        {agent.full_name || agent.email}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Lead Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lead
                  </label>
                  <select
                    value={selectedLead}
                    onChange={(e) => setSelectedLead(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">All Leads</option>
                    {leadsList.map(lead => (
                      <option key={lead.id} value={lead.id}>
                        {lead.clients?.client_name || lead.id}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as FollowUp['status'] | '')}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                    <option value="Rescheduled">Rescheduled</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="due_date_asc">Due Date (Earliest First)</option>
                    <option value="due_date_desc">Due Date (Latest First)</option>
                    <option value="lead_name_asc">Lead Name (A-Z)</option>
                    <option value="lead_name_desc">Lead Name (Z-A)</option>
                    <option value="status_asc">Status (A-Z)</option>
                    <option value="status_desc">Status (Z-A)</option>
                  </select>
                </div>

                {/* Date From */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due From
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* Date To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due To
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-sm text-gray-600">Loading follow-ups...</p>
            </div>
          </div>
        ) : processedFollowUps.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No follow-ups found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {followUpsData && followUpsData.length > 0 
                ? 'Try adjusting your search or filters.' 
                : 'Get started by creating your first follow-up.'}
            </p>
            {(!followUpsData || followUpsData.length === 0) && (
              <div className="mt-6">
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <PlusIcon />
                  Create your first follow-up
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Follow-ups Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {currentFollowUpsToDisplay.map((followUp: FollowUp) => {
                const priority = getPriorityIndicator(followUp.due_date);
                return (
                  <div
                    key={followUp.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 overflow-hidden"
                  >
                    {/* Card Header */}
                    <div className="p-4 pb-3">
                      {/* Priority Indicator & Status */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full ${priority.color} mr-2`}></div>
                          <span className={`text-xs font-medium ${priority.textColor}`}>
                            {priority.label}
                          </span>
                        </div>
                        {followUp.status && (
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(followUp.status)}`}>
                            {followUp.status}
                          </span>
                        )}
                      </div>

                      {/* Lead Name */}
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                        <LeadIcon />
                        <span className="ml-2 truncate">
                          {followUp.leads?.clients?.client_name || 
                           followUp.leads?.contact_person || 
                           `Lead ${followUp.lead_id?.substring(0,8)}...` || 
                           'Unknown Lead'}
                        </span>
                      </h3>

                      {/* Details */}
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <UserIcon />
                          <span className="ml-2 font-medium">Agent:</span>
                          <span className="ml-1 truncate">
                            {followUp.users?.full_name || 'Unassigned'}
                          </span>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <CalendarIcon />
                          <span className="ml-2 font-medium">Due:</span>
                          <span className="ml-1">
                            {new Date(followUp.due_date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Notes Preview */}
                      {followUp.notes && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-sm text-gray-600 line-clamp-2">
                            <span className="font-medium">Notes:</span> {followUp.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleOpenViewDetailsModal(followUp)}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                        >
                          <EyeIcon />
                          View
                        </button>

                        <button
                          onClick={() => handleOpenEditModal(followUp)}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                        >
                          <PencilIcon />
                          Edit
                        </button>

                        {followUp.status !== 'Completed' && followUp.status !== 'Cancelled' && (
                          <>
                            <button
                              onClick={() => handleCompleteFollowUp(followUp.id, followUp.leads?.clients?.client_name || followUp.leads?.client_id || 'N/A')}
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                            >
                              <CheckCircleIcon />
                              Complete
                            </button>

                            <button
                              onClick={() => handleOpenRescheduleModal(followUp)}
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-md hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors duration-200"
                            >
                              <ClockIcon />
                              Reschedule
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => handleDeleteFollowUp(followUp.id, followUp.leads?.clients?.client_name || followUp.leads?.client_id || 'N/A')}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                        >
                          <TrashIcon />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    Previous
                  </button>

                  <div className="flex items-center space-x-1">
                    {[...Array(totalPages).keys()].map(number => {
                      const pageNumber = number + 1;
                      const isCurrentPage = pageNumber === currentPage;
                      const showPage = pageNumber === 1 || pageNumber === totalPages || 
                                     (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1);

                      if (!showPage) {
                        if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                          return <span key={pageNumber} className="px-2 text-gray-500">...</span>;
                        }
                        return null;
                      }

                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                            isCurrentPage
                              ? 'bg-indigo-600 text-white border border-indigo-600'
                              : 'text-gray-600 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
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