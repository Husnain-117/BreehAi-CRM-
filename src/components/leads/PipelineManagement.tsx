// src/components/leads/PipelineManagement.tsx - FIXED Beautiful UI Version
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { supabase } from '../../lib/supabaseClient';
import { Lead } from '../../types';
import { 
  ChevronRightIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  ChartBarIcon,
  PlusIcon,
  BuildingOfficeIcon,
  UserIcon,
  TagIcon
} from '@heroicons/react/20/solid';
import { Button } from '../ui/button';
import toast from 'react-hot-toast';

interface PipelineStage {
  id: string;
  name: string;
  description: string | null;
  order_position: number;
  probability: number;
  color_code: string;
  is_active: boolean;
}

interface LeadWithStage extends Lead {
  pipeline_stages?: PipelineStage;
}

interface PipelineColumn {
  stage: PipelineStage;
  leads: LeadWithStage[];
  totalValue: number;
  count: number;
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
    is_active: true
  },
  {
    id: 'qualified',
    name: 'Qualified',
    description: 'Qualified prospects',
    order_position: 2,
    probability: 15,
    color_code: '#f97316',
    is_active: true
  },
  {
    id: 'contact-made',
    name: 'Contact Made',
    description: 'Initial contact established',
    order_position: 3,
    probability: 25,
    color_code: '#eab308',
    is_active: true
  },
  {
    id: 'needs-analysis',
    name: 'Needs Analysis',
    description: 'Understanding client needs',
    order_position: 4,
    probability: 50,
    color_code: '#3b82f6',
    is_active: true
  },
  {
    id: 'proposal',
    name: 'Proposal',
    description: 'Proposal submitted',
    order_position: 5,
    probability: 75,
    color_code: '#8b5cf6',
    is_active: true
  },
  {
    id: 'closed-won',
    name: 'Closed Won',
    description: 'Successfully closed deals',
    order_position: 6,
    probability: 100,
    color_code: '#10b981',
    is_active: true
  }
];

export const PipelineManagement: React.FC<PipelineManagementProps> = ({ onLeadClick }) => {
  const queryClient = useQueryClient();

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
      return data as LeadWithStage[];
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
  const assignLeadToStage = (lead: LeadWithStage): string => {
    // If lead already has a pipeline stage, use it
    if (lead.pipeline_stage_id) {
      return lead.pipeline_stage_id;
    }
    
    // Otherwise, assign based on status_bucket
    switch (lead.status_bucket) {
      case 'P1': return stages[0]?.id || 'new-lead';  // High priority -> New Lead
      case 'P2': return stages[1]?.id || 'qualified'; // Medium priority -> Qualified
      case 'P3': return stages[2]?.id || 'contact-made'; // Low priority -> Contact Made
      default: return stages[0]?.id || 'new-lead';
    }
  };

  // Organize leads by pipeline stage
  const pipelineColumns: PipelineColumn[] = stages.map(stage => {
    const stageLeads = leadsData.filter(lead => {
      const assignedStageId = assignLeadToStage(lead);
      return assignedStageId === stage.id;
    });
    
    const totalValue = stageLeads.reduce((sum, lead) => sum + (lead.deal_value || 0), 0);
    
    return {
      stage,
      leads: stageLeads,
      totalValue,
      count: stageLeads.length
    };
  });

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

  const LeadCard: React.FC<{ lead: LeadWithStage; index: number }> = ({ lead, index }) => (
    <Draggable draggableId={lead.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`group bg-white rounded-xl border border-gray-200 p-4 mb-3 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer ${
            snapshot.isDragging ? 'shadow-2xl ring-2 ring-indigo-500 scale-105 rotate-2' : ''
          }`}
          onClick={() => onLeadClick?.(lead)}
        >
          {/* Lead Header */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-sm">
                  {lead.clients?.client_name?.charAt(0)?.toUpperCase() || 'L'}
                </span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm truncate max-w-[150px]">
                  {lead.clients?.client_name || 'Unknown Client'}
                </h4>
                <p className="text-xs text-gray-600 truncate max-w-[150px]">
                  {lead.clients?.company || 'No Company'}
                </p>
              </div>
            </div>
            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
              lead.status_bucket === 'P1' ? 'bg-red-100 text-red-800' :
              lead.status_bucket === 'P2' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {lead.status_bucket}
            </span>
          </div>
          
          {/* Industry & Contact */}
          <div className="space-y-2 mb-3">
            {lead.industry && (
              <div className="flex items-center">
                <TagIcon className="h-3 w-3 mr-1 text-gray-400" />
                <span className="text-xs text-gray-600 capitalize bg-blue-50 px-2 py-1 rounded-full">
                  {lead.industry}
                </span>
              </div>
            )}
            
            {lead.contact_person && (
              <div className="flex items-center">
                <UserIcon className="h-3 w-3 mr-1 text-gray-400" />
                <span className="text-xs text-gray-600 truncate">{lead.contact_person}</span>
              </div>
            )}
          </div>
          
          {/* Deal Value */}
          <div className="flex items-center justify-center mb-3 py-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
            <CurrencyDollarIcon className="h-4 w-4 mr-1 text-green-600" />
            <span className="font-bold text-green-700">
              {formatCurrency(lead.deal_value || 0)}
            </span>
          </div>
          
          {/* Footer */}
          <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t border-gray-100">
            <div className="flex items-center">
              <UserIcon className="h-3 w-3 mr-1" />
              <span>{lead.users?.full_name?.split(' ')[0] || 'Unassigned'}</span>
            </div>
            {lead.expected_close_date && (
              <div className="flex items-center">
                <CalendarDaysIcon className="h-3 w-3 mr-1" />
                <span>{new Date(lead.expected_close_date).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );

  if (stagesLoading || leadsLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
          <span className="text-lg font-medium text-gray-600">Loading pipeline...</span>
        </div>
      </div>
    );
  }

  const totalPipelineValue = pipelineColumns.reduce((sum, col) => sum + col.totalValue, 0);
  const totalLeadsCount = pipelineColumns.reduce((sum, col) => sum + col.count, 0);

  return (
    <div className="bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen p-6">
      {/* Pipeline Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center">
              <ChartBarIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Pipeline</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPipelineValue)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
              <UserGroupIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Leads</p>
              <p className="text-2xl font-bold text-gray-900">{totalLeadsCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <CurrencyDollarIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Deal Size</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalLeadsCount > 0 ? totalPipelineValue / totalLeadsCount : 0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
              <ChevronRightIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(((pipelineColumns.find(c => c.stage.name === 'Closed Won')?.count || 0) / Math.max(totalLeadsCount, 1)) * 100)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Board */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-white">Sales Pipeline</h3>
              <p className="text-indigo-100 text-sm mt-1">Drag and drop leads between stages</p>
            </div>
            <Button className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-white border-opacity-30">
              <PlusIcon className="h-4 w-4 mr-2" />
              Manage Stages
            </Button>
          </div>
        </div>

        <div className="p-6">
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex space-x-6 overflow-x-auto pb-4">
              {pipelineColumns.map((column) => (
                <div key={column.stage.id} className="flex-shrink-0 w-80">
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 shadow-sm">
                    {/* Stage Header */}
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded-full shadow-sm"
                            style={{ backgroundColor: column.stage.color_code }}
                          ></div>
                          <h4 className="font-semibold text-gray-900">{column.stage.name}</h4>
                        </div>
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {column.stage.probability}%
                        </span>
                      </div>

                      {/* Stage Stats */}
                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div className="text-center bg-blue-50 rounded-lg p-2">
                          <div className="text-lg font-bold text-blue-600">{column.count}</div>
                          <div className="text-xs text-blue-700">Leads</div>
                        </div>
                        <div className="text-center bg-green-50 rounded-lg p-2">
                          <div className="text-lg font-bold text-green-600">{formatCurrency(column.totalValue)}</div>
                          <div className="text-xs text-green-700">Value</div>
                        </div>
                      </div>
                    </div>

                    {/* Droppable Area */}
                    <Droppable droppableId={column.stage.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`min-h-[500px] p-4 transition-all duration-200 ${
                            snapshot.isDraggingOver ? 'bg-indigo-50 border-2 border-dashed border-indigo-300 rounded-lg' : ''
                          }`}
                        >
                          {column.leads.map((lead, index) => (
                            <LeadCard key={lead.id} lead={lead} index={index} />
                          ))}
                          {provided.placeholder}
                          
                          {column.leads.length === 0 && (
                            <div className="text-center py-12 text-gray-400">
                              <ChartBarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                              <p className="text-sm font-medium">No leads in this stage</p>
                              <p className="text-xs mt-1">Drag leads here to get started</p>
                            </div>
                          )}
                        </div>
                      )}
                    </Droppable>
                  </div>
                </div>
              ))}
            </div>
          </DragDropContext>
        </div>
      </div>

      {/* Stage Performance Summary */}
      <div className="mt-8 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900">Stage Performance Overview</h4>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pipelineColumns.map((column) => (
              <div key={column.stage.id} className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-3 mb-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: column.stage.color_code }}
                  ></div>
                  <span className="font-medium text-gray-900">{column.stage.name}</span>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Leads:</span>
                    <span className="font-medium">{column.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Value:</span>
                    <span className="font-medium">{formatCurrency(column.totalValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Probability:</span>
                    <span className="font-medium">{column.stage.probability}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};