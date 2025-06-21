import React from 'react';
import { DailyReportWithNames } from '../../hooks/queries/useDailyReportsQuery';
import { UserProfile, TeamType, TelesalesDailyReport, LinkedInDailyReport, ColdEmailDailyReport } from '../../types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { MessageSquare, Mail, Phone, CheckCircle2, XCircle } from 'lucide-react';

interface DailyReportsDisplayProps {
  reports: DailyReportWithNames[];
  currentUserProfile: UserProfile | null;
}

const TeamIcons: Record<TeamType, React.ReactNode> = {
  telesales: <Phone className="h-4 w-4 text-blue-500 inline mr-1" />,
  linkedin: <MessageSquare className="h-4 w-4 text-sky-500 inline mr-1" />,
  cold_email: <Mail className="h-4 w-4 text-purple-500 inline mr-1" />,
};

const DailyReportsDisplay: React.FC<DailyReportsDisplayProps> = ({ reports, currentUserProfile }) => {
  const isSuperAdmin = currentUserProfile?.role === 'super_admin';

  if (!reports || reports.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 text-center">
        <p className="text-gray-500">No daily reports found for the selected criteria.</p>
      </div>
    );
  }

  const renderMetricsCell = (report: DailyReportWithNames) => {
    switch (report.team_type) {
      case 'telesales':
        const telesales = report as unknown as TelesalesDailyReport;
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Outreach</span>
              <span className="font-semibold text-gray-800">{telesales.outreach_count || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Responses</span>
              <span className="font-semibold text-gray-800">{telesales.responses_count || 0}</span>
            </div>
          </div>
        );
      case 'linkedin':
        const linkedin = report as unknown as LinkedInDailyReport;
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Outreach</span>
              <span className="font-semibold text-gray-800">{linkedin.outreach_count || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Responses</span>
              <span className="font-semibold text-gray-800">{linkedin.responses_count || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Comments</span>
              <span className="font-semibold text-gray-800">{linkedin.comments_done || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Posted</span>
              {linkedin.content_posted ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
          </div>
        );
      case 'cold_email':
        const coldEmail = report as unknown as ColdEmailDailyReport;
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Emails Sent</span>
              <span className="font-semibold text-gray-800">{coldEmail.emails_sent || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Responses</span>
              <span className="font-semibold text-gray-800">{coldEmail.responses_count || 0}</span>
            </div>
          </div>
        );
      default:
        return <span className="text-red-500 text-sm">Unknown team type</span>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto bg-white rounded-xl shadow-md border border-gray-200">
        <Table className="min-w-full divide-y divide-gray-200">
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Agent</TableHead>
              {isSuperAdmin && <TableHead className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Manager</TableHead>}
              <TableHead className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Team</TableHead>
              <TableHead className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Metrics</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white divide-y divide-gray-200">
            {reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isSuperAdmin ? 5 : 4} className="px-6 py-4 text-center text-gray-500">
                  No reports match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => (
                <TableRow key={report.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {new Date(report.report_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(report.report_date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{report.agent_name || 'N/A'}</div>
                    <div className="text-xs text-gray-500">
                      {report.team_type.replace('_', ' ')}
                    </div>
                  </TableCell>
                  {isSuperAdmin && (
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{report.manager_name || 'N/A'}</div>
                    </TableCell>
                  )}
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {TeamIcons[report.team_type]}
                      {report.team_type.replace('_', ' ')}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right whitespace-nowrap">
                    {renderMetricsCell(report)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default DailyReportsDisplay;