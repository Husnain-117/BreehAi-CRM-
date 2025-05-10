import React, { useMemo, useState, useEffect } from 'react';
import {
  createColumnHelper,
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
  Column,
} from '@tanstack/react-table';
import { useLeadsQuery, useUsersQuery } from '../../hooks/queries';
import { Lead, UserProfile } from '../../types';
import { RowActionsMenu } from './RowActionsMenu';
import { ChevronUpIcon, ChevronDownIcon, ChevronUpDownIcon, ChevronLeftIcon, ChevronRightIcon, CalendarDaysIcon, BellAlertIcon, FunnelIcon } from '@heroicons/react/20/solid';
import Fuse from 'fuse.js';
import { Popover, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Button } from '../ui/button';
import { useUpdateLeadAgentMutation } from '../../hooks/mutations/useUpdateLeadAgentMutation';
import { SelectField } from '../ui/SelectField';

const columnHelper = createColumnHelper<Lead>();

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
};

const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return 'N/A';
  return `$${value.toLocaleString()}`;
};

interface LeadTableProps {
  onRowClick: (lead: Lead) => void;
  onScheduleFollowUp: (lead: Lead) => void;
  onScheduleMeeting: (lead: Lead) => void;
  onBulkScheduleFollowUps?: (selectedLeads: Lead[]) => void;
  onBulkScheduleMeetings?: (selectedLeads: Lead[]) => void;
}

interface TagsColumnFilterProps {
  column: any;
  allLeads: Lead[];
}
const TagsColumnFilter: React.FC<TagsColumnFilterProps> = ({ column, allLeads }) => {
  const filterValue = (column.getFilterValue() || []) as string[];
  
  const uniqueTags = useMemo(() => {
    const tagsSet = new Set<string>();
    allLeads.forEach(lead => {
      if (lead.tags) {
        lead.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet).sort();
  }, [allLeads]);

  const handleCheckboxChange = (tag: string, checked: boolean) => {
    const newFilter = checked ? [...filterValue, tag] : filterValue.filter(t => t !== tag);
    column.setFilterValue(newFilter.length > 0 ? newFilter : undefined);
  };

  if (uniqueTags.length === 0) return <div className="mt-1 p-1 text-xs text-gray-500">No tags found in data</div>;

  return (
    <div className="mt-1 p-1 space-y-1 max-h-32 overflow-y-auto">
      {uniqueTags.map(tag => (
        <label key={tag} className="flex items-center space-x-2 text-xs">
          <input type="checkbox" className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" checked={filterValue.includes(tag)} onChange={(e) => handleCheckboxChange(tag, e.target.checked)} onClick={(e) => e.stopPropagation()} />
          <span>{tag}</span>
        </label>
      ))}
      {filterValue.length > 0 && (<button onClick={(e) => { e.stopPropagation(); column.setFilterValue(undefined); }} className="text-xs text-indigo-600 hover:text-indigo-800 mt-1 w-full text-left"> Clear Tags Filter </button>)}
    </div>
  );
};

const DealValueRangeFilter: React.FC<{ column: any }> = ({ column }) => {
  const filterValue = (column.getFilterValue() || [undefined, undefined]) as [number | undefined, number | undefined];
  const [min, max] = filterValue;

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    column.setFilterValue((old: [number | undefined, number | undefined] = [undefined, undefined]) => [val ? parseInt(val, 10) : undefined, old[1]]);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    column.setFilterValue((old: [number | undefined, number | undefined] = [undefined, undefined]) => [old[0], val ? parseInt(val, 10) : undefined]);
  };
  
  const clearFilter = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    column.setFilterValue(undefined);
  }

  return (
    <div className="mt-1 p-1 space-y-1">
      <div className="flex space-x-1">
        <input 
          type="number"
          value={min ?? ''}
          onChange={handleMinChange}
          placeholder="Min value"
          onClick={(e) => e.stopPropagation()}
          className="p-1 text-xs border border-gray-300 rounded shadow-sm w-1/2"
        />
        <input 
          type="number"
          value={max ?? ''}
          onChange={handleMaxChange}
          placeholder="Max value"
          onClick={(e) => e.stopPropagation()}
          className="p-1 text-xs border border-gray-300 rounded shadow-sm w-1/2"
        />
      </div>
      {(min !== undefined || max !== undefined) && (
         <button 
            onClick={clearFilter}
            className="text-xs text-indigo-600 hover:text-indigo-800 mt-1 w-full text-left"
        >
            Clear Deal Value Filter
        </button>
      )}
    </div>
  );
};

interface FilterButtonProps {
  column: Column<Lead, unknown>;
  renderPanel: () => React.ReactNode;
  title: string;
}

const FilterButton: React.FC<FilterButtonProps> = ({ column, renderPanel, title }) => (
  <Popover className="relative inline-flex">
    <Popover.Button 
      className="ml-1 inline-flex items-center rounded-md bg-muted/20 px-1.5 py-0.5 text-xs font-medium text-muted-foreground hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 ring-1 ring-inset ring-transparent hover:ring-border"
      aria-label={`Open filter for ${title}`}
    >
      <FunnelIcon className="h-3 w-3" aria-hidden="true" />
    </Popover.Button>
    <Transition
      as={Fragment}
      enter="transition ease-out duration-200"
      enterFrom="opacity-0 translate-y-1"
      enterTo="opacity-100 translate-y-0"
      leave="transition ease-in duration-150"
      leaveFrom="opacity-100 translate-y-0"
      leaveTo="opacity-0 translate-y-1"
    >
      <Popover.Panel className="absolute z-20 mt-2 w-56 rounded-xl bg-popover text-popover-foreground shadow-xl ring-1 ring-border focus:outline-none">
        <div className="px-3 py-2">
            <h4 className="text-sm font-semibold text-popover-foreground mb-3 border-b border-border pb-2">Filter by {title}</h4>
            {renderPanel()}
        </div>
      </Popover.Panel>
    </Transition>
  </Popover>
);

interface TextColumnFilterPanelProps {
  column: Column<Lead, unknown>;
  onClose?: () => void;
}

const TextColumnFilterPanel: React.FC<TextColumnFilterPanelProps> = ({ column, onClose }) => {
  const [value, setValue] = useState(column.getFilterValue() as string || '');

  const handleApply = () => {
    column.setFilterValue(value || undefined);
    onClose?.();
  };

  const handleClear = () => {
    setValue('');
    column.setFilterValue(undefined);
    onClose?.();
  };

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={`Filter by ${column.id}...`}
        className="block w-full rounded-md border-input bg-background p-2 text-sm text-foreground shadow-sm focus:border-ring focus:ring-2 focus:ring-ring focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      />
      <div className="flex justify-end space-x-2 pt-2 border-t border-border">
        <Button 
          onClick={handleClear} 
          variant="ghost"
          size="sm"
        >
          Clear
        </Button>
        <Button 
          onClick={handleApply} 
          size="sm"
        >
          Apply
        </Button>
      </div>
    </div>
  );
};

interface StatusColumnFilterPanelProps {
  column: Column<Lead, unknown>;
  onClose?: () => void;
}

const StatusColumnFilterPanel: React.FC<StatusColumnFilterPanelProps> = ({ column, onClose }) => {
  const currentFilter = (column.getFilterValue() || []) as string[];
  const uniqueStatuses = ['P1', 'P2', 'P3']; 

  const handleCheckboxChange = (status: string, checked: boolean) => {
    const newFilter = checked 
      ? [...currentFilter, status] 
      : currentFilter.filter(s => s !== status);
    column.setFilterValue(newFilter.length > 0 ? newFilter : undefined);
  };

  const handleClear = () => {
    column.setFilterValue(undefined);
    onClose?.();
  };
  
  const handleApply = () => {
    onClose?.();
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        {uniqueStatuses.map(status => (
          <label key={status} className="flex items-center space-x-2 text-xs cursor-pointer">
            <input 
              type="checkbox" 
              className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500 focus:ring-offset-0"
              checked={currentFilter.includes(status)}
              onChange={(e) => handleCheckboxChange(status, e.target.checked)}
              onClick={(e) => e.stopPropagation()}
            />
            <span>{status}</span>
          </label>
        ))}
      </div>
      <div className="flex justify-end space-x-2 pt-2 border-t border-gray-200">
        <button 
            onClick={handleClear}
            className="rounded-md px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 ring-1 ring-inset ring-gray-300"
        >
            Clear
        </button>
        <button 
            onClick={handleApply} 
            className="rounded-md bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
            Apply
        </button>
      </div>
    </div>
  );
};

interface TagsColumnFilterPanelProps {
  column: Column<Lead, unknown>;
  allLeads: Lead[];
  onClose?: () => void;
}

const TagsColumnFilterPanel: React.FC<TagsColumnFilterPanelProps> = ({ column, allLeads, onClose }) => {
  const currentFilter = (column.getFilterValue() || []) as string[];
  
  const uniqueTags = useMemo(() => {
    const tagsSet = new Set<string>();
    allLeads.forEach(lead => {
      if (lead.tags) {
        lead.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet).sort();
  }, [allLeads]);

  const handleCheckboxChange = (tag: string, checked: boolean) => {
    const newFilter = checked ? [...currentFilter, tag] : currentFilter.filter(t => t !== tag);
    column.setFilterValue(newFilter.length > 0 ? newFilter : undefined);
  };

  const handleClear = () => {
    column.setFilterValue(undefined);
    onClose?.();
  };

  const handleApply = () => {
    onClose?.();
  };

  if (uniqueTags.length === 0) return <div className="p-1 text-xs text-gray-500 text-center">No tags found</div>;

  return (
    <div className="space-y-3">
      <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
        {uniqueTags.map(tag => (
          <label key={tag} className="flex items-center space-x-2 text-xs cursor-pointer">
            <input 
              type="checkbox" 
              className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500 focus:ring-offset-0"
              checked={currentFilter.includes(tag)} 
              onChange={(e) => handleCheckboxChange(tag, e.target.checked)} 
              onClick={(e) => e.stopPropagation()} 
            />
            <span>{tag}</span>
          </label>
        ))}
      </div>
      <div className="flex justify-end space-x-2 pt-2 border-t border-gray-200">
         <button 
            onClick={handleClear}
            className="rounded-md px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 ring-1 ring-inset ring-gray-300"
        >
            Clear
        </button>
        <button 
            onClick={handleApply} 
            className="rounded-md bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
            Apply
        </button>
      </div>
    </div>
  );
};

interface DealValueRangeFilterPanelProps {
  column: Column<Lead, unknown>;
  onClose?: () => void;
}

const DealValueRangeFilterPanel: React.FC<DealValueRangeFilterPanelProps> = ({ column, onClose }) => {
  const currentFilter = (column.getFilterValue() || [undefined, undefined]) as [number | undefined, number | undefined];
  const [min, setMin] = useState<number | undefined>(currentFilter[0]);
  const [max, setMax] = useState<number | undefined>(currentFilter[1]);

  useEffect(() => {
    const externalFilter = (column.getFilterValue() || [undefined, undefined]) as [number | undefined, number | undefined];
    setMin(externalFilter[0]);
    setMax(externalFilter[1]);
  }, [column.getFilterValue()]);

  const handleApply = () => {
    column.setFilterValue((old: [number | undefined, number | undefined] = [undefined, undefined]) => {
      const newMin = min === undefined || isNaN(min) ? undefined : Number(min);
      const newMax = max === undefined || isNaN(max) ? undefined : Number(max);
      if (newMin === undefined && newMax === undefined) return undefined;
      return [newMin, newMax];
    });
    onClose?.();
  };

  const handleClear = () => {
    setMin(undefined);
    setMax(undefined);
    column.setFilterValue(undefined);
    onClose?.();
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <input 
          type="number"
          value={min ?? ''}
          onChange={(e) => setMin(e.target.value === '' ? undefined : parseFloat(e.target.value))}
          placeholder="Min value"
          onClick={(e) => e.stopPropagation()} 
          className="block w-full rounded-md border-input bg-background p-2 text-sm text-foreground shadow-sm focus:border-ring focus:ring-2 focus:ring-ring focus:outline-none col-span-1"
        />
        <input 
          type="number"
          value={max ?? ''}
          onChange={(e) => setMax(e.target.value === '' ? undefined : parseFloat(e.target.value))}
          placeholder="Max value"
          onClick={(e) => e.stopPropagation()} 
          className="block w-full rounded-md border-input bg-background p-2 text-sm text-foreground shadow-sm focus:border-ring focus:ring-2 focus:ring-ring focus:outline-none col-span-1"
        />
      </div>
      <div className="flex justify-end space-x-2 pt-2 border-t border-border">
        {(min !== undefined || max !== undefined) && (
            <Button 
            onClick={handleClear}
                variant="ghost"
                size="sm"
        >
            Clear
            </Button>
        )}
        <Button 
            onClick={handleApply} 
            size="sm"
        >
            Apply
        </Button>
      </div>
    </div>
  );
};

const getColumns = (
  onViewDetailsClick: (lead: Lead) => void,
  allLeadsForTagFilter: Lead[],
  onScheduleFollowUpClick: (lead: Lead) => void,
  onScheduleMeetingClick: (lead: Lead) => void,
  agents: UserProfile[],
  updateAgentMutation: ReturnType<typeof useUpdateLeadAgentMutation>
) => [
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
      return <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusColorClasses} ring-opacity-20 ${status === 'P1' ? 'ring-amber-700/10' : status === 'P2' ? 'ring-sky-700/10' : status === 'P3' ? 'ring-emerald-600/20' : 'ring-gray-600/20' }`}>{status || 'N/A'}</span>;
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
  columnHelper.accessor('lead_source', {
    header: () => 'Lead Source',
    cell: info => info.getValue() || 'N/A',
    enableSorting: true,
    enableColumnFilter: false,
  }),
  columnHelper.accessor('contact_person', {
    header: () => 'Contact Person',
    cell: info => info.getValue() || 'N/A',
    enableSorting: true,
    enableColumnFilter: false,
  }),
  columnHelper.accessor('email', {
    header: () => 'Email',
    cell: info => info.getValue() || 'N/A',
    enableSorting: true,
    enableColumnFilter: false,
  }),
  columnHelper.accessor('phone', {
    header: () => 'Phone',
    cell: info => info.getValue() || 'N/A',
    enableSorting: false,
    enableColumnFilter: false,
  }),
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
  columnHelper.accessor(row => row.clients?.company_size, {
    id: 'company_size',
    header: () => 'Company Size',
    cell: info => info.getValue()?.toLocaleString() || 'N/A',
    enableSorting: true,
    enableColumnFilter: false,
  }),
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
  columnHelper.accessor('next_step', {
    header: () => 'Next Step',
    cell: info => info.getValue() || 'N/A',
    enableSorting: true,
    enableColumnFilter: false,
  }),
  columnHelper.accessor('follow_up_due_date', {
    header: () => 'Follow-Up Due',
    cell: info => formatDate(info.getValue()),
    enableSorting: true,
    enableColumnFilter: false,
  }),
  columnHelper.accessor('created_at', {
    header: () => 'Created At',
    cell: info => formatDate(info.getValue()),
    enableSorting: true,
    enableColumnFilter: false,
  }),
  columnHelper.accessor('updated_at', {
    header: () => 'Updated At',
    cell: info => formatDate(info.getValue()),
    enableSorting: true,
    enableColumnFilter: false,
  }),
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

interface BulkActionsBarProps {
  selectedRowCount: number;
  onClearSelection: () => void;
  onBulkScheduleFollowUps: () => void;
  onBulkScheduleMeetings: () => void;
}

const BulkActionsBar: React.FC<BulkActionsBarProps> = (
  { selectedRowCount, onClearSelection, onBulkScheduleFollowUps, onBulkScheduleMeetings }
) => {
  return (
    <div className="flex items-center justify-between p-3 bg-muted/70 rounded-lg shadow-md w-full sm:w-auto">
      <p className="text-sm font-medium text-foreground mr-4">
        {selectedRowCount} lead{selectedRowCount > 1 ? 's' : ''} selected
      </p>
      <div className="flex items-center space-x-2">
        <Button 
          variant="outline"
          size="sm"
          onClick={onBulkScheduleFollowUps} 
          aria-label="Schedule follow-ups for selected leads"
        >
          <BellAlertIcon className="h-4 w-4 mr-1.5" />
          Schedule Follow-up
        </Button>
        <Button 
          variant="outline"
          size="sm"
          onClick={onBulkScheduleMeetings} 
          aria-label="Schedule meetings for selected leads"
        >
          <CalendarDaysIcon className="h-4 w-4 mr-1.5" />
          Schedule Meeting
        </Button>
        <Button 
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Clear selection"
        >
          Clear Selection
        </Button>
      </div>
    </div>
  );
};

export const LeadTable: React.FC<LeadTableProps> = ({ 
  onRowClick, 
  onScheduleFollowUp, 
  onScheduleMeeting,
  onBulkScheduleFollowUps,
  onBulkScheduleMeetings
}) => {
  const { data: leadsResponse, isLoading: isLoadingLeads, error: leadsError } = useLeadsQuery({});
  const allLeads = useMemo(() => leadsResponse?.leads || [], [leadsResponse]);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const fuzzySearch = useMemo(() => {
    if (!allLeads.length) return () => [];
    const fuse = new Fuse(allLeads, {
      keys: ['clients.client_name', 'clients.contact_email', 'lead_source', 'status_bucket', 'tags'],
      threshold: 0.3,
    });
    return (query: string) => query ? fuse.search(query).map(result => result.item) : allLeads;
  }, [allLeads]);

  const filteredData = useMemo(() => {
    return globalFilter ? fuzzySearch(globalFilter) : allLeads;
  }, [allLeads, globalFilter, fuzzySearch]);
  
  const { data: agentsData, isLoading: isLoadingAgents, error: agentsError } = useUsersQuery({ role: 'agent' });
  const updateAgentMutation = useUpdateLeadAgentMutation();

  const columns = useMemo(() => getColumns(
    onRowClick, 
    allLeads, 
    onScheduleFollowUp, 
    onScheduleMeeting,
    agentsData || [],
    updateAgentMutation
  ), [onRowClick, allLeads, onScheduleFollowUp, onScheduleMeeting, agentsData, updateAgentMutation]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: true, 
    meta: {
    },
    debugTable: false,
    debugHeaders: false,
    debugColumns: false,
  });

  useEffect(() => {
    if (!onBulkScheduleFollowUps || !onBulkScheduleMeetings) {
      table.setOptions(prev => ({ ...prev, enableRowSelection: false }));
    }
  }, [onBulkScheduleFollowUps, onBulkScheduleMeetings, table]);

  const selectedLeads = table.getSelectedRowModel().flatRows.map(row => row.original);

  if (isLoadingLeads || isLoadingAgents) {
  return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
        <span className="ml-4 text-lg text-gray-600">Loading leads data...</span>
      </div>
    );
  }

  if (leadsError || agentsError) {
    return (
      <div className="p-4 text-center text-red-600 bg-red-50 rounded-md">
        Error loading data: {leadsError?.message || agentsError?.message}
      </div>
    );
  }

  if (!allLeads.length) {
    return <div className="p-6 text-center text-muted-foreground">No leads found.</div>;
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <input
          type="text"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search all leads..."
          className="px-4 py-2 border border-input bg-background text-foreground rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring sm:max-w-xs w-full"
        />
        {table.getSelectedRowModel().flatRows.length > 0 && onBulkScheduleFollowUps && onBulkScheduleMeetings && (
        <BulkActionsBar
            selectedRowCount={table.getSelectedRowModel().flatRows.length}
          onClearSelection={() => table.resetRowSelection()}
            onBulkScheduleFollowUps={() => onBulkScheduleFollowUps(selectedLeads)}
            onBulkScheduleMeetings={() => onBulkScheduleMeetings(selectedLeads)}
          />
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="min-w-full divide-y divide-border bg-card">
          <thead className="bg-muted/50">
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th
                  key={header.id}
                  colSpan={header.colSpan}
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider group"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        {...{
                          className: header.column.getCanSort()
                            ? 'flex items-center cursor-pointer select-none'
                            : 'flex items-center',
                          onClick: header.column.getToggleSortingHandler(),
                        }}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: <ChevronUpIcon className="h-4 w-4 ml-1 text-foreground" />,
                          desc: <ChevronDownIcon className="h-4 w-4 ml-1 text-foreground" />,
                        }[header.column.getIsSorted() as string] ?? (header.column.getCanSort() ? <ChevronUpDownIcon className="h-4 w-4 ml-1 text-muted-foreground/50" /> : null)}
                        {header.column.getCanFilter() && (
                           <FilterButton 
                              column={header.column}
                              title={typeof header.column.columnDef.header === 'string' ? header.column.columnDef.header : header.id}
                              renderPanel={() => {
                                if (header.column.id === 'tags') {
                                  return <TagsColumnFilterPanel column={header.column} allLeads={allLeads} />;
                                }
                                if (header.column.id === 'status_bucket') {
                                  return <StatusColumnFilterPanel column={header.column} />;
                                }
                                if (header.column.id === 'deal_value') {
                                   return <DealValueRangeFilterPanel column={header.column} />;
                                }
                                return <TextColumnFilterPanel column={header.column} />;
                              }}
                           />
                  )}
                  </div>
                    )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
          <tbody className="divide-y divide-border bg-card">
          {table.getRowModel().rows.map(row => (
            <tr 
                key={row.id} 
                className="hover:bg-muted/50 transition-colors duration-150"
            >
              {row.getVisibleCells().map(cell => (
                  <td 
                    key={cell.id} 
                    className="px-4 py-3 whitespace-nowrap text-sm text-foreground"
                  >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
        </div>

      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {table.getRowModel().rows.length} of {table.getPrePaginationRowModel().rows.length} leads
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              First
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeftIcon className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              Last
            </Button>
          <select
            value={table.getState().pagination.pageSize}
            onChange={e => {
                table.setPageSize(Number(e.target.value))
            }}
              className="p-2 border border-input bg-background text-foreground rounded-md text-sm focus:ring-ring focus:border-ring"
          >
            {[10, 20, 30, 40, 50].map(pageSize => (
              <option key={pageSize} value={pageSize}>
                Show {pageSize}
              </option>
            ))}
          </select>
        </div>
      </div>
      )}
    </div>
  );
};
