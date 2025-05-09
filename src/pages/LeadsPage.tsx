// src/pages/LeadsPage.tsx
import React, { useState } from 'react';
import { LeadTable } from '../components/leads/LeadTable';
import { LeadDrawer } from '../components/leads/LeadDrawer';
import { FollowUpModal } from '../components/leads/FollowUpModal';
import { MeetingModal } from '../components/leads/MeetingModal';
import { Lead } from '../types';
import Breadcrumb from '../components/common/Breadcrumb';

const LeadsPage: React.FC = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [selectedLeadForFollowUp, setSelectedLeadForFollowUp] = useState<Lead | null>(null);
  const [selectedLeadsForBulkFollowUp, setSelectedLeadsForBulkFollowUp] = useState<Lead[]>([]);

  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [selectedLeadForMeeting, setSelectedLeadForMeeting] = useState<Lead | null>(null);
  const [selectedLeadsForBulkMeeting, setSelectedLeadsForBulkMeeting] = useState<Lead[]>([]);

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

  const breadcrumbItems = [
    { name: 'Admin', href: '/' },
    { name: 'Leads', href: '/leads', current: true }
  ];

  return (
    <section className="mx-auto w-full max-w-none px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={breadcrumbItems}/>
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold leading-9 tracking-tight text-gray-900">Leads Management</h1>
        <div className="after:block after:h-0.5 after:w-16 after:rounded-full after:bg-indigo-500 mt-1"></div>
      </div>
      
      <div className="relative overflow-hidden rounded-xl bg-white shadow ring-1 ring-gray-200 lg:max-w-7xl lg:mx-auto">
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
    </section>
  );
};

export default LeadsPage; 