// src/components/leads/LeadDrawer.tsx - COMPLETE REPLACEMENT FILE
import React, { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { 
  ClockIcon,
  ChartBarIcon,
  SparklesIcon,
  Cog6ToothIcon,
  BuildingOfficeIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CurrencyDollarIcon,
  TagIcon,
  CalendarDaysIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  BellIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/20/solid';
import { Lead } from '../../types';
import { INDUSTRY_OPTIONS } from '../../types/leadSchema';
import { LeadActivityTimeline } from './LeadActivityTimeline';
import { LeadScoring } from './LeadScoring';
import { LeadNurturing } from './LeadNurturing';

interface LeadDrawerProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
}

export const LeadDrawer: React.FC<LeadDrawerProps> = ({ lead, isOpen, onClose }) => {
  const [selectedTab, setSelectedTab] = useState(0);

  if (!lead) return null;

  // Get industry display name
  const getIndustryDisplay = (industry: string | null) => {
    if (!industry) return 'Not specified';
    const industryOption = INDUSTRY_OPTIONS.find(opt => opt.value === industry);
    return industryOption?.label || industry;
  };

  // Get priority color and icon
  const getPriorityDisplay = (status: string) => {
    switch (status) {
      case 'P1': return { 
        color: 'bg-red-500', 
        textColor: 'text-red-800', 
        bgColor: 'bg-red-50', 
        label: 'High Priority',
        icon: '🔥'
      };
      case 'P2': return { 
        color: 'bg-yellow-500', 
        textColor: 'text-yellow-800', 
        bgColor: 'bg-yellow-50', 
        label: 'Medium Priority',
        icon: '⚡'
      };
      case 'P3': return { 
        color: 'bg-green-500', 
        textColor: 'text-green-800', 
        bgColor: 'bg-green-50', 
        label: 'Low Priority',
        icon: '✅'
      };
      default: return { 
        color: 'bg-gray-500', 
        textColor: 'text-gray-800', 
        bgColor: 'bg-gray-50', 
        label: 'Unknown',
        icon: '❓'
      };
    }
  };

  // Get qualification status display
  const getQualificationDisplay = (status: string | null) => {
    switch (status) {
      case 'opportunity': return { 
        color: 'bg-green-100 text-green-800 border-green-200', 
        label: 'Opportunity',
        icon: '🎯'
      };
      case 'sales_qualified': return { 
        color: 'bg-blue-100 text-blue-800 border-blue-200', 
        label: 'Sales Qualified',
        icon: '💼'
      };
      case 'marketing_qualified': return { 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
        label: 'Marketing Qualified',
        icon: '📈'
      };
      default: return { 
        color: 'bg-gray-100 text-gray-800 border-gray-200', 
        label: 'Unqualified',
        icon: '⏳'
      };
    }
  };

  const priorityInfo = getPriorityDisplay(lead.status_bucket);
  const qualificationInfo = getQualificationDisplay(lead.qualification_status);

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[9999]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-5xl">
                  <div className="flex h-full flex-col bg-white shadow-2xl">
                    {/* Enhanced Header with Gradient */}
                    <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 px-8 py-8">
                      {/* Background Pattern */}
                      <div className="absolute inset-0 bg-black bg-opacity-10"></div>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent"></div>
                      
                      <div className="relative flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-4 mb-4">
                            <div className="relative">
                              <div className="w-16 h-16 bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl border border-white/20">
                                <span className="text-white font-bold text-2xl">
                                  {lead.clients?.client_name?.charAt(0)?.toUpperCase() || 'L'}
                                </span>
                              </div>
                              {/* Lead Score Badge */}
                              {lead.lead_score && lead.lead_score > 0 && (
                                <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg">
                                  {lead.lead_score}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <Dialog.Title className="text-2xl font-bold text-white mb-1">
                                {lead.clients?.client_name || 'Unknown Client'}
                              </Dialog.Title>
                              <div className="flex items-center space-x-4 text-white/90">
                                <div className="flex items-center">
                                  <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                                  <span className="text-sm">{lead.clients?.company || 'No Company'}</span>
                                </div>
                                {lead.industry && (
                                  <div className="flex items-center">
                                    <TagIcon className="h-4 w-4 mr-1" />
                                    <span className="text-sm">{getIndustryDisplay(lead.industry)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Status Row */}
                          <div className="flex flex-wrap items-center gap-3">
                            {/* Deal Value */}
                            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                              <div className="flex items-center space-x-2">
                                <CurrencyDollarIcon className="h-5 w-5 text-green-300" />
                                <span className="text-white font-bold text-lg">
                                  ${lead.deal_value?.toLocaleString() || '0'}
                                </span>
                              </div>
                              <div className="text-white/70 text-xs">Deal Value</div>
                            </div>
                            
                            {/* Priority */}
                            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                              <div className="flex items-center space-x-2">
                                <div className={`w-3 h-3 rounded-full ${priorityInfo.color}`}></div>
                                <span className="text-white font-medium">
                                  {priorityInfo.icon} {priorityInfo.label}
                                </span>
                              </div>
                              <div className="text-white/70 text-xs">Priority Level</div>
                            </div>
                            
                            {/* Qualification */}
                            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                              <div className="flex items-center space-x-2">
                                <span className="text-white font-medium">
                                  {qualificationInfo.icon} {qualificationInfo.label}
                                </span>
                              </div>
                              <div className="text-white/70 text-xs">Qualification</div>
                            </div>
                            
                            {/* Lead Score */}
                            {lead.lead_score !== undefined && (
                              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                                <div className="flex items-center space-x-2">
                                  <StarIcon className="h-4 w-4 text-yellow-300" />
                                  <span className="text-white font-bold">{lead.lead_score}</span>
                                </div>
                                <div className="text-white/70 text-xs">Lead Score</div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <button
                          type="button"
                          className="ml-4 rounded-xl bg-white bg-opacity-20 p-3 text-white hover:bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-white transition-all duration-200 backdrop-blur-sm border border-white/20"
                          onClick={onClose}
                        >
                          <XMarkIcon className="h-6 w-6" />
                        </button>
                      </div>
                    </div>

                    {/* Enhanced Tab Navigation */}
                    <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
                      <nav className="flex space-x-8 px-8" aria-label="Tabs">
                        {[
                          { name: 'Overview', icon: ChartBarIcon, color: 'text-blue-600' },
                          { name: 'Activity Timeline', icon: ClockIcon, color: 'text-green-600' },
                          { name: 'Lead Scoring', icon: SparklesIcon, color: 'text-purple-600' },
                          { name: 'Nurturing', icon: Cog6ToothIcon, color: 'text-orange-600' }
                        ].map((tab, index) => (
                          <button
                            key={tab.name}
                            onClick={() => setSelectedTab(index)}
                            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                              selectedTab === index
                                ? `border-indigo-500 ${tab.color}`
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            <tab.icon className="h-5 w-5" />
                            <span>{tab.name}</span>
                            {selectedTab === index && (
                              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                            )}
                          </button>
                        ))}
                      </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-y-auto bg-gray-50">
                      <div className="p-8">
                        {selectedTab === 0 && <EnhancedLeadOverview lead={lead} />}
                        {selectedTab === 1 && <LeadActivityTimeline lead={lead} />}
                        {selectedTab === 2 && <LeadScoring lead={lead} />}
                        {selectedTab === 3 && <LeadNurturing lead={lead} />}
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

// Enhanced Lead Overview Component
const EnhancedLeadOverview: React.FC<{ lead: Lead }> = ({ lead }) => {
  const getIndustryDisplay = (industry: string | null) => {
    if (!industry) return 'Not specified';
    const industryOption = INDUSTRY_OPTIONS.find(opt => opt.value === industry);
    return industryOption?.label || industry;
  };

  const getIndustryStyle = (industry: string | null) => {
    if (!industry) return 'bg-gray-100 text-gray-800 border-gray-200';
    
    const colorMap: Record<string, string> = {
      'technology': 'bg-blue-100 text-blue-800 border-blue-200',
      'healthcare': 'bg-green-100 text-green-800 border-green-200',
      'finance': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'retail': 'bg-purple-100 text-purple-800 border-purple-200',
      'manufacturing': 'bg-gray-100 text-gray-800 border-gray-200',
      'education': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'real-estate': 'bg-orange-100 text-orange-800 border-orange-200',
      'consulting': 'bg-teal-100 text-teal-800 border-teal-200',
      'media': 'bg-pink-100 text-pink-800 border-pink-200',
      'transportation': 'bg-cyan-100 text-cyan-800 border-cyan-200',
      'energy': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'agriculture': 'bg-lime-100 text-lime-800 border-lime-200',
      'construction': 'bg-amber-100 text-amber-800 border-amber-200',
      'hospitality': 'bg-rose-100 text-rose-800 border-rose-200',
      'legal': 'bg-violet-100 text-violet-800 border-violet-200',
      'nonprofit': 'bg-slate-100 text-slate-800 border-slate-200',
      'government': 'bg-stone-100 text-stone-800 border-stone-200',
    };
    return colorMap[industry] || 'bg-slate-100 text-slate-800 border-slate-200';
  };

  return (
    <div className="space-y-8">
      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white bg-opacity-10 rounded-full"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <SparklesIcon className="h-8 w-8 text-blue-200" />
              <div className="text-3xl font-bold">{lead.lead_score || 0}</div>
            </div>
            <div className="text-blue-100 text-sm font-medium">Lead Score</div>
            <div className="text-blue-200 text-xs mt-1">
              {(lead.lead_score || 0) >= 80 ? 'Excellent' : 
               (lead.lead_score || 0) >= 50 ? 'Good' : 
               (lead.lead_score || 0) >= 25 ? 'Fair' : 'Needs Work'}
            </div>
          </div>
        </div>
        
        <div className="relative overflow-hidden bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white bg-opacity-10 rounded-full"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <CurrencyDollarIcon className="h-8 w-8 text-green-200" />
              <div className="text-2xl font-bold">
                ${lead.deal_value?.toLocaleString() || '0'}
              </div>
            </div>
            <div className="text-green-100 text-sm font-medium">Deal Value</div>
            <div className="text-green-200 text-xs mt-1">
              {lead.win_probability ? `${lead.win_probability}% probability` : 'No probability set'}
            </div>
          </div>
        </div>
        
        <div className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-xl ${
          lead.status_bucket === 'P1' ? 'bg-gradient-to-br from-red-500 to-red-600' :
          lead.status_bucket === 'P2' ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' :
          'bg-gradient-to-br from-green-500 to-green-600'
        }`}>
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white bg-opacity-10 rounded-full"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <ArrowTrendingUpIcon className="h-8 w-8 opacity-80" />
              <div className="text-2xl font-bold">{lead.status_bucket}</div>
            </div>
            <div className="opacity-90 text-sm font-medium">Priority Level</div>
            <div className="opacity-75 text-xs mt-1">
              {lead.status_bucket === 'P1' ? 'High Priority' :
               lead.status_bucket === 'P2' ? 'Medium Priority' : 'Low Priority'}
            </div>
          </div>
        </div>
        
        <div className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-xl ${
          lead.qualification_status === 'opportunity' ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
          lead.qualification_status === 'sales_qualified' ? 'bg-gradient-to-br from-indigo-500 to-indigo-600' :
          lead.qualification_status === 'marketing_qualified' ? 'bg-gradient-to-br from-orange-500 to-orange-600' :
          'bg-gradient-to-br from-gray-500 to-gray-600'
        }`}>
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white bg-opacity-10 rounded-full"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <CheckCircleIcon className="h-8 w-8 opacity-80" />
              <div className="text-sm font-bold capitalize">
                {lead.qualification_status?.replace('_', ' ') || 'Unqualified'}
              </div>
            </div>
            <div className="opacity-90 text-sm font-medium">Qualification</div>
            <div className="opacity-75 text-xs mt-1">Current status</div>
          </div>
        </div>
      </div>

      {/* Main Information Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Contact Information */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <UserIcon className="h-5 w-5 mr-2 text-blue-600" />
              Contact Information
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <UserIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Contact Person</div>
                  <div className="font-semibold text-gray-900">{lead.contact_person || 'Not specified'}</div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <EnvelopeIcon className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Email Address</div>
                  <div className="font-semibold text-gray-900">
                    {lead.email ? (
                      <a href={`mailto:${lead.email}`} className="text-blue-600 hover:text-blue-800 transition-colors">
                        {lead.email}
                      </a>
                    ) : 'Not provided'}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <PhoneIcon className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Phone Number</div>
                  <div className="font-semibold text-gray-900">
                    {lead.phone ? (
                      <a href={`tel:${lead.phone}`} className="text-blue-600 hover:text-blue-800 transition-colors">
                        {lead.phone}
                      </a>
                    ) : 'Not provided'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Company Information */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <BuildingOfficeIcon className="h-5 w-5 mr-2 text-green-600" />
              Company Details
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <BuildingOfficeIcon className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Company Name</div>
                  <div className="font-semibold text-gray-900">{lead.clients?.company || 'Not specified'}</div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <TagIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Industry</div>
                  <div className="flex items-center space-x-2">
                    {lead.industry ? (
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getIndustryStyle(lead.industry)}`}>
                        {getIndustryDisplay(lead.industry)}
                      </span>
                    ) : (
                      <span className="text-gray-900 font-semibold">Not specified</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                  <UserIcon className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Company Size</div>
                  <div className="font-semibold text-gray-900">
                    {lead.clients?.company_size ? `${lead.clients.company_size.toLocaleString()} employees` : 'Not specified'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lead Management Section */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2 text-purple-600" />
            Lead Management
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-sm text-gray-500 mb-1">Lead Source</div>
              <div className="font-semibold text-gray-900">{lead.lead_source || 'Not specified'}</div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-sm text-gray-500 mb-1">Assigned Agent</div>
              <div className="font-semibold text-gray-900">{lead.users?.full_name || 'Unassigned'}</div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-sm text-gray-500 mb-1">Win Probability</div>
              <div className="font-semibold text-gray-900">{lead.win_probability || 0}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline and Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Important Dates */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-orange-50 to-red-50 px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <CalendarDaysIcon className="h-5 w-5 mr-2 text-orange-600" />
              Important Dates
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-500">Follow-Up Due:</span>
              <span className="text-sm font-semibold text-gray-900">
                {lead.follow_up_due_date ? (
                  <span className="flex items-center">
                    <BellIcon className="h-4 w-4 mr-1 text-orange-500" />
                    {new Date(lead.follow_up_due_date).toLocaleDateString()}
                  </span>
                ) : (
                  <span className="text-gray-400 italic">Not scheduled</span>
                )}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-500">Expected Close:</span>
              <span className="text-sm font-semibold text-gray-900">
                {lead.expected_close_date ? (
                  <span className="flex items-center">
                    <CalendarDaysIcon className="h-4 w-4 mr-1 text-green-500" />
                    {new Date(lead.expected_close_date).toLocaleDateString()}
                  </span>
                ) : (
                  <span className="text-gray-400 italic">Not set</span>
                )}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-500">Created:</span>
              <span className="text-sm font-semibold text-gray-900">
                {new Date(lead.created_at).toLocaleDateString()}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-3">
              <span className="text-sm font-medium text-gray-500">Last Updated:</span>
              <span className="text-sm font-semibold text-gray-900">
                {new Date(lead.updated_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Tags and Notes */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <TagIcon className="h-5 w-5 mr-2 text-teal-600" />
              Tags & Notes
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <div className="text-sm font-medium text-gray-700 mb-3">Tags:</div>
              <div className="flex flex-wrap gap-2">
                {lead.tags && lead.tags.length > 0 ? (
                  lead.tags.map((tag, index) => {
                    let hue = (tag.charCodeAt(0) || 65) % 360;
                    return (
                      <span 
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-all hover:scale-105 cursor-pointer"
                        style={{ 
                          backgroundColor: `hsl(${hue}, 70%, 85%)`, 
                          color: `hsl(${hue}, 70%, 25%)` 
                        }}
                      >
                        #{tag}
                      </span>
                    );
                  })
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <TagIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <span className="text-sm italic">No tags assigned</span>
                  </div>
                )}
              </div>
            </div>
            
            {lead.notes && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Notes:</div>
                <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-400">
                  <p className="text-sm text-gray-700 leading-relaxed">{lead.notes}</p>
                </div>
              </div>
            )}
            
            {lead.next_step && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Next Step:</div>
                <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                  <p className="text-sm text-blue-700 leading-relaxed">{lead.next_step}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Section */}
      {(lead.progress_details || lead.lost_reason) && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <ArrowTrendingUpIcon className="h-5 w-5 mr-2 text-indigo-600" />
              Progress & Status
            </h3>
          </div>
          <div className="p-6 space-y-4">
            {lead.progress_details && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <InformationCircleIcon className="h-4 w-4 mr-1 text-blue-500" />
                  Progress Details:
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-sm text-blue-800 leading-relaxed">{lead.progress_details}</p>
                </div>
              </div>
            )}
            
            {lead.lost_reason && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <ExclamationTriangleIcon className="h-4 w-4 mr-1 text-red-500" />
                  Lost Reason:
                </div>
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <p className="text-sm text-red-800 leading-relaxed">{lead.lost_reason}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions Footer */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h4 className="font-semibold text-lg">Quick Actions</h4>
            <p className="text-indigo-200 text-sm">Manage this lead efficiently</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {lead.email && (
              <a
                href={`mailto:${lead.email}`}
                className="inline-flex items-center px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all duration-200 text-sm font-medium"
              >
                <EnvelopeIcon className="h-4 w-4 mr-2" />
                Send Email
              </a>
            )}
            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
                className="inline-flex items-center px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all duration-200 text-sm font-medium"
              >
                <PhoneIcon className="h-4 w-4 mr-2" />
                Call Now
              </a>
            )}
            <button className="inline-flex items-center px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all duration-200 text-sm font-medium">
              <CalendarDaysIcon className="h-4 w-4 mr-2" />
              Schedule Meeting
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};