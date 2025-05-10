import React from 'react';
import { DailyReportWithNames } from '../../hooks/queries/useDailyReportsQuery';
import { UserProfile, TeamType } from '../../types'; // Corrected TeamType import

// Table imports commented out as ShadCN Table is not yet installed
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from '../ui/table';

interface DailyReportsDisplayProps {
  reports: DailyReportWithNames[];
  currentUserProfile: UserProfile | null;
}

const DailyReportsDisplay: React.FC<DailyReportsDisplayProps> = ({ reports, currentUserProfile }) => {
  if (!reports || reports.length === 0) {
    return <p className="text-gray-600 dark:text-gray-400">No daily reports found for the selected criteria.</p>;
  }

  const isSuperAdmin = currentUserProfile?.role === 'super_admin';

  // Helper to render metrics for list view
  const renderMetricsList = (report: DailyReportWithNames) => {
    let metrics: { label: string; value: string | number | boolean | null | undefined }[] = [];
    switch (report.team_type) {
      case 'telesales':
        metrics = [
          { label: 'Outreach', value: report.outreach_count },
          { label: 'Responses', value: report.responses_count },
        ];
        break;
      case 'linkedin':
        metrics = [
          { label: 'Outreach', value: report.outreach_count },
          { label: 'Responses', value: report.responses_count },
          { label: 'Comments', value: report.comments_done },
          { label: 'Content Posted', value: report.content_posted ? 'Yes' : 'No' },
        ];
        break;
      case 'cold_email':
        metrics = [
          { label: 'Emails Sent', value: report.emails_sent },
          { label: 'Responses', value: report.responses_count },
        ];
        break;
      default:
        return <li className="text-sm text-red-500">Unknown team type</li>;
    }
    return metrics.map(metric => (
      <li key={metric.label} className="text-sm">
        <span className="font-medium">{metric.label}:</span> {String(metric.value ?? '-')}
      </li>
    ));
  };

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <div key={report.id} className="bg-card border border-border p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-card-foreground">
            Report Date: {new Date(report.report_date).toLocaleDateString()}
          </h3>
          <p className="text-sm text-muted-foreground">Agent: {report.agent_name}</p>
          {isSuperAdmin && <p className="text-sm text-muted-foreground">Manager: {report.manager_name}</p>}
          <p className="text-sm text-muted-foreground">
            Team: {report.team_type.charAt(0).toUpperCase() + report.team_type.slice(1)}
          </p>
          <ul className="mt-2 space-y-1">
            {renderMetricsList(report)}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default DailyReportsDisplay; 