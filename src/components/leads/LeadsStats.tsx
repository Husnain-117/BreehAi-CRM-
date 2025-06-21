import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { Lead, UserProfile } from '../../types';
import { 
  ChartBarIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  StarIcon,
  CalendarDaysIcon,
  BuildingOfficeIcon,
  TagIcon,
  FunnelIcon,
  EyeIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ShieldCheckIcon,
  UserIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/20/solid';

// Define types for our data structures
interface PipelineStage {
  id: string;
  name: string;
  description?: string;
  order_position: number;
  probability: number;
  is_active: boolean;
  color_code: string;
}

interface LeadWithRelations extends Lead {
  clients?: {
    id: string;
    client_name: string;
    company?: string;
    industry?: string;
  };
  users?: {
    id: string;
    full_name?: string;
    email?: string;
  };
  pipeline_stages?: PipelineStage;
}

interface LeadStats {
  userId: string;
  userName: string;
  userEmail: string;
  totalLeads: number;
  totalValue: number;
  avgDealValue: number;
  conversionRate: number;
  stageBreakdown: StageStats[];
  recentActivity: number;
  topIndustries: IndustryStats[];
  statusBucketBreakdown: StatusBucketStats[];
}

interface StageStats {
  stageId: string;
  stageName: string;
  probability: number;
  color: string;
  count: number;
  value: number;
  leads: LeadWithRelations[];
  orderPosition: number;
}

interface StatusBucketStats {
  bucket: string;
  count: number;
  value: number;
  leads: LeadWithRelations[];
}

interface IndustryStats {
  industry: string;
  count: number;
  value: number;
  percentage: number;
}

export const LeadsStats: React.FC = () => {
  const { profile } = useAuth();
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');

  // Determine user's role and permissions
  const userRole = profile?.role || 'agent';
  const isAgent = userRole === 'agent';
  const isManager = userRole === 'manager' || userRole === 'team_lead';
  const isSuperAdmin = userRole === 'super_admin' || userRole === 'admin';

  // Show loading if no profile yet
  if (!profile) {
    return (
      <div className="flex items-center justify-center h-96 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
          <span className="text-lg font-medium text-gray-600">Loading your profile...</span>
        </div>
      </div>
    );
  }

  // Fetch pipeline stages
  const { data: pipelineStages = [], isLoading: stagesLoading } = useQuery({
    queryKey: ['pipeline-stages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pipeline_stages')
        .select('*')
        .eq('is_active', true)
        .order('order_position');
      
      if (error) throw error;
      return data as PipelineStage[];
    }
  });

  // Fetch leads based on user role with proper joins
  const { data: leadsData = [], isLoading: leadsLoading } = useQuery({
    queryKey: ['leads-stats', profile.id, userRole],
    queryFn: async () => {
      let query = supabase
        .from('leads')
        .select(`
          *,
          clients (
            id,
            client_name,
            company,
            industry
          ),
          users (
            id,
            full_name,
            email
          ),
          pipeline_stages (
            id,
            name,
            description,
            order_position,
            probability,
            is_active,
            color_code
          )
        `)
        .order('created_at', { ascending: false });

      // Apply role-based filtering
      if (isAgent) {
        query = query.eq('agent_id', profile.id);
      } else if (isManager) {
        const { data: teamMembers } = await supabase
          .from('users')
          .select('id')
          .or(`manager_id.eq.${profile.id},id.eq.${profile.id}`);
        
        if (teamMembers && teamMembers.length > 0) {
          const teamIds = teamMembers.map(member => member.id);
          query = query.in('agent_id', teamIds);
        } else {
          query = query.eq('agent_id', profile.id);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as LeadWithRelations[];
    },
    enabled: !!profile?.id
  });

  // Fetch users based on role
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['users-stats', profile.id, userRole],
    queryFn: async () => {
      let query = supabase
        .from('users')
        .select('*')
        .order('full_name');

      if (isAgent) {
        query = query.eq('id', profile.id);
      } else if (isManager) {
        query = query.or(`manager_id.eq.${profile.id},id.eq.${profile.id}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as UserProfile[];
    },
    enabled: !!profile?.id
  });

  // Assign leads to stages based on status_bucket or pipeline_stage_id (same as PipelineManagement)
  const assignLeadToStage = (lead: LeadWithRelations): string => {
    if (lead.pipeline_stage_id) {
      return lead.pipeline_stage_id;
    }
    
    switch (lead.status_bucket) {
      case 'P1': return pipelineStages[0]?.id || 'new-lead';
      case 'P2': return pipelineStages[1]?.id || 'qualified';
      case 'P3': return pipelineStages[5]?.id || 'closed-won';
      default: return pipelineStages[0]?.id || 'new-lead';
    }
  };

  // Calculate comprehensive stats
  const statsData = useMemo(() => {
    if (!leadsData.length || !users.length || !pipelineStages.length) return [];

    return users.map(user => {
      const userLeads = leadsData.filter(lead => lead.agent_id === user.id);
      const totalValue = userLeads.reduce((sum, lead) => sum + (lead.deal_value || 0), 0);
      
      const closedWonLeads = userLeads.filter(lead => lead.status_bucket === 'P3');
      const qualifiedLeads = userLeads.filter(lead => 
        lead.status_bucket === 'P1' || lead.status_bucket === 'P2' || lead.status_bucket === 'P3'
      );
      const conversionRate = qualifiedLeads.length > 0 ? (closedWonLeads.length / qualifiedLeads.length) * 100 : 0;

      // Create stage breakdown using actual pipeline stages and assignLeadToStage logic
      const stageBreakdown = pipelineStages.map(stage => {
        const stageLeads = userLeads.filter(lead => assignLeadToStage(lead) === stage.id);
        const stageValue = stageLeads.reduce((sum, lead) => sum + (lead.deal_value || 0), 0);

        return {
          stageId: stage.id,
          stageName: stage.name,
          probability: stage.probability,
          color: stage.color_code,
          count: stageLeads.length,
          value: stageValue,
          leads: stageLeads,
          orderPosition: stage.order_position
        };
      }).sort((a, b) => a.orderPosition - b.orderPosition);

      // Create status bucket breakdown
      const statusBuckets = ['P1', 'P2', 'P3'] as const;
      const statusBucketBreakdown = statusBuckets.map(bucket => {
        const bucketLeads = userLeads.filter(lead => lead.status_bucket === bucket);
        const bucketValue = bucketLeads.reduce((sum, lead) => sum + (lead.deal_value || 0), 0);

        return {
          bucket,
          count: bucketLeads.length,
          value: bucketValue,
          leads: bucketLeads
        };
      });

      const unassignedLeads = userLeads.filter(lead => !lead.status_bucket);
      if (unassignedLeads.length > 0) {
        statusBucketBreakdown.push({
          bucket: 'Unassigned',
          count: unassignedLeads.length,
          value: unassignedLeads.reduce((sum, lead) => sum + (lead.deal_value || 0), 0),
          leads: unassignedLeads
        });
      }

      // Calculate industry breakdown
      const industryMap = new Map<string, { count: number; value: number }>();
      userLeads.forEach(lead => {
        const industry = lead.clients?.industry || lead.industry || 'Unknown';
        const existing = industryMap.get(industry) || { count: 0, value: 0 };
        industryMap.set(industry, {
          count: existing.count + 1,
          value: existing.value + (lead.deal_value || 0)
        });
      });

      const topIndustries = Array.from(industryMap.entries())
        .map(([industry, stats]) => ({
          industry,
          count: stats.count,
          value: stats.value,
          percentage: userLeads.length > 0 ? (stats.count / userLeads.length) * 100 : 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate recent activity (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const recentActivity = userLeads.filter(lead => 
        new Date(lead.updated_at) > weekAgo
      ).length;

      return {
        userId: user.id,
        userName: user.full_name || 'Unknown User',
        userEmail: user.email || '',
        totalLeads: userLeads.length,
        totalValue,
        avgDealValue: userLeads.length > 0 ? totalValue / userLeads.length : 0,
        conversionRate,
        stageBreakdown,
        statusBucketBreakdown,
        recentActivity,
        topIndustries
      };
    });
  }, [leadsData, users, pipelineStages]);

  // Calculate overall stats
  const overallStats = useMemo(() => {
    if (!statsData.length) return null;

    const totalLeads = statsData.reduce((sum, user) => sum + user.totalLeads, 0);
    const totalValue = statsData.reduce((sum, user) => sum + user.totalValue, 0);
    const avgConversion = statsData.length > 0 ? 
      statsData.reduce((sum, user) => sum + user.conversionRate, 0) / statsData.length : 0;

    // Combine stage breakdown across all users
    const combinedStageBreakdown = pipelineStages.map(stage => {
      const stageData = statsData.reduce((acc, user) => {
        const userStage = user.stageBreakdown.find(s => s.stageId === stage.id);
        return {
          count: acc.count + (userStage?.count || 0),
          value: acc.value + (userStage?.value || 0)
        };
      }, { count: 0, value: 0 });

      return {
        id: stage.id,
        name: stage.name,
        probability: stage.probability,
        color: stage.color_code,
        count: stageData.count,
        value: stageData.value,
        orderPosition: stage.order_position
      };
    }).sort((a, b) => a.orderPosition - b.orderPosition);

    // Combine status bucket breakdown
    const combinedStatusBreakdown = ['P1', 'P2', 'P3', 'Unassigned'].map(bucket => {
      const bucketData = statsData.reduce((acc, user) => {
        const userBucket = user.statusBucketBreakdown.find(s => s.bucket === bucket);
        return {
          count: acc.count + (userBucket?.count || 0),
          value: acc.value + (userBucket?.value || 0)
        };
      }, { count: 0, value: 0 });

      return {
        bucket,
        count: bucketData.count,
        value: bucketData.value
      };
    });

    return {
      totalLeads,
      totalValue,
      avgDealValue: totalLeads > 0 ? totalValue / totalLeads : 0,
      avgConversion,
      activeUsers: statsData.filter(user => user.totalLeads > 0).length,
      stageBreakdown: combinedStageBreakdown,
      statusBreakdown: combinedStatusBreakdown
    };
  }, [statsData, pipelineStages]);

  const toggleUserExpansion = (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getBucketDisplayName = (bucket: string) => {
    switch (bucket) {
      case 'P1': return 'High Priority';
      case 'P2': return 'Medium Priority';
      case 'P3': return 'Closed/Won';
      case 'Unassigned': return 'Unassigned';
      default: return bucket;
    }
  };

  const getBucketColor = (bucket: string) => {
    switch (bucket) {
      case 'P1': return '#ef4444'; // Red
      case 'P2': return '#f97316'; // Orange
      case 'P3': return '#10b981'; // Green
      case 'Unassigned': return '#6b7280'; // Gray
      default: return '#6366f1'; // Indigo
    }
  };

  if (leadsLoading || usersLoading || stagesLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
          <span className="text-lg font-medium text-gray-600">Loading statistics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                {isAgent && <UserIcon className="h-6 w-6 text-indigo-200" />}
                {isManager && <UserGroupIcon className="h-6 w-6 text-indigo-200" />}
                {isSuperAdmin && <ShieldCheckIcon className="h-6 w-6 text-indigo-200" />}
                <h1 className="text-3xl font-bold text-white">
                  {isAgent ? 'My Lead Statistics' : 
                   isManager ? 'Team Lead Statistics' : 
                   'Organization Statistics'}
                </h1>
              </div>
              <p className="text-indigo-200">
                {isAgent ? `Your personal lead performance and pipeline` :
                 isManager ? `Track your team's lead distribution and performance` :
                 `Complete overview of all leads across the organization`}
              </p>
              
              <div className="mt-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white bg-opacity-20 text-white border border-white border-opacity-30">
                  {isAgent && '👤 Agent View'}
                  {isManager && '👥 Manager View'} 
                  {isSuperAdmin && '🛡️ Admin View'}
                </span>
              </div>
            </div>
            
            {!isAgent && (
              <div className="flex space-x-4">
                <button
                  onClick={() => setViewMode('overview')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    viewMode === 'overview' 
                      ? 'bg-white text-indigo-600' 
                      : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
                  }`}
                >
                  <ChartBarIcon className="h-4 w-4 inline mr-2" />
                  Overview
                </button>
                <button
                  onClick={() => setViewMode('detailed')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    viewMode === 'detailed' 
                      ? 'bg-white text-indigo-600' 
                      : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
                  }`}
                >
                  <EyeIcon className="h-4 w-4 inline mr-2" />
                  Detailed
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isAgent && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center">
            <UserIcon className="h-5 w-5 text-blue-600 mr-2" />
            <div>
              <h3 className="text-sm font-semibold text-blue-800">Personal Dashboard</h3>
              <p className="text-sm text-blue-700 mt-1">
                You're viewing statistics for your assigned leads only. Contact your manager for team-wide insights.
              </p>
            </div>
          </div>
        </div>
      )}

      {isManager && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center">
            <UserGroupIcon className="h-5 w-5 text-green-600 mr-2" />
            <div>
              <h3 className="text-sm font-semibold text-green-800">Team Dashboard</h3>
              <p className="text-sm text-green-700 mt-1">
                You're viewing statistics for yourself and your team members. 
                {users.length > 1 ? ` Managing ${users.length - 1} team member${users.length > 2 ? 's' : ''}.` : ' No team members assigned yet.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {isSuperAdmin && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center">
            <ShieldCheckIcon className="h-5 w-5 text-purple-600 mr-2" />
            <div>
              <h3 className="text-sm font-semibold text-purple-800">Administrator Dashboard</h3>
              <p className="text-sm text-purple-700 mt-1">
                You have access to all leads and users across the organization. 
                Currently tracking {users.length} user${users.length !== 1 ? 's' : ''} and {leadsData.length} lead${leadsData.length !== 1 ? 's' : ''}.
              </p>
            </div>
          </div>
        </div>
      )}

      {overallStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <UserGroupIcon className="h-8 w-8 text-blue-200" />
              <div className="text-right">
                <div className="text-3xl font-bold">{overallStats.totalLeads}</div>
                <div className="text-blue-200 text-sm">Total Leads</div>
              </div>
            </div>
            <div className="text-blue-200 text-sm">
              {overallStats.activeUsers} active users
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <CurrencyDollarIcon className="h-8 w-8 text-green-200" />
              <div className="text-right">
                <div className="text-2xl font-bold">{formatCurrency(overallStats.totalValue)}</div>
                <div className="text-green-200 text-sm">Total Pipeline Value</div>
              </div>
            </div>
            <div className="text-green-200 text-sm">
              {formatCurrency(overallStats.avgDealValue)} avg deal
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <ArrowTrendingUpIcon className="h-8 w-8 text-purple-200" />
              <div className="text-right">
                <div className="text-3xl font-bold">{overallStats.avgConversion.toFixed(1)}%</div>
                <div className="text-purple-200 text-sm">Avg Conversion</div>
              </div>
            </div>
            <div className="text-purple-200 text-sm">
              Team average
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <FunnelIcon className="h-8 w-8 text-orange-200" />
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {overallStats.statusBreakdown.find(s => s.bucket === 'P3')?.count || 0}
                </div>
                <div className="text-orange-200 text-sm">Closed Won</div>
              </div>
            </div>
            <div className="text-orange-200 text-sm">
              Total closed deals
            </div>
          </div>
        </div>
      )}

      {viewMode === 'overview' && overallStats && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">Pipeline Distribution by Stage</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
              {overallStats.stageBreakdown.map((stage) => (
                <div 
                  key={stage.id} 
                  className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: stage.color }}
                      ></div>
                      <h4 className="font-semibold text-gray-900 text-sm">{stage.name}</h4>
                    </div>
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {stage.probability}%
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-gray-900">{stage.count}</span>
                      <span className="text-sm text-gray-500">Leads</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-green-600">{formatCurrency(stage.value)}</span>
                      <span className="text-sm text-gray-500">Value</span>
                    </div>
                  </div>

                  {stage.count === 0 && (
                    <div className="mt-4 text-center text-gray-400 text-xs italic">
                      No leads in this stage
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Status Bucket Distribution</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {overallStats.statusBreakdown.map((bucket) => (
                  <div 
                    key={bucket.bucket} 
                    className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: getBucketColor(bucket.bucket) }}
                        ></div>
                        <h4 className="font-semibold text-gray-900 text-sm">{getBucketDisplayName(bucket.bucket)}</h4>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold text-gray-900">{bucket.count}</span>
                        <span className="text-sm text-gray-500">Leads</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-green-600">{formatCurrency(bucket.value)}</span>
                        <span className="text-sm text-gray-500">Value</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {(viewMode === 'detailed' && !isAgent) && (
        <div className="space-y-6">
          {statsData.map((userStats) => (
            <div key={userStats.userId} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-4 border-b border-gray-200 cursor-pointer hover:from-indigo-100 hover:to-blue-100 transition-colors"
                onClick={() => toggleUserExpansion(userStats.userId)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {userStats.userName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{userStats.userName}</h3>
                      <div className="flex items-center space-x-2">
                        <p className="text-gray-600 text-sm">{userStats.userEmail}</p>
                        {userStats.userId === profile.id && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            You
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{userStats.totalLeads}</div>
                      <div className="text-sm text-gray-600">Total Leads</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-600">{formatCurrency(userStats.totalValue)}</div>
                      <div className="text-sm text-gray-600">Pipeline Value</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{userStats.conversionRate.toFixed(1)}%</div>
                      <div className="text-sm text-gray-600">Conversion</div>
                    </div>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      {expandedUsers.has(userStats.userId) ? (
                        <ChevronUpIcon className="h-5 w-5 text-gray-600" />
                      ) : (
                        <ChevronDownIcon className="h-5 w-5 text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {expandedUsers.has(userStats.userId) && (
                <div className="p-6">
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <FunnelIcon className="h-5 w-5 mr-2 text-indigo-600" />
                      Pipeline Stages
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {userStats.stageBreakdown.map((stage) => (
                        <div 
                          key={stage.stageId} 
                          className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-4"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: stage.color }}
                              ></div>
                              <h5 className="font-medium text-gray-900 text-sm">{stage.stageName}</h5>
                            </div>
                            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                              {stage.probability}%
                            </span>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-xl font-bold text-gray-900">{stage.count}</span>
                              <span className="text-sm text-gray-500">Leads</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-lg font-bold text-green-600">{formatCurrency(stage.value)}</span>
                              <span className="text-sm text-gray-500">Value</span>
                            </div>
                          </div>

                          {stage.count === 0 ? (
                            <div className="mt-3 text-center text-gray-400 text-xs italic">
                              No leads in this stage
                            </div>
                          ) : (
                            <div className="mt-3 space-y-1">
                              {stage.leads.slice(0, 2).map((lead) => (
                                <div key={lead.id} className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">
                                  {lead.clients?.client_name || 'Unknown'} - {formatCurrency(lead.deal_value || 0)}
                                </div>
                              ))}
                              {stage.leads.length > 2 && (
                                <div className="text-xs text-gray-500 text-center">
                                  +{stage.leads.length - 2} more
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <TagIcon className="h-5 w-5 mr-2 text-purple-600" />
                      Status Buckets
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {userStats.statusBucketBreakdown.map((bucket) => (
                        <div 
                          key={bucket.bucket} 
                          className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-4"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: getBucketColor(bucket.bucket) }}
                              ></div>
                              <h5 className="font-medium text-gray-900 text-sm">{getBucketDisplayName(bucket.bucket)}</h5>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-xl font-bold text-gray-900">{bucket.count}</span>
                              <span className="text-sm text-gray-500">Leads</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-lg font-bold text-green-600">{formatCurrency(bucket.value)}</span>
                              <span className="text-sm text-gray-500">Value</span>
                            </div>
                          </div>

                          {bucket.count > 0 && (
                            <div className="mt-3 space-y-1">
                              {bucket.leads.slice(0, 2).map((lead) => (
                                <div key={lead.id} className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">
                                  {lead.clients?.client_name || 'Unknown'} - {formatCurrency(lead.deal_value || 0)}
                                </div>
                              ))}
                              {bucket.leads.length > 2 && (
                                <div className="text-xs text-gray-500 text-center">
                                  +{bucket.leads.length - 2} more
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {userStats.topIndustries.length > 0 && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <BuildingOfficeIcon className="h-4 w-4 mr-2" />
                          Top Industries
                        </h4>
                        <div className="space-y-3">
                          {userStats.topIndustries.slice(0, 5).map((industry, index) => (
                            <div key={industry.industry} className="bg-white rounded-lg p-3 border border-gray-200">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900 text-sm capitalize">{industry.industry}</div>
                                  <div className="text-xs text-gray-600 mt-1">
                                    {industry.count} leads • {formatCurrency(industry.value)}
                                  </div>
                                  <div className="text-xs text-blue-600 font-medium">
                                    {industry.percentage.toFixed(1)}% of portfolio
                                  </div>
                                </div>
                                <div className="ml-3 text-right">
                                  <div className="text-lg font-bold text-gray-900">#{index + 1}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <CalendarDaysIcon className="h-4 w-4 mr-2" />
                        Activity Summary
                      </h4>
                      <div className="space-y-3">
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-900">Recent Activity (7 days)</span>
                            <span className="text-xl font-bold text-blue-600">{userStats.recentActivity}</span>
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            Leads updated in the last week
                          </div>
                        </div>
                        
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-900">Average Deal Size</span>
                            <span className="text-lg font-bold text-green-600">{formatCurrency(userStats.avgDealValue)}</span>
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            Per lead value
                          </div>
                        </div>

                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-900">Conversion Rate</span>
                            <span className="text-lg font-bold text-purple-600">{userStats.conversionRate.toFixed(1)}%</span>
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            P3 closes from qualified leads
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isAgent && statsData.length > 0 && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <UserIcon className="h-5 w-5 mr-2 text-blue-600" />
                Your Lead Performance
              </h3>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FunnelIcon className="h-5 w-5 mr-2 text-indigo-600" />
                  Your Pipeline Stages
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {statsData[0]?.stageBreakdown.map((stage) => (
                    <div 
                      key={stage.stageId} 
                      className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: stage.color }}
                          ></div>
                          <h4 className="font-medium text-gray-900 text-sm">{stage.stageName}</h4>
                        </div>
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {stage.probability}%
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-xl font-bold text-gray-900">{stage.count}</span>
                          <span className="text-sm text-gray-500">Leads</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-lg font-bold text-green-600">{formatCurrency(stage.value)}</span>
                          <span className="text-sm text-gray-500">Value</span>
                        </div>
                      </div>

                      {stage.count === 0 ? (
                        <div className="mt-3 text-center text-gray-400 text-xs italic">
                          No leads in this stage
                        </div>
                      ) : (
                        <div className="mt-3 space-y-1">
                          {stage.leads.slice(0, 2).map((lead) => (
                            <div key={lead.id} className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">
                              {lead.clients?.client_name || 'Unknown'} - {formatCurrency(lead.deal_value || 0)}
                            </div>
                          ))}
                          {stage.leads.length > 2 && (
                            <div className="text-xs text-gray-500 text-center">
                              +{stage.leads.length - 2} more
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <TagIcon className="h-5 w-5 mr-2 text-purple-600" />
                  Your Status Buckets
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {statsData[0]?.statusBucketBreakdown.map((bucket) => (
                    <div 
                      key={bucket.bucket} 
                      className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getBucketColor(bucket.bucket) }}
                          ></div>
                          <h4 className="font-medium text-gray-900 text-sm">{getBucketDisplayName(bucket.bucket)}</h4>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-xl font-bold text-gray-900">{bucket.count}</span>
                          <span className="text-sm text-gray-500">Leads</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-lg font-bold text-green-600">{formatCurrency(bucket.value)}</span>
                          <span className="text-sm text-gray-500">Value</span>
                        </div>
                      </div>

                      {bucket.count > 0 && (
                        <div className="mt-3 space-y-1">
                          {bucket.leads.slice(0, 2).map((lead) => (
                            <div key={lead.id} className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">
                              {lead.clients?.client_name || 'Unknown'} - {formatCurrency(lead.deal_value || 0)}
                            </div>
                          ))}
                          {bucket.leads.length > 2 && (
                            <div className="text-xs text-gray-500 text-center">
                              +{bucket.leads.length - 2} more
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {statsData[0]?.topIndustries.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <BuildingOfficeIcon className="h-4 w-4 mr-2" />
                      Your Industry Focus
                    </h4>
                    <div className="space-y-3">
                      {statsData[0].topIndustries.slice(0, 5).map((industry, index) => (
                        <div key={industry.industry} className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 text-sm capitalize">{industry.industry}</div>
                              <div className="text-xs text-gray-600 mt-1">
                                {industry.count} leads • {formatCurrency(industry.value)}
                              </div>
                              <div className="text-xs text-blue-600 font-medium">
                                {industry.percentage.toFixed(1)}% of your portfolio
                              </div>
                            </div>
                            <div className="ml-3 text-right">
                              <div className="text-lg font-bold text-gray-900">#{index + 1}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <CalendarDaysIcon className="h-4 w-4 mr-2" />
                    Your Performance Summary
                  </h4>
                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-900">Recent Activity (7 days)</span>
                        <span className="text-xl font-bold text-blue-600">{statsData[0]?.recentActivity}</span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Leads you've updated this week
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-900">Your Average Deal Size</span>
                        <span className="text-lg font-bold text-green-600">{formatCurrency(statsData[0]?.avgDealValue || 0)}</span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Per lead value
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-900">Your Conversion Rate</span>
                        <span className="text-lg font-bold text-purple-600">{statsData[0]?.conversionRate.toFixed(1) || 0}%</span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        P3 closes from qualified leads
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!leadsLoading && !usersLoading && !stagesLoading && (!statsData.length || !overallStats) && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-12 text-center">
            <ExclamationTriangleIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Data Available</h3>
            <p className="text-gray-600 mb-4">
              {isAgent ? "You don't have any leads assigned yet." :
               isManager ? "No leads found for you or your team." :
               "No leads found in the system."}
            </p>
            <p className="text-sm text-gray-500">
              Contact your administrator or start adding leads to see statistics here.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};