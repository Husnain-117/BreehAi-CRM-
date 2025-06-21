// src/components/leads/LeadsStats.tsx - Comprehensive Lead Statistics Dashboard
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
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
  ChevronUpIcon
} from '@heroicons/react/20/solid';

// Pipeline stages configuration
const PIPELINE_STAGES = [
  { id: 'new-lead', name: 'New Lead', probability: 5, color: '#ef4444' },
  { id: 'qualified', name: 'Qualified', probability: 15, color: '#f97316' },
  { id: 'contact-made', name: 'Contact Made', probability: 25, color: '#eab308' },
  { id: 'needs-analysis', name: 'Needs Analysis', probability: 40, color: '#3b82f6' },
  { id: 'proposal-sent', name: 'Proposal Sent', probability: 60, color: '#8b5cf6' },
  { id: 'negotiation', name: 'Negotiation', probability: 80, color: '#06b6d4' },
  { id: 'closed-won', name: 'Closed Won', probability: 100, color: '#10b981' },
  { id: 'closed-lost', name: 'Closed Lost', probability: 0, color: '#6b7280' }
];

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
}

interface StageStats {
  stageId: string;
  stageName: string;
  probability: number;
  color: string;
  count: number;
  value: number;
  leads: Lead[];
}

interface IndustryStats {
  industry: string;
  count: number;
  value: number;
  percentage: number;
}

export const LeadsStats: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');

  // Fetch all leads with related data
  const { data: leadsData = [], isLoading: leadsLoading } = useQuery({
    queryKey: ['leads-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          clients (*),
          users (*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Lead[];
    }
  });

  // Fetch all users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['users-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('full_name');
      
      if (error) throw error;
      return data as UserProfile[];
    }
  });

  // Calculate comprehensive stats
  const statsData = useMemo(() => {
    if (!leadsData.length || !users.length) return [];

    return users.map(user => {
      const userLeads = leadsData.filter(lead => lead.agent_id === user.id);
      const totalValue = userLeads.reduce((sum, lead) => sum + (lead.deal_value || 0), 0);
      const closedWonLeads = userLeads.filter(lead => lead.status_bucket === 'P3' || lead.qualification_status === 'opportunity');
      const conversionRate = userLeads.length > 0 ? (closedWonLeads.length / userLeads.length) * 100 : 0;

      // Map leads to pipeline stages based on various criteria
      const stageBreakdown = PIPELINE_STAGES.map(stage => {
        let stageLeads: Lead[] = [];
        
        switch (stage.id) {
          case 'new-lead':
            stageLeads = userLeads.filter(lead => 
              lead.qualification_status === 'unqualified' || !lead.qualification_status
            );
            break;
          case 'qualified':
            stageLeads = userLeads.filter(lead => 
              lead.qualification_status === 'marketing_qualified'
            );
            break;
          case 'contact-made':
            stageLeads = userLeads.filter(lead => 
              lead.qualification_status === 'sales_qualified'
            );
            break;
          case 'needs-analysis':
            stageLeads = userLeads.filter(lead => 
              lead.status_bucket === 'P2' && lead.qualification_status !== 'opportunity'
            );
            break;
          case 'proposal-sent':
            stageLeads = userLeads.filter(lead => 
              lead.status_bucket === 'P1' && lead.qualification_status !== 'opportunity'
            );
            break;
          case 'negotiation':
            stageLeads = userLeads.filter(lead => 
              lead.qualification_status === 'opportunity' && lead.status_bucket !== 'P3'
            );
            break;
          case 'closed-won':
            stageLeads = userLeads.filter(lead => 
              lead.status_bucket === 'P3' && lead.qualification_status === 'opportunity'
            );
            break;
          case 'closed-lost':
            stageLeads = userLeads.filter(lead => 
              lead.lost_reason !== null && lead.lost_reason !== ''
            );
            break;
          default:
            stageLeads = [];
        }

        const stageValue = stageLeads.reduce((sum, lead) => sum + (lead.deal_value || 0), 0);

        return {
          stageId: stage.id,
          stageName: stage.name,
          probability: stage.probability,
          color: stage.color,
          count: stageLeads.length,
          value: stageValue,
          leads: stageLeads
        };
      });

      // Calculate industry breakdown
      const industryMap = new Map<string, { count: number; value: number }>();
      userLeads.forEach(lead => {
        const industry = lead.industry || 'Unknown';
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

      return {
        userId: user.id,
        userName: user.full_name || 'Unknown User',
        userEmail: user.email || '',
        totalLeads: userLeads.length,
        totalValue,
        avgDealValue: userLeads.length > 0 ? totalValue / userLeads.length : 0,
        conversionRate,
        stageBreakdown,
        recentActivity: userLeads.filter(lead => {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return new Date(lead.updated_at) > weekAgo;
        }).length,
        topIndustries
      };
    });
  }, [leadsData, users]);

  // Calculate overall stats
  const overallStats = useMemo(() => {
    if (!statsData.length) return null;

    const totalLeads = statsData.reduce((sum, user) => sum + user.totalLeads, 0);
    const totalValue = statsData.reduce((sum, user) => sum + user.totalValue, 0);
    const avgConversion = statsData.reduce((sum, user) => sum + user.conversionRate, 0) / statsData.length;

    const combinedStageBreakdown = PIPELINE_STAGES.map(stage => {
      const stageData = statsData.reduce((acc, user) => {
        const userStage = user.stageBreakdown.find(s => s.stageId === stage.id);
        return {
          count: acc.count + (userStage?.count || 0),
          value: acc.value + (userStage?.value || 0)
        };
      }, { count: 0, value: 0 });

      return {
        ...stage,
        count: stageData.count,
        value: stageData.value
      };
    });

    return {
      totalLeads,
      totalValue,
      avgDealValue: totalLeads > 0 ? totalValue / totalLeads : 0,
      avgConversion,
      activeUsers: statsData.filter(user => user.totalLeads > 0).length,
      stageBreakdown: combinedStageBreakdown
    };
  }, [statsData]);

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

  if (leadsLoading || usersLoading) {
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
              <h1 className="text-3xl font-bold text-white">Lead Statistics Dashboard</h1>
              <p className="text-indigo-200 mt-2">Track lead distribution and performance across your team</p>
            </div>
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
          </div>
        </div>
      </div>

      {/* Overall Statistics */}
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
                  {overallStats.stageBreakdown.find(s => s.id === 'closed-won')?.count || 0}
                </div>
                <div className="text-orange-200 text-sm">Closed Won</div>
              </div>
            </div>
            <div className="text-orange-200 text-sm">
              This month
            </div>
          </div>
        </div>
      )}

      {/* Pipeline Overview */}
      {viewMode === 'overview' && overallStats && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">Overall Pipeline Distribution</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
          </div>
        </div>
      )}

      {/* User-by-User Breakdown */}
      {viewMode === 'detailed' && (
        <div className="space-y-6">
          {statsData.map((userStats) => (
            <div key={userStats.userId} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              {/* User Header */}
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
                      <p className="text-gray-600 text-sm">{userStats.userEmail}</p>
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

              {/* Expanded User Details */}
              {expandedUsers.has(userStats.userId) && (
                <div className="p-6">
                  {/* User Pipeline Stages */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

                  {/* Industry Breakdown */}
                  {userStats.topIndustries.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <BuildingOfficeIcon className="h-4 w-4 mr-2" />
                        Top Industries
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {userStats.topIndustries.slice(0, 3).map((industry, index) => (
                          <div key={industry.industry} className="bg-white rounded-lg p-3 border border-gray-200">
                            <div className="font-medium text-gray-900 text-sm capitalize">{industry.industry}</div>
                            <div className="text-xs text-gray-600 mt-1">
                              {industry.count} leads • {formatCurrency(industry.value)}
                            </div>
                            <div className="text-xs text-blue-600 font-medium">
                              {industry.percentage.toFixed(1)}% of portfolio
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};