// src/pages/LeadsPage.tsx
import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { LeadTable } from '../components/leads/LeadTable';
import { LeadDrawer } from '../components/leads/LeadDrawer';
import { FollowUpModal } from '../components/leads/FollowUpModal';
import { MeetingModal } from '../components/leads/MeetingModal';
import { AddLeadModal } from '../components/leads/AddLeadModal';
import { ImportLeadsModal } from '../components/leads/ImportLeadsModal';
import { Lead } from '../types';
import Breadcrumb from '../components/common/Breadcrumb';
import { Button } from '../components/ui/button';
import { PlusCircleIcon, UploadCloudIcon } from 'lucide-react';

const LeadsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [selectedLeadForFollowUp, setSelectedLeadForFollowUp] = useState<Lead | null>(null);
  const [selectedLeadsForBulkFollowUp, setSelectedLeadsForBulkFollowUp] = useState<Lead[]>([]);

  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [selectedLeadForMeeting, setSelectedLeadForMeeting] = useState<Lead | null>(null);
  const [selectedLeadsForBulkMeeting, setSelectedLeadsForBulkMeeting] = useState<Lead[]>([]);

  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [isImportLeadsModalOpen, setIsImportLeadsModalOpen] = useState(false);

  const refetchLeads = () => {
    console.log("LeadsPage: refetchLeads() called. Invalidating 'leads' query.");
    queryClient.invalidateQueries({ queryKey: ['leads'] });
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
      return; // Should not happen if called correctly
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

  const breadcrumbItems = [
    { name: 'Admin', href: '/' },
    { name: 'Leads', href: '/leads', current: true }
  ];

  return (
    <section className="max-w-7xl mx-auto px-6 py-8">
      <Breadcrumb items={breadcrumbItems}/>
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold leading-9 tracking-tight text-gray-900">Leads Management</h1>
          <div className="after:block after:h-0.5 after:w-16 after:rounded-full after:bg-indigo-500 mt-1"></div>
        </div>
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
            <UploadCloudIcon className="h-5 w-5 mr-2" />
            Import Leads
          </Button>
        </div>
      </div>
      
      <div className="relative overflow-hidden rounded-xl bg-white shadow ring-1 ring-gray-200">
        <LeadTable 
          onRowClick={handleViewLeadDetails}
          onScheduleFollowUp={(lead) => openFollowUpModal(lead)}
          onScheduleMeeting={(lead) => openMeetingModal(lead)}
          onBulkScheduleFollowUps={handleBulkScheduleFollowUps}
          onBulkScheduleMeetings={handleBulkScheduleMeetings}
        />
      </div>

      <LeadDrawer 
        lead={selectedLead}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
      />
      
      {(isFollowUpModalOpen) && (
        <FollowUpModal
          isOpen={isFollowUpModalOpen}
          onClose={closeFollowUpModal}
          lead={selectedLeadForFollowUp}
          bulkLeads={selectedLeadsForBulkFollowUp}
        />
      )}
      {(isMeetingModalOpen) && (
        <MeetingModal
          isOpen={isMeetingModalOpen}
          onClose={closeMeetingModal}
          lead={selectedLeadForMeeting}
          bulkLeads={selectedLeadsForBulkMeeting}
        />
      )}

      {isAddLeadModalOpen && (
        <AddLeadModal
          isOpen={isAddLeadModalOpen}
          onClose={handleCloseAddLeadModal}
          onLeadAdded={refetchLeads}
        />
      )}

      {isImportLeadsModalOpen && (
        <ImportLeadsModal
          isOpen={isImportLeadsModalOpen}
          onClose={handleCloseImportLeadsModal}
        />
      )}
    </section>
  );
};

export default LeadsPage; 