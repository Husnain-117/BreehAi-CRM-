import React from 'react';
import { DailyReportWithNames } from '../../hooks/queries/useDailyReportsQuery';
import { UserProfile, TeamType } from '../../types'; // Corrected TeamType import

// Uncomment or add Table imports if using Shadcn UI Table
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table'; // Adjust path if needed

interface DailyReportsDisplayProps {
  reports: DailyReportWithNames[];
  currentUserProfile: UserProfile | null;
}

const DailyReportsDisplay: React.FC<DailyReportsDisplayProps> = ({ reports, currentUserProfile }) => {
  if (!reports || reports.length === 0) {
    return <p className="text-muted-foreground">No daily reports found for the selected criteria.</p>;
  }

  const isSuperAdmin = currentUserProfile?.role === 'super_admin';

  // Helper to render metrics concisely for the table
  const renderMetricsCell = (report: DailyReportWithNames) => {
    switch (report.team_type) {
      case 'telesales':
        return `Outreach: ${report.outreach_count ?? '-'}, Responses: ${report.responses_count ?? '-'}`;
      case 'linkedin':
        return `Outreach: ${report.outreach_count ?? '-'}, Responses: ${report.responses_count ?? '-'}, Comments: ${report.comments_done ?? '-'}, Posted: ${report.content_posted ? 'Yes' : 'No'}`;
      case 'cold_email':
        return `Sent: ${report.emails_sent ?? '-'}, Responses: ${report.responses_count ?? '-'}`;
      default:
        return <span className="text-red-500">Unknown team type</span>;
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-b hover:bg-transparent">
          <TableHead className="w-[120px]">Report Date</TableHead>
          <TableHead>Agent</TableHead>
          {isSuperAdmin && <TableHead>Manager</TableHead>}
          <TableHead>Team</TableHead>
          <TableHead className="text-right">Metrics</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reports.length === 0 ? (
          <TableRow>
            <TableCell colSpan={isSuperAdmin ? 5 : 4} className="h-24 text-center text-muted-foreground">
              No reports match the current filters.
            </TableCell>
          </TableRow>
        ) : (
          reports.map((report) => (
            <TableRow key={report.id} className="border-b hover:bg-muted/50">
              <TableCell className="py-2 font-medium">{new Date(report.report_date).toLocaleDateString()}</TableCell>
              <TableCell className="py-2">{report.agent_name}</TableCell>
              {isSuperAdmin && <TableCell className="py-2">{report.manager_name}</TableCell>}
              <TableCell className="py-2 capitalize">{report.team_type.replace('_', ' ')}</TableCell>
              <TableCell className="py-2 text-right text-xs text-muted-foreground">{renderMetricsCell(report)}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default DailyReportsDisplay; 