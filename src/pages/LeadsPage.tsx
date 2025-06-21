// src/pages/LeadsPage.tsx - Updated with Stats Dashboard
import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { LeadTable } from '../components/leads/LeadTable';
import { LeadDrawer } from '../components/leads/LeadDrawer';
import { FollowUpModal } from '../components/leads/FollowUpModal';
import { MeetingModal } from '../components/leads/MeetingModal';
import { AddLeadModal } from '../components/leads/AddLeadModal';
import { ImportLeadsModal } from '../components/leads/ImportLeadsModal';
import { PipelineManagement } from '../components/leads/PipelineManagement';
import { LeadsStats } from '../components/leads/LeadsStats'; // Import the new stats component
import { Lead } from '../types';
import Breadcrumb from '../components/common/Breadcrumb';
import { Button } from '../components/ui/button';

// Import from Heroicons (matching your existing codebase pattern)
import { 
  PlusCircleIcon, 
  ArrowUpTrayIcon as UploadIcon,
  TableCellsIcon,
  ChartBarIcon,
  Squares2X2Icon,
  ChartPieIcon // Add this for stats icon
} from '@heroicons/react/24/outline';

type ViewMode = 'table' | 'pipeline' | 'kanban' | 'stats'; // Add 'stats' to the type

const LeadsPage: React.FC = () => {
  const queryClient = useQueryClient();

  // View Management
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // Lead Selection & Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Follow-up Modal Management
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [selectedLeadForFollowUp, setSelectedLeadForFollowUp] = useState<Lead | null>(null);
  const [selectedLeadsForBulkFollowUp, setSelectedLeadsForBulkFollowUp] = useState<Lead[]>([]);

  // Meeting Modal Management
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [selectedLeadForMeeting, setSelectedLeadForMeeting] = useState<Lead | null>(null);
  const [selectedLeadsForBulkMeeting, setSelectedLeadsForBulkMeeting] = useState<Lead[]>([]);

  // Add/Import Lead Modals
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [isImportLeadsModalOpen, setIsImportLeadsModalOpen] = useState(false);

  const refetchLeads = () => {
    console.log("LeadsPage: refetchLeads() called. Invalidating 'leads' query.");
    queryClient.invalidateQueries({ queryKey: ['leads'] });
    queryClient.invalidateQueries({ queryKey: ['pipeline-leads'] });
    queryClient.invalidateQueries({ queryKey: ['lead-activities'] });
  };

  const handleViewLeadDetails = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedLead(null);
  };

  const openFollowUpModal = (lead: Lead | null, leads?: Lead[]) => {
    if (leads && leads.length > 0) {
      setSelectedLeadsForBulkFollowUp(leads);
      setSelectedLeadForFollowUp(null);
    } else if (lead) {
      setSelectedLeadsForBulkFollowUp([]);
      setSelectedLeadForFollowUp(lead);
    } else {
      return;
    }
    setIsFollowUpModalOpen(true);
  };

  const closeFollowUpModal = () => {
    setIsFollowUpModalOpen(false);
    setSelectedLeadForFollowUp(null);
    setSelectedLeadsForBulkFollowUp([]);
  };

  const openMeetingModal = (lead: Lead | null, leads?: Lead[]) => {
    if (leads && leads.length > 0) {
      setSelectedLeadsForBulkMeeting(leads);
      setSelectedLeadForMeeting(null);
    } else if (lead) {
      setSelectedLeadsForBulkMeeting([]);
      setSelectedLeadForMeeting(lead);
    } else {
      return;
    }
    setIsMeetingModalOpen(true);
  };

  const closeMeetingModal = () => {
    setIsMeetingModalOpen(false);
    setSelectedLeadForMeeting(null);
    setSelectedLeadsForBulkMeeting([]);
  };

  const handleBulkScheduleFollowUps = (leads: Lead[]) => {
    console.log('Bulk schedule follow-ups for:', leads);
    openFollowUpModal(null, leads);
  };

  const handleBulkScheduleMeetings = (leads: Lead[]) => {
    console.log('Bulk schedule meetings for:', leads);
    openMeetingModal(null, leads);
  };

  const handleOpenAddLeadModal = () => {
    setIsAddLeadModalOpen(true);
  };

  const handleCloseAddLeadModal = () => {
    setIsAddLeadModalOpen(false);
  };

  const handleOpenImportLeadsModal = () => {
    setIsImportLeadsModalOpen(true);
  };

  const handleCloseImportLeadsModal = () => {
    setIsImportLeadsModalOpen(false);
  };

  const handleImportSuccess = () => {
    refetchLeads();
  };

  // Updated view mode buttons configuration with Stats Dashboard
  const viewModes = [
    {
      key: 'table' as ViewMode,
      label: 'Table View',
      icon: <TableCellsIcon className="h-4 w-4" />,
      description: 'Detailed table with filters'
    },
    {
      key: 'pipeline' as ViewMode,
      label: 'Pipeline View',
      icon: <ChartBarIcon className="h-4 w-4" />,
      description: 'Drag & drop sales pipeline'
    },
    {
      key: 'kanban' as ViewMode,
      label: 'Kanban View',
      icon: <Squares2X2Icon className="h-4 w-4" />,
      description: 'Visual kanban board'
    },
    {
      key: 'stats' as ViewMode,
      label: 'Stats Dashboard',
      icon: <ChartPieIcon className="h-4 w-4" />,
      description: 'Lead statistics and analytics'
    }
  ];

  const breadcrumbItems = [
    { name: 'Admin', href: '/' },
    { name: 'Leads', href: '/leads', current: true }
  ];

  const renderCurrentView = () => {
    switch (viewMode) {
      case 'pipeline':
        return (
          <div className="w-full">
            <PipelineManagement onLeadClick={handleViewLeadDetails} />
          </div>
        );
      case 'kanban':
        // You can implement a different kanban view or reuse pipeline
        return (
          <div className="w-full">
            <PipelineManagement onLeadClick={handleViewLeadDetails} />
          </div>
        );
      case 'stats':
        return (
          <div className="w-full">
            <LeadsStats />
          </div>
        );
      default:
        return (
          <div className="w-full">
            <LeadTable 
              onRowClick={handleViewLeadDetails}
              onScheduleFollowUp={(lead) => openFollowUpModal(lead)}
              onScheduleMeeting={(lead) => openMeetingModal(lead)}
              onBulkScheduleFollowUps={handleBulkScheduleFollowUps}
              onBulkScheduleMeetings={handleBulkScheduleMeetings}
            />
          </div>
        );
    }
  };

  // Dynamic page title based on view mode
  const getPageTitle = () => {
    switch (viewMode) {
      case 'pipeline':
        return 'Pipeline Management';
      case 'kanban':
        return 'Kanban Board';
      case 'stats':
        return 'Lead Statistics Dashboard';
      default:
        return 'Leads Management';
    }
  };

  // Conditional rendering of action buttons (hide Add/Import when in stats view)
  const shouldShowActionButtons = viewMode !== 'stats';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content Area - No max-width constraint */}
      <div className="w-full">
        {/* Header Section */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <Breadcrumb items={breadcrumbItems}/>
            
            <div className="flex justify-between items-center mt-4">
              <div>
                <h1 className="text-3xl font-bold leading-9 tracking-tight text-gray-900">
                  {getPageTitle()}
                </h1>
                <div className="after:block after:h-0.5 after:w-16 after:rounded-full after:bg-indigo-500 mt-1"></div>
              </div>
              
              {/* Conditionally show action buttons */}
              {shouldShowActionButtons && (
                <div className="flex space-x-3">
                  <Button 
                    onClick={handleOpenAddLeadModal}
                    className="bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800"
                    aria-label="Add new lead"
                  >
                    <PlusCircleIcon className="h-5 w-5 mr-2" />
                    Add Lead
                  </Button>
                  <Button 
                    onClick={handleOpenImportLeadsModal}
                    className="bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800"
                    aria-label="Import leads from file"
                  >
                    <UploadIcon className="h-5 w-5 mr-2" />
                    Import Leads
                  </Button>
                </div>
              )}
            </div>

            {/* Enhanced View Mode Selector */}
            <div className="mt-6">
              <div className="bg-gray-100 rounded-lg border border-gray-200 p-1 inline-flex">
                {viewModes.map((mode) => (
                  <button
                    key={mode.key}
                    onClick={() => setViewMode(mode.key)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      viewMode === mode.key
                        ? 'bg-indigo-600 text-white shadow-sm transform scale-105'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    title={mode.description}
                  >
                    {mode.icon}
                    <span>{mode.label}</span>
                    {/* Active indicator */}
                    {viewMode === mode.key && (
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>
              
              {/* View description */}
              <p className="text-sm text-gray-600 mt-2">
                {viewModes.find(mode => mode.key === viewMode)?.description}
              </p>
            </div>
          </div>
        </div>

        {/* Content Area - Full Width */}
        <div className="w-full">
          {/* Current View Content - No container restrictions */}
          <div className={viewMode === 'stats' ? 'bg-gray-50' : 'bg-white'}>
            {renderCurrentView()}
          </div>
        </div>
      </div>

      {/* Enhanced Lead Drawer with CRM Features - Higher z-index */}
      <LeadDrawer 
        lead={selectedLead}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
      />
      
      {/* Follow-up Modal */}
      {(isFollowUpModalOpen) && (
        <FollowUpModal
          isOpen={isFollowUpModalOpen}
          onClose={closeFollowUpModal}
          lead={selectedLeadForFollowUp}
          bulkLeads={selectedLeadsForBulkFollowUp}
        />
      )}

      {/* Meeting Modal */}
      {(isMeetingModalOpen) && (
        <MeetingModal
          isOpen={isMeetingModalOpen}
          onClose={closeMeetingModal}
          lead={selectedLeadForMeeting}
          bulkLeads={selectedLeadsForBulkMeeting}
        />
      )}

      {/* Add Lead Modal */}
      {isAddLeadModalOpen && (
        <AddLeadModal
          isOpen={isAddLeadModalOpen}
          onClose={handleCloseAddLeadModal}
          onLeadAdded={refetchLeads}
        />
      )}

      {/* Import Leads Modal */}
      {isImportLeadsModalOpen && (
        <ImportLeadsModal
          isOpen={isImportLeadsModalOpen}
          onClose={handleCloseImportLeadsModal}
          onImportSuccess={handleImportSuccess}
        />
      )}
    </div>
  );
};

export default LeadsPage;