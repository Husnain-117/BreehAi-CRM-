// src/components/leads/PipelineManagement.tsx - Improved Compact UI Version
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { supabase } from '../../lib/supabaseClient';
import { Lead } from '../../types';
import { 
  CurrencyDollarIcon,
  CalendarDaysIcon,
  UserIcon,
  TagIcon,
  ChartBarIcon,
  PlusIcon
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
      case 'P2': return stages[1]?.id || 'new-lead'; // Medium priority -> Qualified
      case 'P3': return stages[2]?.id || 'new-lead'; // Low priority -> Contact Made
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
          className={`group bg-white rounded-lg border border-gray-200 p-3 mb-2 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
            snapshot.isDragging ? 'shadow-xl ring-2 ring-blue-500 scale-105' : 'hover:border-blue-300'
          }`}
          onClick={() => onLeadClick?.(lead)}
        >
          {/* Compact Lead Header */}
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">
                  {lead.clients?.client_name?.charAt(0)?.toUpperCase() || 'L'}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-medium text-gray-900 text-sm truncate">
                  {lead.clients?.client_name || 'Unknown Client'}
                </h4>
                <p className="text-xs text-gray-500 truncate">
                  {lead.clients?.company || 'No Company'}
                </p>
              </div>
            </div>
            <span className={`px-2 py-1 text-xs rounded-full font-medium flex-shrink-0 ${
              lead.status_bucket === 'P1' ? 'bg-red-100 text-red-700' :
              lead.status_bucket === 'P2' ? 'bg-yellow-100 text-yellow-700' :
              'bg-green-100 text-green-700'
            }`}>
              {lead.status_bucket}
            </span>
          </div>
          
          {/* Deal Value - Prominent */}
          <div className="bg-green-50 rounded-lg p-2 mb-2 text-center border border-green-100">
            <div className="flex items-center justify-center">
              <CurrencyDollarIcon className="h-4 w-4 mr-1 text-green-600" />
              <span className="font-bold text-green-700 text-sm">
                {formatCurrency(lead.deal_value || 0)}
              </span>
            </div>
          </div>
          
          {/* Compact Details */}
          <div className="space-y-1">
            {lead.contact_person && (
              <div className="flex items-center text-xs text-gray-600">
                <UserIcon className="h-3 w-3 mr-1 text-gray-400 flex-shrink-0" />
                <span className="truncate">{lead.contact_person}</span>
              </div>
            )}
            
            {lead.industry && (
              <div className="flex items-center text-xs">
                <TagIcon className="h-3 w-3 mr-1 text-gray-400 flex-shrink-0" />
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs capitalize truncate">
                  {lead.industry}
                </span>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="flex justify-between items-center text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
            <span className="truncate">{lead.users?.full_name?.split(' ')[0] || 'Unassigned'}</span>
            {lead.expected_close_date && (
              <div className="flex items-center flex-shrink-0 ml-2">
                <CalendarDaysIcon className="h-3 w-3 mr-1" />
                <span>{new Date(lead.expected_close_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );

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
      {/* Compact Pipeline Board */}
      <div className="p-4">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          {/* Simple Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-white">Sales Pipeline</h3>
                <p className="text-blue-100 text-sm">Drag leads between stages</p>
              </div>
              <Button size="sm" className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-white border-opacity-30">
                <PlusIcon className="h-4 w-4 mr-1" />
                Settings
              </Button>
            </div>
          </div>

          {/* Pipeline Columns */}
          <div className="p-4">
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="flex space-x-4 overflow-x-auto pb-2">
                {pipelineColumns.map((column) => (
                  <div key={column.stage.id} className="flex-shrink-0 w-72">
                    <div className="bg-gray-50 rounded-lg border border-gray-200">
                      {/* Compact Stage Header */}
                      <div className="p-3 border-b border-gray-200 bg-white rounded-t-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: column.stage.color_code }}
                            ></div>
                            <h4 className="font-medium text-gray-900 text-sm">{column.stage.name}</h4>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                              {column.stage.probability}%
                            </span>
                          </div>
                        </div>

                        {/* Inline Stats */}
                        <div className="flex items-center justify-between mt-2 text-xs text-gray-600">
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {column.count} leads
                          </span>
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
                            {formatCurrency(column.totalValue)}
                          </span>
                        </div>
                      </div>

                      {/* Droppable Area - Controlled Height */}
                      <Droppable droppableId={column.stage.id}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`h-96 overflow-y-auto p-3 transition-colors duration-200 ${
                              snapshot.isDraggingOver ? 'bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg' : ''
                            }`}
                          >
                            {column.leads.map((lead, index) => (
                              <LeadCard key={lead.id} lead={lead} index={index} />
                            ))}
                            {provided.placeholder}
                            
                            {column.leads.length === 0 && (
                              <div className="text-center py-8 text-gray-400">
                                <ChartBarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No leads</p>
                                <p className="text-xs mt-1">Drag leads here</p>
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
      </div>

      {/* Bottom Spacing */}
      <div className="h-16"></div>
    </div>
  );
};