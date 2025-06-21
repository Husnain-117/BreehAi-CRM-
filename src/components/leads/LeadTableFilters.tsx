// src/components/leads/LeadTableFilters.tsx
import React, { useState, useMemo, useEffect, Fragment } from 'react';
import { Column } from '@tanstack/react-table';
import { Popover, Transition } from '@headlessui/react';
import { FunnelIcon } from '@heroicons/react/20/solid';
import { Button } from '@/components/ui/button';
import { Lead } from '@/types';
import { INDUSTRY_OPTIONS } from '@/types/leadSchema';

interface FilterButtonProps {
  column: Column<Lead, unknown>;
  renderPanel: () => React.ReactNode;
  title: string;
}

export const FilterButton: React.FC<FilterButtonProps> = ({ column, renderPanel, title }) => (
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

export const TextColumnFilterPanel: React.FC<TextColumnFilterPanelProps> = ({ column, onClose }) => {
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

export const StatusColumnFilterPanel: React.FC<StatusColumnFilterPanelProps> = ({ column, onClose }) => {
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

interface IndustryColumnFilterPanelProps {
  column: Column<Lead, unknown>;
  onClose?: () => void;
}

export const IndustryColumnFilterPanel: React.FC<IndustryColumnFilterPanelProps> = ({ column, onClose }) => {
  const currentFilter = (column.getFilterValue() || []) as string[];

  const handleCheckboxChange = (industry: string, checked: boolean) => {
    const newFilter = checked 
      ? [...currentFilter, industry] 
      : currentFilter.filter(s => s !== industry);
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
      <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
        {INDUSTRY_OPTIONS.slice(1).map(industry => ( // Skip the first "Select Industry" option
          <label key={industry.value} className="flex items-center space-x-2 text-xs cursor-pointer">
            <input 
              type="checkbox" 
              className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500 focus:ring-offset-0"
              checked={currentFilter.includes(industry.value)}
              onChange={(e) => handleCheckboxChange(industry.value, e.target.checked)}
              onClick={(e) => e.stopPropagation()}
            />
            <span>{industry.label}</span>
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
          className="rounded-md bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-500"
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

export const TagsColumnFilterPanel: React.FC<TagsColumnFilterPanelProps> = ({ column, allLeads, onClose }) => {
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

export const DealValueRangeFilterPanel: React.FC<DealValueRangeFilterPanelProps> = ({ column, onClose }) => {
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