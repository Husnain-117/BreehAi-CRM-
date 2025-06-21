// src/components/leads/LeadTableColumns.tsx
import React, { useState } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { 
  ChevronUpIcon, 
  ChevronDownIcon, 
  ChevronUpDownIcon
} from '@heroicons/react/20/solid';
import { Lead, UserProfile } from '@/types';
import { INDUSTRY_OPTIONS } from '@/types/leadSchema';
import { RowActionsMenu } from './RowActionsMenu';
import { SelectField } from '@/components/ui/SelectField';
import { useUpdateLeadAgentMutation } from '@/hooks/mutations/useUpdateLeadAgentMutation';
import { 
  FilterButton, 
  TextColumnFilterPanel, 
  StatusColumnFilterPanel, 
  IndustryColumnFilterPanel,
  TagsColumnFilterPanel,
  DealValueRangeFilterPanel
} from './LeadTableFilters';

const columnHelper = createColumnHelper<Lead>();

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
};

const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return 'N/A';
  return `$${value.toLocaleString()}`;
};

export const getColumns = (
  onViewDetailsClick: (lead: Lead) => void,
  allLeadsForTagFilter: Lead[],
  onScheduleFollowUpClick: (lead: Lead) => void,
  onScheduleMeetingClick: (lead: Lead) => void,
  agents: UserProfile[],
  updateAgentMutation: ReturnType<typeof useUpdateLeadAgentMutation>
) => [
  // Selection Column
  columnHelper.display({
    id: 'select',
    header: ({ table }) => {
      const indeterminateCheckboxRef = React.useRef<HTMLInputElement>(null!);

      React.useEffect(() => {
        if (typeof indeterminateCheckboxRef.current?.indeterminate === 'boolean') {
          indeterminateCheckboxRef.current.indeterminate = table.getIsSomeRowsSelected();
        }
      }, [table.getIsSomeRowsSelected()]);

      return (
        <input
          type="checkbox"
          ref={indeterminateCheckboxRef}
          className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
          aria-label="Select all rows"
        />
      );
    },
    cell: ({ row }) => (
      <div className="px-1">
        <input
          type="checkbox"
          className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          onChange={row.getToggleSelectedHandler()}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Select row ${row.index}`}
        />
      </div>
    ),
    enableSorting: false,
    enableColumnFilter: false,
  }),

  // Client Name Column
  columnHelper.accessor(row => row.clients?.client_name, {
    id: 'client_name',
    header: ({ column }) => (
      <div className="flex items-center">
        Client Name
        <FilterButton 
          column={column} 
          title="Client Name"
          renderPanel={() => <TextColumnFilterPanel column={column} />}
        />
      </div>
    ),
    cell: info => info.getValue() || 'N/A',
    enableSorting: true,
    enableColumnFilter: true,
  }),

  // Company Name Column
  columnHelper.accessor(row => row.clients?.company, {
    id: 'company_name',
    header: ({ column }) => (
      <div className="flex items-center">
        Company Name
        <FilterButton 
          column={column} 
          title="Company Name"
          renderPanel={() => <TextColumnFilterPanel column={column} />}
        />
      </div>
    ),
    cell: info => info.getValue() || 'N/A',
    enableSorting: true,
    enableColumnFilter: true,
  }),

  // Status Column
  columnHelper.accessor('status_bucket', {
    header: ({ column }) => (
      <div className="flex items-center">
        Status
        <FilterButton 
          column={column} 
          title="Status"
          renderPanel={() => <StatusColumnFilterPanel column={column} />}
        />
      </div>
    ),
    cell: info => {
      const status = info.getValue();
      let statusColorClasses = 'bg-gray-100 text-gray-800';
      if (status === 'P1') {
        statusColorClasses = 'bg-amber-100 text-amber-800';
      } else if (status === 'P2') {
        statusColorClasses = 'bg-sky-100 text-sky-800';
      } else if (status === 'P3') {
        statusColorClasses = 'bg-emerald-100 text-emerald-800';
      }
      return (
        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusColorClasses} ring-opacity-20 ${status === 'P1' ? 'ring-amber-700/10' : status === 'P2' ? 'ring-sky-700/10' : status === 'P3' ? 'ring-emerald-600/20' : 'ring-gray-600/20'}`}>
          {status || 'N/A'}
        </span>
      );
    },
    enableSorting: true,
    enableColumnFilter: true,
    filterFn: (row, columnId, filterValue) => {
      if (!filterValue || (Array.isArray(filterValue) && filterValue.length === 0)) {
        return true;
      }
      if (Array.isArray(filterValue)) {
        return filterValue.includes(row.getValue(columnId));
      }
      return true;
    },
  }),

  // Assigned Agent Column
  columnHelper.accessor(row => row.users?.full_name, {
    id: 'assigned_agent',
    header: ({ column }) => (
      <div className="flex items-center whitespace-nowrap">
        Assigned Agent
        <button onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="ml-1 p-0.5 rounded hover:bg-muted/30">
          {column.getIsSorted() === 'desc' ? <ChevronDownIcon className="h-3.5 w-3.5" /> : column.getIsSorted() === 'asc' ? <ChevronUpIcon className="h-3.5 w-3.5" /> : <ChevronUpDownIcon className="h-3.5 w-3.5 opacity-30" />}
        </button>
        <FilterButton column={column} title="Assigned Agent" renderPanel={() => <TextColumnFilterPanel column={column} />} />
      </div>
    ),
    cell: ({ row }: { row: { original: Lead } }) => {
      const lead = row.original;
      const [isEditingAgent, setIsEditingAgent] = useState(false);
      const [selectedAgentId, setSelectedAgentId] = useState<string | null>(lead.agent_id || null);

      const handleAgentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newAgentId = e.target.value === 'unassigned' ? null : e.target.value;
        setSelectedAgentId(newAgentId);
        updateAgentMutation.mutate({ leadId: lead.id, agentId: newAgentId }, {
          onSuccess: () => {
            setIsEditingAgent(false);
          },
          onError: () => {
            setSelectedAgentId(lead.agent_id || null); 
          }
        });
      };

      if (isEditingAgent) {
        const agentOptions = [
          { value: 'unassigned', label: 'Unassigned' },
          ...agents.map(agent => ({ value: agent.id, label: agent.full_name || 'Unnamed Agent' }))
        ];
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <SelectField
              value={selectedAgentId || 'unassigned'}
              onChange={handleAgentChange}
              options={agentOptions}
              className="text-xs p-1 border rounded min-w-[150px]"
            />
          </div>
        );
      }

      return (
        <div 
          className="cursor-pointer hover:bg-slate-100 p-1 rounded" 
          onClick={(e) => { 
            e.stopPropagation(); 
            setIsEditingAgent(true); 
          }}
          title="Click to change agent"
        >
          {lead.users?.full_name || <span className="text-gray-400 italic">Unassigned</span>}
        </div>
      );
    },
    enableSorting: true,
    enableColumnFilter: true,
    filterFn: 'includesString',
    meta: { filterType: 'text' }
  }),

  // Lead Source Column
  columnHelper.accessor('lead_source', {
    header: () => 'Lead Source',
    cell: info => info.getValue() || 'N/A',
    enableSorting: true,
    enableColumnFilter: false,
  }),

  // Contact Person Column
  columnHelper.accessor('contact_person', {
    header: () => 'Contact Person',
    cell: info => info.getValue() || 'N/A',
    enableSorting: true,
    enableColumnFilter: false,
  }),

  // Email Column
  columnHelper.accessor('email', {
    header: () => 'Email',
    cell: info => info.getValue() || 'N/A',
    enableSorting: true,
    enableColumnFilter: false,
  }),

  // Phone Column
  columnHelper.accessor('phone', {
    header: () => 'Phone',
    cell: info => info.getValue() || 'N/A',
    enableSorting: false,
    enableColumnFilter: false,
  }),

  // Deal Value Column
  columnHelper.accessor('deal_value', { 
    header: ({ column }) => (
      <div className="flex items-center justify-between w-full">
        <span className="text-right grow">Deal Value</span>
        <FilterButton 
          column={column} 
          title="Deal Value"
          renderPanel={() => <DealValueRangeFilterPanel column={column} />}
        />
      </div>
    ),
    cell: info => <div className="text-right">{formatCurrency(info.getValue())}</div>, 
    enableSorting: true, 
    enableColumnFilter: true,
    filterFn: (row, columnId, filterValue: [number | undefined, number | undefined]) => {
      if (!filterValue) return true;
      const [min, max] = filterValue;
      const rowValue = row.getValue(columnId) as number | null | undefined;
      if (rowValue === null || rowValue === undefined) return false;

      if (min !== undefined && max !== undefined) {
        return rowValue >= min && rowValue <= max;
      }
      if (min !== undefined) {
        return rowValue >= min;
      }
      if (max !== undefined) {
        return rowValue <= max;
      }
      return true;
    },
  }),

  // Company Size Column
  columnHelper.accessor(row => row.clients?.company_size, {
    id: 'company_size',
    header: () => 'Company Size',
    cell: info => info.getValue()?.toLocaleString() || 'N/A',
    enableSorting: true,
    enableColumnFilter: false,
  }),

  // Industry Column
  columnHelper.accessor('industry', {
    header: ({ column }) => (
      <div className="flex items-center">
        Industry
        <FilterButton 
          column={column} 
          title="Industry"
          renderPanel={() => <IndustryColumnFilterPanel column={column} />}
        />
      </div>
    ),
    cell: info => {
      const industry = info.getValue();
      if (!industry) return 'N/A';
      
      const industryOption = INDUSTRY_OPTIONS.find(opt => opt.value === industry);
      const displayName = industryOption?.label || industry;
      
      // Color coding for industries
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
      
      return (
        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ring-opacity-20 ${getIndustryColor(industry)}`}>
          {displayName}
        </span>
      );
    },
    enableSorting: true,
    enableColumnFilter: true,
    filterFn: (row, columnId, filterValue) => {
      if (!filterValue || (Array.isArray(filterValue) && filterValue.length === 0)) {
        return true;
      }
      if (Array.isArray(filterValue)) {
        return filterValue.includes(row.getValue(columnId));
      }
      return true;
    },
  }),

  // Tags Column
  columnHelper.accessor('tags', { 
    header: ({ column }) => (
        <div className="flex items-center">
          Tags
          <FilterButton 
            column={column} 
            title="Tags"
            renderPanel={() => <TagsColumnFilterPanel column={column} allLeads={allLeadsForTagFilter} />}
          />
        </div>
    ),
    cell: info => {
      const tags = info.getValue();
      if (!tags || tags.length === 0) return 'N/A';
      return (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag, index) => {
            let hue = (tag.charCodeAt(0) || 65) % 360;
            if (tag.length > 1) hue = (hue + (tag.charCodeAt(1) || 0)) % 360;
            return (
              <span key={index} className="px-2 py-0.5 text-xs rounded-full" style={{ backgroundColor: `hsl(${hue}, 70%, 85%)`, color: `hsl(${hue}, 70%, 25%)` }}>
                {tag}
              </span>
            );
          })}
        </div>
      );
    },
    enableSorting: false,
    enableColumnFilter: true,
    filterFn: (row, columnId, filterValue: string[]) => {
      if (!filterValue || filterValue.length === 0) return true;
      const rowTags = row.getValue(columnId) as string[] | undefined;
      if (!rowTags || rowTags.length === 0) return false;
      return filterValue.some(filterTag => rowTags.includes(filterTag));
    },
  }),

  // Next Step Column
  columnHelper.accessor('next_step', {
    header: () => 'Next Step',
    cell: info => info.getValue() || 'N/A',
    enableSorting: true,
    enableColumnFilter: false,
  }),

  // Follow-Up Due Date Column
  columnHelper.accessor('follow_up_due_date', {
    header: () => 'Follow-Up Due',
    cell: info => formatDate(info.getValue()),
    enableSorting: true,
    enableColumnFilter: false,
  }),

  // Created At Column
  columnHelper.accessor('created_at', {
    header: () => 'Created At',
    cell: info => formatDate(info.getValue()),
    enableSorting: true,
    enableColumnFilter: false,
  }),

  // Updated At Column
  columnHelper.accessor('updated_at', {
    header: () => 'Updated At',
    cell: info => formatDate(info.getValue()),
    enableSorting: true,
    enableColumnFilter: false,
  }),

  // Actions Column
  columnHelper.display({
    id: 'actions',
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => (
      <RowActionsMenu 
        lead={row.original} 
        onViewDetails={() => onViewDetailsClick(row.original)}
        onScheduleFollowUp={() => onScheduleFollowUpClick(row.original)}
        onScheduleMeeting={() => onScheduleMeetingClick(row.original)}
      />
    ),
    enableSorting: false,
    enableColumnFilter: false,
  }),
];