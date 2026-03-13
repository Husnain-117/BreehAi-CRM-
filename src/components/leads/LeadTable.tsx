// src/components/leads/LeadTable.tsx - Complete Updated Version with Working Pagination
import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
  PaginationState,
  RowSelectionState,
} from '@tanstack/react-table';
import { useLeadsQuery, useUsersQuery } from '@/hooks/queries';
import { Lead } from '@/types';
import { 
  ChevronUpIcon, 
  ChevronDownIcon, 
  ChevronUpDownIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  CalendarDaysIcon, 
  BellAlertIcon, 
  TrashIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  EllipsisHorizontalIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserIcon,
  BuildingOfficeIcon,
  TagIcon,
  CurrencyDollarIcon,
  StarIcon
} from '@heroicons/react/20/solid';
import Fuse from 'fuse.js';
import { Button } from '@/components/ui/button';
import { useUpdateLeadAgentMutation } from '@/hooks/mutations/useUpdateLeadAgentMutation';
import { useBulkDeleteLeadsMutation } from '@/hooks/mutations/useBulkDeleteLeadsMutation';
import toast from 'react-hot-toast';
import { getColumns } from './LeadTableColumns';

interface LeadTableProps {
  onRowClick: (lead: Lead) => void;
  onScheduleFollowUp: (lead: Lead) => void;
  onScheduleMeeting: (lead: Lead) => void;
  onBulkScheduleFollowUps?: (selectedLeads: Lead[]) => void;
  onBulkScheduleMeetings?: (selectedLeads: Lead[]) => void;
  onBulkDelete?: (selectedLeads: Lead[]) => void;
}

// Premium Action Menu Component - PORTAL VERSION (Guaranteed to work)
const PremiumActionsMenu: React.FC<{ 
  lead: Lead; 
  onViewDetails: () => void;
  onScheduleFollowUp: () => void;
  onScheduleMeeting: () => void;
}> = ({ lead, onViewDetails, onScheduleFollowUp, onScheduleMeeting }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [buttonPosition, setButtonPosition] = useState<{x: number, y: number}>({x: 0, y: 0});
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setButtonPosition({
        x: rect.right - 256, // 256px = w-64 width of menu
        y: rect.bottom + 4
      });
    }
    
    setIsOpen(!isOpen);
  };

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => {
      if (isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('scroll', handleScroll, true);
      return () => {
        document.removeEventListener('click', handleClickOutside);
        document.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [isOpen]);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleButtonClick}
        className="p-2 rounded-lg hover:bg-muted transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-opacity-50"
        aria-label="Lead actions"
      >
        <EllipsisHorizontalIcon className="h-5 w-5 text-muted-foreground" />
      </button>

      {isOpen && (
        <>
          {/* Render directly to document.body to escape any overflow constraints */}
          {createPortal(
            <>
              {/* Full screen backdrop */}
              <div 
                className="fixed inset-0 z-[9998]"
                onClick={() => setIsOpen(false)}
                style={{ backgroundColor: 'transparent' }}
              />
              
              {/* Menu positioned absolutely */}
              <div 
                className="fixed z-[9999] w-64 bg-popover text-popover-foreground rounded-xl shadow-2xl border border-border py-2"
                style={{
                  left: `${buttonPosition.x}px`,
                  top: `${buttonPosition.y}px`,
                  maxHeight: '400px',
                  overflowY: 'auto'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Lead Info Header */}
                <div className="px-4 py-3 border-b border-border">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {lead.clients?.client_name?.charAt(0)?.toUpperCase() || 'L'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {lead.clients?.client_name || 'Unknown Client'}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {lead.clients?.company || 'No Company'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="px-2 py-2">
                  <button
                    onClick={() => handleAction(onViewDetails)}
                    className="w-full flex items-center px-3 py-2 text-sm text-foreground hover:bg-primary/10 hover:text-primary rounded-lg transition-colors duration-150"
                  >
                    <UserIcon className="h-4 w-4 mr-3 text-muted-foreground" />
                    View Full Details
                  </button>
                  
                  <button
                    onClick={() => handleAction(onScheduleFollowUp)}
                    className="w-full flex items-center px-3 py-2 text-sm text-foreground hover:bg-green-500/10 hover:text-green-600 rounded-lg transition-colors duration-150"
                  >
                    <BellAlertIcon className="h-4 w-4 mr-3 text-muted-foreground" />
                    Schedule Follow-up
                  </button>
                  
                  <button
                    onClick={() => handleAction(onScheduleMeeting)}
                    className="w-full flex items-center px-3 py-2 text-sm text-foreground hover:bg-blue-500/10 hover:text-blue-600 rounded-lg transition-colors duration-150"
                  >
                    <CalendarDaysIcon className="h-4 w-4 mr-3 text-muted-foreground" />
                    Schedule Meeting
                  </button>

                  {/* Quick Contact */}
                  <div className="border-t border-border mt-2 pt-2">
                    <div className="flex space-x-1">
                      {lead.phone && (
                        <a
                          href={`tel:${lead.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 flex items-center justify-center px-2 py-2 text-xs text-muted-foreground hover:bg-green-500/10 hover:text-green-600 rounded-lg transition-colors duration-150"
                          title="Call"
                        >
                          <PhoneIcon className="h-4 w-4" />
                        </a>
                      )}
                      {lead.email && (
                        <a
                          href={`mailto:${lead.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 flex items-center justify-center px-2 py-2 text-xs text-muted-foreground hover:bg-blue-500/10 hover:text-blue-600 rounded-lg transition-colors duration-150"
                          title="Email"
                        >
                          <EnvelopeIcon className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>,
            document.body
          )}
        </>
      )}
    </>
  );
};

// Premium Lead Row Component
const PremiumLeadRow: React.FC<{
  lead: Lead;
  onRowClick: (lead: Lead) => void;
  onScheduleFollowUp: (lead: Lead) => void;
  onScheduleMeeting: (lead: Lead) => void;
  isSelected: boolean;
  onToggleSelect: () => void;
}> = ({ lead, onRowClick, onScheduleFollowUp, onScheduleMeeting, isSelected, onToggleSelect }) => {
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'P1': return 'bg-red-100 text-red-800 border-red-200';
      case 'P2': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'P3': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getIndustryColor = (industry: string) => {
    const colorMap: Record<string, string> = {
      'technology': 'bg-blue-100 text-blue-800',
      'healthcare': 'bg-green-100 text-green-800',
      'finance': 'bg-yellow-100 text-yellow-800',
      'retail': 'bg-purple-100 text-purple-800',
      'manufacturing': 'bg-gray-100 text-gray-800',
      'education': 'bg-indigo-100 text-indigo-800',
      'real-estate': 'bg-orange-100 text-orange-800',
      'consulting': 'bg-teal-100 text-teal-800',
      'media': 'bg-pink-100 text-pink-800',
      'transportation': 'bg-cyan-100 text-cyan-800',
      'energy': 'bg-emerald-100 text-emerald-800',
      'agriculture': 'bg-lime-100 text-lime-800',
      'construction': 'bg-amber-100 text-amber-800',
      'hospitality': 'bg-rose-100 text-rose-800',
      'legal': 'bg-violet-100 text-violet-800',
      'nonprofit': 'bg-slate-100 text-slate-800',
      'government': 'bg-stone-100 text-stone-800',
    };
    return colorMap[industry] || 'bg-slate-100 text-slate-800';
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <tr 
      className={`group hover:bg-muted/50 transition-all duration-200 cursor-pointer border-b border-border ${
        isSelected ? 'bg-primary/5 border-primary/20' : ''
      }`}
      onClick={() => onRowClick(lead)}
    >
      {/* Selection */}
      <td className="px-6 py-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 text-primary border-input rounded focus:ring-ring bg-background"
        />
      </td>

      {/* Client Info */}
      <td className="px-6 py-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">
              {lead.clients?.client_name?.charAt(0)?.toUpperCase() || 'L'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <p className="font-semibold text-foreground truncate">
                {lead.clients?.client_name || 'Unknown Client'}
              </p>
              {lead.lead_score && lead.lead_score > 50 && (
                <StarIcon className="h-4 w-4 text-yellow-500" />
              )}
            </div>
            <div className="flex items-center space-x-4 mt-1">
              <div className="flex items-center text-sm text-muted-foreground">
                <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                {lead.clients?.company || 'No Company'}
              </div>
              {lead.industry && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getIndustryColor(lead.industry)}`}>
                  {lead.industry.charAt(0).toUpperCase() + lead.industry.slice(1)}
                </span>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* Contact Info */}
      <td className="px-6 py-4">
        <div className="space-y-1">
          <div className="flex items-center text-sm text-foreground">
            <UserIcon className="h-4 w-4 mr-2 text-muted-foreground" />
            {lead.contact_person || 'No Contact'}
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <EnvelopeIcon className="h-4 w-4 mr-2 text-muted-foreground" />
            {lead.email ? (
              <a href={`mailto:${lead.email}`} className="hover:text-primary" onClick={(e) => e.stopPropagation()}>
                {lead.email}
              </a>
            ) : 'No Email'}
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <PhoneIcon className="h-4 w-4 mr-2 text-muted-foreground" />
            {lead.phone ? (
              <a href={`tel:${lead.phone}`} className="hover:text-primary" onClick={(e) => e.stopPropagation()}>
                {lead.phone}
              </a>
            ) : 'No Phone'}
          </div>
        </div>
      </td>

      {/* Status & Priority */}
      <td className="px-6 py-4">
        <div className="space-y-2">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(lead.status_bucket)}`}>
            {lead.status_bucket}
          </span>
          {lead.qualification_status && (
            <div className="text-xs text-muted-foreground capitalize">
              {lead.qualification_status.replace('_', ' ')}
            </div>
          )}
        </div>
      </td>

      {/* Deal Value & Score */}
      <td className="px-6 py-4 text-right">
        <div className="space-y-1">
          <div className="flex items-center justify-end text-lg font-bold text-foreground">
            <CurrencyDollarIcon className="h-4 w-4 mr-1 text-muted-foreground" />
            {formatCurrency(lead.deal_value)}
          </div>
          {lead.lead_score !== undefined && (
            <div className="text-xs text-muted-foreground">
              Score: {lead.lead_score}
            </div>
          )}
        </div>
      </td>

      {/* Assigned Agent */}
      <td className="px-6 py-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <span className="text-xs font-medium text-muted-foreground">
              {lead.users?.full_name?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
          <span className="text-sm text-foreground">
            {lead.users?.full_name || 'Unassigned'}
          </span>
        </div>
      </td>

      {/* Tags */}
      <td className="px-6 py-4">
        <div className="flex flex-wrap gap-1">
          {lead.tags && lead.tags.length > 0 ? (
            lead.tags.slice(0, 2).map((tag, index) => {
              const hue = (tag.charCodeAt(0) || 65) % 360;
              return (
                <span 
                  key={index}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ 
                    backgroundColor: `hsl(${hue}, 70%, 85%)`, 
                    color: `hsl(${hue}, 70%, 25%)` 
                  }}
                >
                  <TagIcon className="h-3 w-3 mr-1" />
                  {tag}
                </span>
              );
            })
          ) : (
            <span className="text-xs text-gray-400">No tags</span>
          )}
          {lead.tags && lead.tags.length > 2 && (
            <span className="text-xs text-gray-400">+{lead.tags.length - 2} more</span>
          )}
        </div>
      </td>

      {/* Actions */}
      <td className="px-6 py-4 relative">
        <PremiumActionsMenu
          lead={lead}
          onViewDetails={() => onRowClick(lead)}
          onScheduleFollowUp={() => onScheduleFollowUp(lead)}
          onScheduleMeeting={() => onScheduleMeeting(lead)}
        />
      </td>
    </tr>
  );
};

// Premium Bulk Actions Bar
const PremiumBulkActionsBar: React.FC<{
  selectedCount: number;
  onClearSelection: () => void;
  onBulkScheduleFollowUps: () => void;
  onBulkScheduleMeetings: () => void;
  onBulkDelete: () => void;
}> = ({ selectedCount, onClearSelection, onBulkScheduleFollowUps, onBulkScheduleMeetings, onBulkDelete }) => {
  return (
    <div className="sticky top-0 z-10 bg-gradient-to-r from-primary to-secondary shadow-xl rounded-lg mx-6 mt-4 mb-4">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">{selectedCount}</span>
            </div>
            <span className="text-white font-medium">
              {selectedCount} lead{selectedCount > 1 ? 's' : ''} selected
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            onClick={onBulkScheduleFollowUps}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-white border-opacity-30"
            size="sm"
          >
            <BellAlertIcon className="h-4 w-4 mr-2" />
            Follow-ups
          </Button>
          
          <Button
            onClick={onBulkScheduleMeetings}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-white border-opacity-30"
            size="sm"
          >
            <CalendarDaysIcon className="h-4 w-4 mr-2" />
            Meetings
          </Button>
          
          <Button
            onClick={onBulkDelete}
            className="bg-red-500 hover:bg-red-600 text-white"
            size="sm"
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            Delete
          </Button>
          
          <Button
            onClick={onClearSelection}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-white border-opacity-30"
            size="sm"
          >
            <XMarkIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export const LeadTable: React.FC<LeadTableProps> = ({ 
  onRowClick, 
  onScheduleFollowUp, 
  onScheduleMeeting,
  onBulkScheduleFollowUps,
  onBulkScheduleMeetings,
  onBulkDelete
}) => {
  const { data: leadsResponse, isLoading: isLoadingLeads, error: leadsError } = useLeadsQuery({});
  const allLeads = useMemo(() => leadsResponse?.leads || [], [leadsResponse]);

  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [leadsToDelete, setLeadsToDelete] = useState<Lead[]>([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const bulkDeleteMutation = useBulkDeleteLeadsMutation();

  const fuzzySearch = useMemo(() => {
    if (!allLeads.length) return () => [];
    const fuse = new Fuse(allLeads, {
      keys: ['clients.client_name', 'clients.company', 'contact_person', 'email', 'phone', 'industry', 'tags'],
      threshold: 0.3,
    });
    return (query: string) => query ? fuse.search(query).map(result => result.item) : allLeads;
  }, [allLeads]);

  const filteredData = useMemo(() => {
    return globalFilter ? fuzzySearch(globalFilter) : allLeads;
  }, [allLeads, globalFilter, fuzzySearch]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = currentPage * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredData.length);
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Update row selection to work with paginated data
  const selectedLeads = Object.keys(rowSelection)
    .filter(key => rowSelection[key])
    .map(key => {
      const globalIndex = parseInt(key);
      return filteredData[globalIndex];
    })
    .filter(Boolean);
  
  const selectedCount = selectedLeads.length;

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(0);
  }, [globalFilter]);

  // Reset selection when changing pages
  useEffect(() => {
    setRowSelection({});
  }, [currentPage]);

  const handleBulkDelete = async () => {
    if (selectedLeads.length === 0) {
      toast.error('No leads selected for deletion');
      return;
    }
    setLeadsToDelete(selectedLeads);
    setShowDeleteConfirm(true);
  };

  const confirmBulkDelete = async () => {
    try {
      const leadIds = leadsToDelete.map(lead => lead.id);
      await bulkDeleteMutation.mutateAsync(leadIds);
      
      toast.success(`Successfully deleted ${leadsToDelete.length} leads`);
      setRowSelection({});
      setShowDeleteConfirm(false);
      setLeadsToDelete([]);
    } catch (error) {
      console.error('Bulk delete failed:', error);
    }
  };

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };

  const canGoPrevious = currentPage > 0;
  const canGoNext = currentPage < totalPages - 1;

  if (isLoadingLeads) {
    return (
      <div className="flex items-center justify-center h-96 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <span className="text-lg font-medium text-muted-foreground">Loading your leads...</span>
        </div>
      </div>
    );
  }

  if (leadsError) {
    return (
      <div className="p-8 text-center text-red-600 bg-red-50 border border-red-200">
        <ExclamationTriangleIcon className="h-12 w-12 mx-auto mb-4 text-red-500" />
        <h3 className="text-lg font-semibold mb-2">Error Loading Leads</h3>
        <p>{leadsError.message}</p>
      </div>
    );
  }

  if (!allLeads.length) {
    return (
      <div className="p-12 text-center bg-gradient-to-br from-background to-muted">
        <UserIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-xl font-semibold text-foreground mb-2">No leads found</h3>
        <p className="text-muted-foreground">Get started by adding your first lead or importing leads from a file.</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-card">
      {/* Premium Search Bar */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex justify-between items-center">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <input
              type="text"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search leads by name, company, email, or any field..."
              className="block w-full pl-10 pr-4 py-3 text-sm border border-input rounded-lg shadow-sm focus:border-ring focus:ring-ring focus:ring-1 transition-all duration-200 bg-background text-foreground"
            />
            {globalFilter && (
              <button
                onClick={() => setGlobalFilter('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <XMarkIcon className="h-5 w-5 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
          
          {/* Page size selector */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(0);
              }}
              className="border border-input bg-background text-foreground rounded-md px-3 py-1 text-sm focus:border-ring focus:ring-ring"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedCount > 0 && onBulkScheduleFollowUps && onBulkScheduleMeetings && (
        <PremiumBulkActionsBar
          selectedCount={selectedCount}
          onClearSelection={() => setRowSelection({})}
          onBulkScheduleFollowUps={() => onBulkScheduleFollowUps(selectedLeads)}
          onBulkScheduleMeetings={() => onBulkScheduleMeetings(selectedLeads)}
          onBulkDelete={handleBulkDelete}
        />
      )}

      {/* Premium Table - Full Width */}
      <div className="w-full overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={paginatedData.length > 0 && paginatedData.every((_, index) => {
                    const globalIndex = startIndex + index;
                    return rowSelection[globalIndex];
                  })}
                  onChange={(e) => {
                    if (e.target.checked) {
                      const newSelection = { ...rowSelection };
                      paginatedData.forEach((_, index) => {
                        const globalIndex = startIndex + index;
                        newSelection[globalIndex] = true;
                      });
                      setRowSelection(newSelection);
                    } else {
                      const newSelection = { ...rowSelection };
                      paginatedData.forEach((_, index) => {
                        const globalIndex = startIndex + index;
                        delete newSelection[globalIndex];
                      });
                      setRowSelection(newSelection);
                    }
                  }}
                  className="h-4 w-4 text-primary border-input bg-background rounded focus:ring-ring"
                />
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Client Information
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Contact Details
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Deal Value
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Assigned Agent
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Tags
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {paginatedData.map((lead, index) => {
              const globalIndex = startIndex + index;
              return (
                <PremiumLeadRow
                  key={lead.id}
                  lead={lead}
                  onRowClick={onRowClick}
                  onScheduleFollowUp={onScheduleFollowUp}
                  onScheduleMeeting={onScheduleMeeting}
                  isSelected={!!rowSelection[globalIndex]}
                  onToggleSelect={() => {
                    setRowSelection(prev => ({
                      ...prev,
                      [globalIndex]: !prev[globalIndex]
                    }));
                  }}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Enhanced Pagination */}
      <div className="px-6 py-4 border-t border-border bg-muted">
        <div className="flex items-center justify-between">
          <div className="text-sm text-foreground">
            Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
            <span className="font-medium">{endIndex}</span> of{' '}
            <span className="font-medium">{filteredData.length}</span> results
            {globalFilter && (
              <span className="text-muted-foreground">
                {' '}(filtered from {allLeads.length} total leads)
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePreviousPage}
              disabled={!canGoPrevious}
              className="flex items-center"
            >
              <ChevronLeftIcon className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            {/* Page numbers */}
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i;
                } else if (currentPage < 3) {
                  pageNum = i;
                } else if (currentPage > totalPages - 4) {
                  pageNum = totalPages - 5 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 text-sm rounded-md ${
                      currentPage === pageNum
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleNextPage}
              disabled={!canGoNext}
              className="flex items-center"
            >
              Next
              <ChevronRightIcon className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
        
        {/* Additional pagination info */}
        {totalPages > 1 && (
          <div className="mt-3 text-xs text-gray-500 text-center">
            Page {currentPage + 1} of {totalPages}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Confirm Deletion</h3>
            </div>
            
            <p className="text-gray-600 mb-8">
              Are you sure you want to delete <strong>{leadsToDelete.length}</strong> selected lead{leadsToDelete.length > 1 ? 's' : ''}? 
              This will also remove all related activities and cannot be undone.
            </p>
            
            <div className="flex justify-end space-x-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setLeadsToDelete([]);
                }}
                disabled={bulkDeleteMutation.isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmBulkDelete}
                disabled={bulkDeleteMutation.isLoading}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {bulkDeleteMutation.isLoading ? 'Deleting...' : 'Delete All'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};