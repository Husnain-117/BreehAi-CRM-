// src/components/leads/LeadTable.tsx
import React, { useMemo, useState, useEffect } from 'react';
import {
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
} from '@tanstack/react-table';
import { useLeadsQuery, useUsersQuery } from '@/hooks/queries';
import { Lead } from '@/types';
import { 
  ChevronUpIcon, 
  ChevronDownIcon, 
  ChevronUpDownIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  CalendarDaysIcon, 
  BellAlertIcon, 
  TrashIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/20/solid';
import Fuse from 'fuse.js';
import { Button } from '@/components/ui/button';
import { useUpdateLeadAgentMutation } from '@/hooks/mutations/useUpdateLeadAgentMutation';
import { useBulkDeleteLeadsMutation } from '@/hooks/mutations/useBulkDeleteLeadsMutation';
import toast from 'react-hot-toast';
import { getColumns } from './LeadTableColumns';

interface LeadTableProps {
  onRowClick: (lead: Lead) => void;
  onScheduleFollowUp: (lead: Lead) => void;
  onScheduleMeeting: (lead: Lead) => void;
  onBulkScheduleFollowUps?: (selectedLeads: Lead[]) => void;
  onBulkScheduleMeetings?: (selectedLeads: Lead[]) => void;
  onBulkDelete?: (selectedLeads: Lead[]) => void;
}

interface BulkActionsBarProps {
  selectedRowCount: number;
  onClearSelection: () => void;
  onBulkScheduleFollowUps: () => void;
  onBulkScheduleMeetings: () => void;
  onBulkDelete: () => void;
}

const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedRowCount,
  onClearSelection,
  onBulkScheduleFollowUps,
  onBulkScheduleMeetings,
  onBulkDelete,
}) => {
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
          variant="destructive"
          size="sm"
          onClick={onBulkDelete}
          aria-label="Delete selected leads"
        >
          <TrashIcon className="h-4 w-4 mr-1.5" />
          Delete ({selectedRowCount})
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
  onBulkScheduleMeetings,
  onBulkDelete
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

  // Bulk delete state and mutation
  const bulkDeleteMutation = useBulkDeleteLeadsMutation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [leadsToDelete, setLeadsToDelete] = useState<Lead[]>([]);

  const handleBulkDelete = async (selectedLeads: Lead[]) => {
    if (selectedLeads.length === 0) {
      toast.error('No leads selected for deletion');
      return;
    }

    setLeadsToDelete(selectedLeads);
    setShowDeleteConfirm(true);
  };

  const confirmBulkDelete = async () => {
    try {
      const leadIds = leadsToDelete.map(lead => lead.id);
      await bulkDeleteMutation.mutateAsync(leadIds);
      
      toast.success(`Successfully deleted ${leadsToDelete.length} leads`);
      table.resetRowSelection(); // Clear selection after deletion
      setShowDeleteConfirm(false);
      setLeadsToDelete([]);
    } catch (error) {
      console.error('Bulk delete failed:', error);
      // Error toast is handled by the mutation
    }
  };

  const fuzzySearch = useMemo(() => {
    if (!allLeads.length) return () => [];
    const fuse = new Fuse(allLeads, {
      keys: ['clients.client_name', 'clients.contact_email', 'lead_source', 'status_bucket', 'tags', 'industry'],
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
    meta: {},
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
            onBulkDelete={() => handleBulkDelete(selectedLeads)}
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

      {/* Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Confirm Bulk Delete</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{leadsToDelete.length}</strong> selected leads? 
              This will also delete all related follow-ups and meetings. This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setLeadsToDelete([]);
                }}
                disabled={bulkDeleteMutation.isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmBulkDelete}
                disabled={bulkDeleteMutation.isLoading}
              >
                {bulkDeleteMutation.isLoading ? 'Deleting...' : 'Delete All'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};