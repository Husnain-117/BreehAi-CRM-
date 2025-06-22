import React, { useMemo } from 'react';
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
import { MessageSquare, Mail, Phone, CheckCircle2, XCircle, Search, Filter, BarChart2, Users as UsersIcon, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

interface DailyReportsDisplayProps {
  reports: DailyReportWithNames[];
  currentUserProfile: UserProfile | null;
}

const TeamIcons: Record<TeamType, { icon: React.ReactNode; color: string; name: string }> = {
  telesales: { 
    icon: <Phone className="h-4 w-4" />, 
    color: 'bg-blue-100 text-blue-600',
    name: 'Telesales'
  },
  linkedin: { 
    icon: <MessageSquare className="h-4 w-4" />, 
    color: 'bg-sky-100 text-sky-600',
    name: 'LinkedIn'
  },
  cold_email: { 
    icon: <Mail className="h-4 w-4" />, 
    color: 'bg-purple-100 text-purple-600',
    name: 'Cold Email'
  },
};

const DailyReportsDisplay: React.FC<DailyReportsDisplayProps> = ({ reports, currentUserProfile }) => {
  const isSuperAdmin = currentUserProfile?.role === 'super_admin';
  const [searchTerm, setSearchTerm] = React.useState('');
  const [teamFilter, setTeamFilter] = React.useState<TeamType | 'all'>('all');

  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const matchesSearch = 
        report.agent_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.manager_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTeam = teamFilter === 'all' || report.team_type === teamFilter;
      
      return matchesSearch && matchesTeam;
    });
  }, [reports, searchTerm, teamFilter]);

  const summaryStats = useMemo(() => {
    return reports.reduce((acc, report) => {
      acc.totalReports++;
      acc.teamCounts[report.team_type] = (acc.teamCounts[report.team_type] || 0) + 1;
      
      // Calculate metrics based on team type
      if (report.team_type === 'linkedin') {
        const linkedin = report as unknown as LinkedInDailyReport;
        acc.totalOutreach += linkedin.outreach_count || 0;
        acc.totalResponses += linkedin.responses_count || 0;
        if (linkedin.content_posted) acc.totalContentPosted++;
      } else if (report.team_type === 'telesales') {
        const telesales = report as unknown as TelesalesDailyReport;
        acc.totalOutreach += telesales.outreach_count || 0;
        acc.totalResponses += telesales.responses_count || 0;
      } else if (report.team_type === 'cold_email') {
        const coldEmail = report as unknown as ColdEmailDailyReport;
        acc.totalOutreach += coldEmail.emails_sent || 0;
        acc.totalResponses += coldEmail.responses_count || 0;
      }
      
      return acc;
    }, {
      totalReports: 0,
      totalOutreach: 0,
      totalResponses: 0,
      totalContentPosted: 0,
      teamCounts: {} as Record<TeamType, number>,
    });
  }, [reports]);

  if (!reports || reports.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
          <BarChart2 className="h-6 w-6 text-gray-400" />
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No reports yet</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by submitting your first daily report.</p>
      </div>
    );
  }

  const renderMetricsCell = (report: DailyReportWithNames) => {
    const team = TeamIcons[report.team_type];
    
    switch (report.team_type) {
      case 'telesales':
        const telesales = report as unknown as TelesalesDailyReport;
        const telesalesTotal = Math.max(1, (telesales.outreach_count || 0) + (telesales.responses_count || 0));
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center text-gray-600">
                <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full mr-2 ${team.color}`}>
                  {team.icon}
                </span>
                {team.name}
              </span>
            </div>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Outreach</span>
                  <span className="font-medium">{telesales.outreach_count || 0}</span>
                </div>
                <Progress value={(telesales.outreach_count || 0) / telesalesTotal * 100} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Responses</span>
                  <span className="font-medium">{telesales.responses_count || 0}</span>
                </div>
                <Progress 
                  value={(telesales.responses_count || 0) / telesalesTotal * 100} 
                  className="h-2 bg-blue-100"
                  indicatorClassName="bg-blue-500"
                />
              </div>
            </div>
          </div>
        );
      
      case 'linkedin':
        const linkedin = report as unknown as LinkedInDailyReport;
        const linkedinTotal = Math.max(1, (linkedin.outreach_count || 0) + (linkedin.responses_count || 0) + (linkedin.comments_done || 0));
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center text-gray-600">
                <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full mr-2 ${team.color}`}>
                  {team.icon}
                </span>
                {team.name}
              </span>
              <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${linkedin.content_posted ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {linkedin.content_posted ? 'Posted' : 'Not Posted'}
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Outreach</span>
                  <span className="font-medium">{linkedin.outreach_count || 0}</span>
                </div>
                <Progress value={(linkedin.outreach_count || 0) / linkedinTotal * 100} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Responses</span>
                  <span className="font-medium">{linkedin.responses_count || 0}</span>
                </div>
                <Progress 
                  value={(linkedin.responses_count || 0) / linkedinTotal * 100} 
                  className="h-2 bg-blue-100"
                  indicatorClassName="bg-blue-500"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Comments</span>
                  <span className="font-medium">{linkedin.comments_done || 0}</span>
                </div>
                <Progress 
                  value={(linkedin.comments_done || 0) / linkedinTotal * 100} 
                  className="h-2 bg-green-100"
                  indicatorClassName="bg-green-500"
                />
              </div>
            </div>
          </div>
        );
      
      case 'cold_email':
        const coldEmail = report as unknown as ColdEmailDailyReport;
        const coldEmailTotal = Math.max(1, (coldEmail.emails_sent || 0) + (coldEmail.responses_count || 0));
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center text-gray-600">
                <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full mr-2 ${team.color}`}>
                  {team.icon}
                </span>
                {team.name}
              </span>
            </div>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Emails Sent</span>
                  <span className="font-medium">{coldEmail.emails_sent || 0}</span>
                </div>
                <Progress value={(coldEmail.emails_sent || 0) / coldEmailTotal * 100} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Responses</span>
                  <span className="font-medium">{coldEmail.responses_count || 0}</span>
                </div>
                <Progress 
                  value={(coldEmail.responses_count || 0) / coldEmailTotal * 100} 
                  className="h-2 bg-blue-100"
                  indicatorClassName="bg-blue-500"
                />
              </div>
              <div className="text-xs text-gray-500 mt-2">
                <span className="font-medium">Response Rate: </span>
                {coldEmail.emails_sent 
                  ? `${Math.round(((coldEmail.responses_count || 0) / coldEmail.emails_sent) * 100)}%` 
                  : 'N/A'}
              </div>
            </div>
          </div>
        );
      
      default:
        return <span className="text-red-500 text-sm">Unknown team type</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Reports</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">
              <Activity className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalReports}</div>
            <p className="text-xs text-muted-foreground">
              Across all teams
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Outreach</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">
              <UsersIcon className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalOutreach}</div>
            <p className="text-xs text-muted-foreground">
              Combined outreach across all teams
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Responses</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">
              <MessageSquare className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalResponses}</div>
            <p className="text-xs text-muted-foreground">
              {summaryStats.totalOutreach > 0 
                ? `Response rate: ${Math.round((summaryStats.totalResponses / summaryStats.totalOutreach) * 100)}%` 
                : 'No outreach data'}
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Teams Activity</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">
              <UsersIcon className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(summaryStats.teamCounts).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {Object.entries(summaryStats.teamCounts).map(([team, count]) => (
                <span key={team} className="mr-2">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${TeamIcons[team as TeamType]?.color}`}>
                    {TeamIcons[team as TeamType]?.icon}
                    <span className="ml-1">{count}</span>
                  </span>
                </span>
              ))}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            type="search"
            placeholder="Search reports..."
            className="w-full pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-gray-500 hidden sm:block" />
          <select
            className="flex h-9 w-full sm:w-40 items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value as TeamType | 'all')}
          >
            <option value="all">All Teams</option>
            {Object.entries(TeamIcons).map(([key, { name }]) => (
              <option key={key} value={key}>{name}</option>
            ))}
          </select>
          <Button variant="outline" size="sm" className="ml-auto">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>
      </div>

      {/* Reports Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
        <Table className="min-w-full divide-y divide-gray-200">
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date & Agent
              </TableHead>
              {isSuperAdmin && (
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Manager
                </TableHead>
              )}
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Team
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Metrics
              </TableHead>
              <TableHead className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white divide-y divide-gray-200">
            {filteredReports.map((report) => (
              <TableRow key={report.id} className="hover:bg-gray-50 transition-colors">
                <TableCell className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {new Date(report.report_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="text-sm text-gray-500">{report.agent_name || 'N/A'}</div>
                </TableCell>
                {isSuperAdmin && (
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{report.manager_name || 'N/A'}</div>
                  </TableCell>
                )}
                <TableCell className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${TeamIcons[report.team_type]?.color} bg-opacity-20`}>
                    {TeamIcons[report.team_type]?.icon}
                    <span className="ml-1">{TeamIcons[report.team_type]?.name}</span>
                  </span>
                </TableCell>
                <TableCell className="px-6 py-4">
                  {renderMetricsCell(report)}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900 mr-4">View</button>
                  <button className="text-indigo-600 hover:text-indigo-900">Edit</button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredReports.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-200">
          <Search className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No reports found</h3>
          <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter to find what you're looking for.</p>
        </div>
      )}
    </div>
  );
};

export default DailyReportsDisplay;