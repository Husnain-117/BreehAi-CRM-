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
import { useLeadsQuery } from '../../hooks/queries';
import { Lead } from '../../types'; // Ensure Lead type includes all new fields
import { RowActionsMenu } from './RowActionsMenu'; // Import the new component
import { ChevronUpIcon, ChevronDownIcon, ChevronUpDownIcon, ChevronLeftIcon, ChevronRightIcon, CalendarDaysIcon, BellAlertIcon, FunnelIcon } from '@heroicons/react/20/solid'; // Icons for sorting and new icons
import Fuse from 'fuse.js'; // Import Fuse.js
import { Popover, Transition } from '@headlessui/react'; // Import Popover and Transition
import { Fragment } from 'react'; // Import Fragment for Transition

const columnHelper = createColumnHelper<Lead>();

// Helper function to format date strings (can be moved to a utils file later)
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
};

// Helper function to format currency (can be moved to a utils file later)
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

// Filter component for Tags (Multi-select with checkboxes)
interface TagsColumnFilterProps {
  column: any; // TanStack Table column instance
  allLeads: Lead[]; // Pass all leads to derive unique tags
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

// Filter component for Deal Value (Min/Max range input)
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
          onClick={(e) => e.stopPropagation()} // Prevent sorting
          className="p-1 text-xs border border-gray-300 rounded shadow-sm w-1/2"
        />
        <input 
          type="number"
          value={max ?? ''}
          onChange={handleMaxChange}
          placeholder="Max value"
          onClick={(e) => e.stopPropagation()} // Prevent sorting
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

// Step 3: Define FilterButton component
interface FilterButtonProps {
  column: Column<Lead, unknown>;
  renderPanel: () => React.ReactNode;
  title: string;
}

const FilterButton: React.FC<FilterButtonProps> = ({ column, renderPanel, title }) => (
  <Popover className="relative inline-flex">
    <Popover.Button 
      className="ml-1 inline-flex items-center rounded-md bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
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
      <Popover.Panel className="absolute z-20 mt-2 w-56 rounded-md bg-white py-3 shadow-lg ring-1 ring-black/5 focus:outline-none">
        <div className="px-3 py-2">
            <h4 className="text-xs font-medium text-gray-900 mb-2">Filter by {title}</h4>
            {renderPanel()}
        </div>
      </Popover.Panel>
    </Transition>
  </Popover>
);

// Step 3: Implement TextColumnFilterPanel for Popover
interface TextColumnFilterPanelProps {
  column: Column<Lead, unknown>;
  onClose?: () => void; // Optional: To close popover from within panel
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
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs p-1.5"
        onClick={(e) => e.stopPropagation()} // Prevent popover from closing if input inside is clicked
      />
      <div className="flex justify-end space-x-2">
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

// Step 3: Implement StatusColumnFilterPanel for Popover
interface StatusColumnFilterPanelProps {
  column: Column<Lead, unknown>;
  onClose?: () => void;
}

const StatusColumnFilterPanel: React.FC<StatusColumnFilterPanelProps> = ({ column, onClose }) => {
  const currentFilter = (column.getFilterValue() || []) as string[];
  // Assuming fixed statuses for now, can be derived from data if needed
  const uniqueStatuses = ['P1', 'P2', 'P3']; 

  const handleCheckboxChange = (status: string, checked: boolean) => {
    const newFilter = checked 
      ? [...currentFilter, status] 
      : currentFilter.filter(s => s !== status);
    column.setFilterValue(newFilter.length > 0 ? newFilter : undefined);
    // For multi-select, we might not want to auto-close on change
    // onClose?.(); 
  };

  const handleClear = () => {
    column.setFilterValue(undefined);
    onClose?.();
  };
  
  const handleApply = () => { // Apply button might be good for multi-select if not closing on change
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
              onClick={(e) => e.stopPropagation()} // Prevent popover close
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

// Step 3: Implement TagsColumnFilterPanel for Popover
interface TagsColumnFilterPanelProps {
  column: Column<Lead, unknown>;
  allLeads: Lead[]; // Pass all leads to derive unique tags
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
      <div className="space-y-1 max-h-32 overflow-y-auto pr-1"> {/* Added pr-1 for scrollbar spacing if needed */}
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

// Step 3: Implement DealValueRangeFilterPanel for Popover
interface DealValueRangeFilterPanelProps {
  column: Column<Lead, unknown>;
  onClose?: () => void;
}

const DealValueRangeFilterPanel: React.FC<DealValueRangeFilterPanelProps> = ({ column, onClose }) => {
  const currentFilter = (column.getFilterValue() || [undefined, undefined]) as [number | undefined, number | undefined];
  const [min, setMin] = useState<number | undefined>(currentFilter[0]);
  const [max, setMax] = useState<number | undefined>(currentFilter[1]);

  useEffect(() => {
    // Sync local state if external filter state changes (e.g. global clear)
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
      <div className="flex space-x-2">
        <input 
          type="number"
          value={min ?? ''}
          onChange={(e) => setMin(e.target.value === '' ? undefined : parseFloat(e.target.value))}
          placeholder="Min value"
          onClick={(e) => e.stopPropagation()} 
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs p-1.5"
        />
        <input 
          type="number"
          value={max ?? ''}
          onChange={(e) => setMax(e.target.value === '' ? undefined : parseFloat(e.target.value))}
          placeholder="Max value"
          onClick={(e) => e.stopPropagation()} 
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs p-1.5"
        />
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

// getColumns function no longer needs the 'table' instance
const getColumns = (
  onViewDetailsClick: (lead: Lead) => void,
  allLeadsForTagFilter: Lead[], // Pass all leads for tag filter options
  onScheduleFollowUpClick: (lead: Lead) => void,
  onScheduleMeetingClick: (lead: Lead) => void
) => [
  columnHelper.display({
    id: 'select',
    header: ({ table }) => {
      // Ref for the header checkbox to manually set indeterminate state
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
          // indeterminate prop is not directly supported by React's HTMLAttributes for input, managed by ref
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
          onClick={(e) => e.stopPropagation()} // Prevent row click when toggling checkbox
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
      let statusColorClasses = 'bg-gray-100 text-gray-800'; // Default/fallback
      if (status === 'P1') {
        statusColorClasses = 'bg-amber-100 text-amber-800';
      } else if (status === 'P2') {
        statusColorClasses = 'bg-sky-100 text-sky-800';
      } else if (status === 'P3') {
        statusColorClasses = 'bg-emerald-100 text-emerald-800';
      }
      // Ensure base classes for pill shape and text are consistent
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
      <div className="flex items-center">
        Assigned Agent
        <FilterButton 
          column={column} 
          title="Assigned Agent"
          renderPanel={() => <TextColumnFilterPanel column={column} />}
        />
      </div>
    ),
    cell: info => info.getValue() || 'Unassigned',
    enableSorting: true,
    enableColumnFilter: true,
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
      if (rowValue === null || rowValue === undefined) return false; // or true if want to include rows with no deal value?

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
    header: () => <span className="sr-only">Actions</span>, // Screen reader only header
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
  // TODO: Add column for context menu (actions)
];

// BulkActionsBar Component (new)
interface BulkActionsBarProps {
  selectedRowCount: number;
  onClearSelection: () => void;
  onBulkScheduleFollowUps: () => void;
  onBulkScheduleMeetings: () => void;
  // Add other bulk actions here e.g. onDelete, onChangeStatus
}

const BulkActionsBar: React.FC<BulkActionsBarProps> = (
  { selectedRowCount, onClearSelection, onBulkScheduleFollowUps, onBulkScheduleMeetings }
) => {
  if (selectedRowCount === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between bg-white px-6 py-3 shadow-md ring-1 ring-gray-200">
      <div className="flex items-center">
        <p className="text-sm font-medium text-gray-700">
          {selectedRowCount} {selectedRowCount === 1 ? 'item' : 'items'} selected
        </p>
        <button 
          onClick={onClearSelection} 
          className="ml-3 text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Clear selection
        </button>
      </div>
      <div className="flex space-x-3">
        <button 
          onClick={onBulkScheduleFollowUps} 
          className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <BellAlertIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
          Add to Follow-Ups
        </button>
        <button 
          onClick={onBulkScheduleMeetings} 
          className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <CalendarDaysIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
          Add to Meetings
        </button>
        {/* Add other bulk action buttons here */}
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
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const { 
    data: queryData,
    isLoading,
    isError,
    error,
  } = useLeadsQuery({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
  });

  const rawData = useMemo(() => queryData?.leads || [], [queryData]);
  const totalLeadsCount = useMemo(() => queryData?.count || 0, [queryData]);

  const fuse = useMemo(() => {
    if (rawData.length === 0) return null;
    const searchKeys = [ 'clients.client_name', 'clients.company', 'status_bucket', 'users.full_name', 'lead_source', 'contact_person', 'email', 'next_step', 'tags', ];
    return new Fuse(rawData, { keys: searchKeys, threshold: 0.3, getFn: (obj: any, path: string | string[]) => { const pathArray = Array.isArray(path) ? path : path.split('.'); let value = obj; for (const key of pathArray) { if (value === null || value === undefined) return null; value = value[key]; } return value; } });
  }, [rawData]);

  const dataAfterGlobalFilter = useMemo(() => {
    if (!globalFilter || !fuse) return rawData;
    const results = fuse.search(globalFilter);
    return results.map(result => result.item);
  }, [rawData, globalFilter, fuse]);

  const tableColumns = useMemo(() => getColumns(onRowClick, rawData, onScheduleFollowUp, onScheduleMeeting), [onRowClick, rawData, onScheduleFollowUp, onScheduleMeeting]);

  const table = useReactTable({
    data: dataAfterGlobalFilter,
    columns: tableColumns,
    state: {
      sorting,
      columnFilters,
      pagination,
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(totalLeadsCount / pagination.pageSize),
    getRowId: row => row.id,
  });

  const selectedRowsCount = Object.keys(rowSelection).length;
  const selectedLeadObjects = useMemo(() => 
    table.getSelectedRowModel().flatRows.map(row => row.original)
  , [rowSelection, table]);

  // Effect to call onBulkScheduleFollowUps/Meetings when selection changes
  useEffect(() => {
    const selectedRowsData = table.getSelectedRowModel().rows.map(row => row.original);
    if (selectedRowsData.length > 0) {
      // This is just an example of how you might trigger.
      // The actual call is done via the BulkActionsBar buttons.
    }
  }, [rowSelection, table, onBulkScheduleFollowUps, onBulkScheduleMeetings]);

  if (isLoading) return <div className="p-4 text-center">Loading leads...</div>;
  if (isError) return <div className="p-4 text-center text-red-500">Error loading leads: {error?.message}</div>;
  if (!queryData) return <div className="p-4 text-center">No leads data.</div>;

  return (
    <div className="overflow-x-auto scrollbar-thin">
      {Object.keys(rowSelection).length > 0 && onBulkScheduleFollowUps && onBulkScheduleMeetings && (
        <BulkActionsBar
          selectedRowCount={Object.keys(rowSelection).length}
          onClearSelection={() => table.resetRowSelection()}
          onBulkScheduleFollowUps={() => {
            const selectedLeads = table.getSelectedRowModel().rows.map(row => row.original);
            onBulkScheduleFollowUps(selectedLeads);
          }}
          onBulkScheduleMeetings={() => {
            const selectedLeads = table.getSelectedRowModel().rows.map(row => row.original);
            onBulkScheduleMeetings(selectedLeads);
          }}
        />
      )}
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th
                  key={header.id}
                  colSpan={header.colSpan}
                  onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                  className={`whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-700 ${header.column.getCanSort() ? 'cursor-pointer select-none' : ''}`}
                  aria-sort={header.column.getCanSort() ? (header.column.getIsSorted() === 'asc' ? 'ascending' : header.column.getIsSorted() === 'desc' ? 'descending' : 'none') : undefined}
                >
                  <div className="flex items-center">
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  {header.column.getCanSort() && (
                    <span className="ml-1">
                      {header.column.getIsSorted() === 'asc' ? <ChevronUpIcon className="h-4 w-4"/> : header.column.getIsSorted() === 'desc' ? <ChevronDownIcon className="h-4 w-4"/> : <ChevronUpDownIcon className="h-4 w-4 text-gray-400"/>}
                    </span>
                  )}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {table.getRowModel().rows.map(row => (
            <tr 
                key={row.id} 
                onClick={() => onRowClick(row.original)} 
                className={`cursor-pointer hover:bg-gray-50 ${row.getIsSelected() ? 'bg-indigo-50' : ''}`}
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        onRowClick(row.original);
                    }
                }}
            >
              {row.getVisibleCells().map(cell => (
                <td key={cell.id} className="whitespace-nowrap px-4 py-3 text-gray-700">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center justify-between mt-4 p-2 border-t border-gray-200">
        <div className="text-sm text-gray-700">
          Page {' '}
          <strong>
            {table.getState().pagination.pageIndex + 1} of {table.getPageCount() > 0 ? table.getPageCount() : 1}
          </strong> {' '}
          | Go to page:
          <input 
            type="number"
            defaultValue={table.getState().pagination.pageIndex + 1}
            onChange={e => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0;
              table.setPageIndex(page);
            }}
            className="border p-1 rounded w-16 ml-2 text-center"
            min={1}
            max={table.getPageCount() > 0 ? table.getPageCount() : 1}
          />
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={table.getState().pagination.pageSize}
            onChange={e => {
              table.setPageSize(Number(e.target.value));
            }}
            className="p-1 border rounded"
          >
            {[10, 20, 30, 40, 50].map(pageSize => (
              <option key={pageSize} value={pageSize}>
                Show {pageSize}
              </option>
            ))}
          </select>
          <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="p-1 border rounded hover:bg-gray-100 disabled:opacity-50" aria-label="Go to previous page"><ChevronLeftIcon className="w-5 h-5" /></button>
          <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="p-1 border rounded hover:bg-gray-100 disabled:opacity-50" aria-label="Go to next page"><ChevronRightIcon className="w-5 h-5" /></button>
        </div>
      </div>
    </div>
  );
};
