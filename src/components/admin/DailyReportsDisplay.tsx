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
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Report Date</TableHead>
            <TableHead>Agent</TableHead>
            {isSuperAdmin && <TableHead>Manager</TableHead>}
            <TableHead>Team</TableHead>
            <TableHead>Metrics</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => (
            <TableRow key={report.id}>
              <TableCell>{new Date(report.report_date).toLocaleDateString()}</TableCell>
              <TableCell>{report.agent_name}</TableCell>
              {isSuperAdmin && <TableCell>{report.manager_name}</TableCell>}
              <TableCell className="capitalize">{report.team_type.replace('_', ' ')}</TableCell>
              <TableCell className="text-xs">{renderMetricsCell(report)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default DailyReportsDisplay; 