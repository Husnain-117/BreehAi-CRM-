// src/components/leads/PipelineManagement.tsx - Scalable Version for Large Datasets
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { supabase } from '../../lib/supabaseClient';
import { Lead, PipelineStage } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useUsersQuery } from '../../hooks/queries/useUsersQuery';
import { 
  CurrencyDollarIcon,
  CalendarDaysIcon,
  UserIcon,
  TagIcon,
  ChartBarIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/20/solid';
import { Button } from '../ui/button';
import toast from 'react-hot-toast';

interface PipelineColumn {
  stage: PipelineStage;
  leads: Lead[];
  totalValue: number;
  count: number;
  filteredLeads: Lead[];
  filteredCount: number;
}

interface PipelineManagementProps {
  onLeadClick?: (lead: Lead) => void;
}

// Default pipeline stages if none exist
const DEFAULT_STAGES: PipelineStage[] = [
  {
    id: 'new-lead',
    name: 'New Lead',
    description: 'Newly acquired leads',
    order_position: 1,
    probability: 5,
    color_code: '#ef4444',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'qualified',
    name: 'Qualified',
    description: 'Qualified prospects',
    order_position: 2,
    probability: 15,
    color_code: '#f97316',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'contact-made',
    name: 'Contact Made',
    description: 'Initial contact established',
    order_position: 3,
    probability: 25,
    color_code: '#eab308',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'needs-analysis',
    name: 'Needs Analysis',
    description: 'Understanding client needs',
    order_position: 4,
    probability: 50,
    color_code: '#3b82f6',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'proposal',
    name: 'Proposal',
    description: 'Proposal submitted',
    order_position: 5,
    probability: 75,
    color_code: '#8b5cf6',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'closed-won',
    name: 'Closed Won',
    description: 'Successfully closed deals',
    order_position: 6,
    probability: 100,
    color_code: '#10b981',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const PipelineManagement: React.FC<PipelineManagementProps> = ({ onLeadClick }) => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  // Check if user is super admin
  const isSuperAdmin = profile?.role === 'super_admin';
  
  // State for filtering and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [selectedManager, setSelectedManager] = useState<string>(''); // New manager filter
  const [minDealValue, setMinDealValue] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<Record<string, number>>({});
  const [leadsPerPage] = useState(10); // Reduced from showing all leads
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Fetch users data for filters
  const { data: allUsers = [] } = useUsersQuery({});
  const { data: managers = [] } = useUsersQuery({ role: 'manager' });
  const { data: agents = [] } = useUsersQuery({ role: 'agent' });

  // Fetch pipeline stages with fallback to defaults
  const { data: stages = DEFAULT_STAGES, isLoading: stagesLoading } = useQuery({
    queryKey: ['pipeline-stages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pipeline_stages')
        .select('*')
        .eq('is_active', true)
        .order('order_position');
      
      if (error) {
        console.warn('Pipeline stages table not found, using defaults:', error);
        return DEFAULT_STAGES;
      }
      
      return data && data.length > 0 ? data as PipelineStage[] : DEFAULT_STAGES;
    }
  });

  // Fetch ALL leads, not just those with pipeline stages
  const { data: leadsData = [], isLoading: leadsLoading } = useQuery({
    queryKey: ['pipeline-leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          clients (*),
          users (*),
          pipeline_stages (*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Lead[];
    }
  });

  // Move lead to different stage
  const moveLeadMutation = useMutation({
    mutationFn: async ({ leadId, stageId, newProbability }: { leadId: string; stageId: string; newProbability: number }) => {
      const { error } = await supabase
        .from('leads')
        .update({ 
          pipeline_stage_id: stageId,
          win_probability: newProbability
        })
        .eq('id', leadId);
      
      if (error) throw error;

      // Log the pipeline change as an activity if table exists
      try {
        const { error: activityError } = await supabase
          .from('lead_activities')
          .insert({
            lead_id: leadId,
            activity_type: 'status_change',
            subject: 'Pipeline Stage Changed',
            description: `Lead moved to pipeline stage`,
            created_by: (await supabase.auth.getUser()).data.user?.id,
            is_automated: false
          });

        if (activityError) console.warn('Failed to log activity:', activityError);
      } catch (err) {
        console.warn('Activity logging not available:', err);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pipeline-leads']);
      queryClient.invalidateQueries(['leads']);
      toast.success('Lead moved successfully');
    },
    onError: (error) => {
      console.error('Error moving lead:', error);
      toast.error('Failed to move lead');
    }
  });

  // Assign leads to stages based on status_bucket or pipeline_stage_id
  const assignLeadToStage = (lead: Lead): string => {
    // If lead already has a pipeline stage, use it
    if (lead.pipeline_stage_id) {
      return lead.pipeline_stage_id;
    }
    
    // Otherwise, assign based on status_bucket
    switch (lead.status_bucket) {
      case 'P1': return stages[0]?.id || 'new-lead';  // High priority -> New Lead
      case 'P2': return stages[1]?.id || 'new-lead'; // Medium priority -> Qualified
      case 'P3': return stages[2]?.id || 'new-lead'; // Low priority -> Contact Made
      default: return stages[0]?.id || 'new-lead';
    }
  };

  // Filter leads based on search and filters
  const filterLeads = (leads: Lead[]): Lead[] => {
    return leads.filter(lead => {
      const matchesSearch = !searchTerm || 
        lead.clients?.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.clients?.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.industry?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesPriority = !selectedPriority || lead.status_bucket === selectedPriority;
      const matchesAgent = !selectedAgent || lead.agent_id === selectedAgent;
      const matchesDealValue = (lead.deal_value || 0) >= minDealValue;
      
      // Manager filter - show manager's own leads AND their team members' leads
      const matchesManager = !selectedManager || (() => {
        if (!lead.agent_id) return false;
        
        // Check if the lead belongs to the selected manager directly
        if (lead.agent_id === selectedManager) {
          return true;
        }
        
        // Check if the lead belongs to an agent who reports to the selected manager
        const leadAgent = allUsers.find(user => user.id === lead.agent_id);
        return leadAgent?.manager_id === selectedManager;
      })();

      return matchesSearch && matchesPriority && matchesAgent && matchesDealValue && matchesManager;
    });
  };

  // Organize leads by pipeline stage with filtering and pagination
  const pipelineColumns: PipelineColumn[] = useMemo(() => {
    return stages.map(stage => {
      const stageLeads = leadsData.filter(lead => {
        const assignedStageId = assignLeadToStage(lead);
        return assignedStageId === stage.id;
      });
      
      const filteredLeads = filterLeads(stageLeads);
      const totalValue = stageLeads.reduce((sum, lead) => sum + (lead.deal_value || 0), 0);
      
      return {
        stage,
        leads: stageLeads,
        totalValue,
        count: stageLeads.length,
        filteredLeads,
        filteredCount: filteredLeads.length
      };
    });
  }, [stages, leadsData, searchTerm, selectedPriority, selectedAgent, selectedManager, minDealValue, allUsers]);

  // Get paginated leads for a specific stage
  const getPaginatedLeads = (column: PipelineColumn): Lead[] => {
    const page = currentPage[column.stage.id] || 0;
    const startIndex = page * leadsPerPage;
    const endIndex = startIndex + leadsPerPage;
    return column.filteredLeads.slice(startIndex, endIndex);
  };

  // Get total pages for a stage
  const getTotalPages = (column: PipelineColumn): number => {
    return Math.ceil(column.filteredCount / leadsPerPage);
  };

  // Handle page change for a specific stage
  const handlePageChange = (stageId: string, newPage: number) => {
    setCurrentPage(prev => ({
      ...prev,
      [stageId]: newPage
    }));
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const sourceStageId = result.source.droppableId;
    const destinationStageId = result.destination.droppableId;
    
    if (sourceStageId === destinationStageId) return;

    const leadId = result.draggableId;
    const destinationStage = stages.find(s => s.id === destinationStageId);
    
    if (!destinationStage) return;

    moveLeadMutation.mutate({
      leadId,
      stageId: destinationStageId,
      newProbability: destinationStage.probability
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Compact Lead Card - Much smaller and more efficient
  const CompactLeadCard: React.FC<{ lead: Lead; index: number }> = ({ lead, index }) => (
    <Draggable draggableId={lead.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`group bg-white rounded-md border border-gray-200 p-2 mb-1.5 shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer ${
            snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-500 scale-105' : 'hover:border-blue-300'
          }`}
          onClick={() => onLeadClick?.(lead)}
        >
          {/* Ultra Compact Header */}
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center space-x-1.5 min-w-0 flex-1">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xs">
                  {lead.clients?.client_name?.charAt(0)?.toUpperCase() || 'L'}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-medium text-gray-900 text-xs truncate">
                  {lead.clients?.client_name || 'Unknown Client'}
                </h4>
                {lead.clients?.company && (
                  <p className="text-xs text-gray-500 truncate">
                    {lead.clients?.company}
                  </p>
                )}
              </div>
            </div>
            <span className={`px-1.5 py-0.5 text-xs rounded font-medium flex-shrink-0 ${
              lead.status_bucket === 'P1' ? 'bg-red-100 text-red-700' :
              lead.status_bucket === 'P2' ? 'bg-yellow-100 text-yellow-700' :
              'bg-green-100 text-green-700'
            }`}>
              {lead.status_bucket}
            </span>
          </div>
          
          {/* Deal Value - Compact */}
          <div className="flex items-center justify-between text-xs mb-1">
            <div className="flex items-center text-green-700 font-semibold">
              <CurrencyDollarIcon className="h-3 w-3 mr-1" />
              <span>{formatCurrency(lead.deal_value || 0)}</span>
            </div>
            {lead.contact_person && (
              <span className="text-gray-500 truncate max-w-20">
                {lead.contact_person}
              </span>
            )}
          </div>
          
          {/* Footer - Minimal */}
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span className="truncate max-w-16">
              {lead.users?.full_name?.split(' ')[0] || 'Unassigned'}
            </span>
            <div className="flex items-center space-x-1">
              {lead.phone && (
                <PhoneIcon className="h-3 w-3 text-gray-400" />
              )}
              {lead.email && (
                <EnvelopeIcon className="h-3 w-3 text-gray-400" />
              )}
              {lead.expected_close_date && (
                <span className="text-xs">
                  {new Date(lead.expected_close_date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedPriority('');
    setSelectedAgent('');
    setSelectedManager('');
    setMinDealValue(0);
    setCurrentPage({});
  };

  // Count active filters
  const activeFiltersCount = [
    searchTerm, 
    selectedPriority, 
    selectedAgent, 
    selectedManager, 
    minDealValue > 0 ? minDealValue.toString() : ''
  ].filter(Boolean).length;

  if (stagesLoading || leadsLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mx-auto mb-2"></div>
          <span className="text-sm font-medium text-gray-600">Loading pipeline...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="p-4">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          {/* Enhanced Header with Filters */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-white">Sales Pipeline</h3>
                <p className="text-blue-100 text-sm">
                  {leadsData.length} total leads • {pipelineColumns.reduce((sum, col) => sum + col.filteredCount, 0)} filtered
                  {selectedManager && (
                    <span className="ml-2">
                      • Manager: {managers.find(m => m.id === selectedManager)?.full_name}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setFiltersExpanded(!filtersExpanded)}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border border-white border-opacity-30 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 flex items-center"
                >
                  <FunnelIcon className="h-4 w-4 mr-1" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white bg-opacity-30 text-white">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
                <Button size="sm" className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-white border-opacity-30">
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Settings
                </Button>
              </div>
            </div>
          </div>

          {/* Expandable Filters */}
          {filtersExpanded && (
            <div className="bg-gray-50 border-b border-gray-200 p-4">
              <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${isSuperAdmin ? '5' : '4'} gap-4`}>
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search leads..."
                      className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                {/* Priority Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                  >
                    <option value="">All Priorities</option>
                    <option value="P1">P1 - High</option>
                    <option value="P2">P2 - Medium</option>
                    <option value="P3">P3 - Low</option>
                  </select>
                </div>

                {/* Manager Filter - Only visible to Super Admins */}
                {isSuperAdmin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Manager</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      value={selectedManager}
                      onChange={(e) => setSelectedManager(e.target.value)}
                    >
                      <option value="">All Managers</option>
                      {managers.map(manager => (
                        <option key={manager.id} value={manager.id}>
                          {manager.full_name || manager.email}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Agent Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Agent</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    value={selectedAgent}
                    onChange={(e) => setSelectedAgent(e.target.value)}
                  >
                    <option value="">All Agents</option>
                    {agents.map(agent => (
                      <option key={agent.id} value={agent.id}>
                        {agent.full_name || agent.email}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Deal Value Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Deal Value</label>
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    value={minDealValue || ''}
                    onChange={(e) => setMinDealValue(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}

          {/* Pipeline Columns - More Compact */}
          <div className="p-4">
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="flex space-x-3 overflow-x-auto pb-2">
                {pipelineColumns.map((column) => {
                  const paginatedLeads = getPaginatedLeads(column);
                  const totalPages = getTotalPages(column);
                  const currentPageNum = currentPage[column.stage.id] || 0;

                  return (
                    <div key={column.stage.id} className="flex-shrink-0 w-64">
                      <div className="bg-gray-50 rounded-lg border border-gray-200">
                        {/* Compact Stage Header */}
                        <div className="p-2 border-b border-gray-200 bg-white rounded-t-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-1.5">
                              <div 
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: column.stage.color_code }}
                              ></div>
                              <h4 className="font-medium text-gray-900 text-sm">{column.stage.name}</h4>
                              <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                {column.stage.probability}%
                              </span>
                            </div>
                          </div>

                          {/* Compact Stats */}
                          <div className="flex items-center justify-between text-xs text-gray-600">
                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">
                              {column.filteredCount}/{column.count}
                            </span>
                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium">
                              {formatCurrency(column.totalValue)}
                            </span>
                          </div>

                          {/* Pagination Controls */}
                          {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                              <button
                                onClick={() => handlePageChange(column.stage.id, Math.max(0, currentPageNum - 1))}
                                disabled={currentPageNum === 0}
                                className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <ChevronLeftIcon className="h-3 w-3" />
                              </button>
                              <span className="text-xs text-gray-500">
                                {currentPageNum + 1} / {totalPages}
                              </span>
                              <button
                                onClick={() => handlePageChange(column.stage.id, Math.min(totalPages - 1, currentPageNum + 1))}
                                disabled={currentPageNum >= totalPages - 1}
                                className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <ChevronRightIcon className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Droppable Area - Optimized Height */}
                        <Droppable droppableId={column.stage.id}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`h-80 overflow-y-auto p-2 transition-colors duration-200 ${
                                snapshot.isDraggingOver ? 'bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg' : ''
                              }`}
                            >
                              {paginatedLeads.map((lead, index) => (
                                <CompactLeadCard key={lead.id} lead={lead} index={index} />
                              ))}
                              {provided.placeholder}
                              
                              {paginatedLeads.length === 0 && (
                                <div className="text-center py-8 text-gray-400">
                                  <ChartBarIcon className="h-6 w-6 mx-auto mb-2 opacity-50" />
                                  <p className="text-xs">No leads</p>
                                  <p className="text-xs mt-1">Drag leads here</p>
                                </div>
                              )}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    </div>
                  );
                })}
              </div>
            </DragDropContext>
          </div>
        </div>
      </div>

      {/* Bottom Spacing */}
      <div className="h-16"></div>
    </div>
  );
};