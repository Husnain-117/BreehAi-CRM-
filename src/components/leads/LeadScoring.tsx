// src/components/leads/LeadScoring.tsx
import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { Lead } from '../../types';
import { 
  StarIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  SparklesIcon
} from '@heroicons/react/20/solid';
import { Button } from '../ui/button';
import toast from 'react-hot-toast';

interface LeadScoringProps {
  lead: Lead;
  onScoreUpdated?: (newScore: number, qualification: string) => void;
}

interface ScoringCriteria {
  name: string;
  category: string;
  points: number;
  met: boolean;
  description: string;
}

export const LeadScoring: React.FC<LeadScoringProps> = ({ lead, onScoreUpdated }) => {
  const [score, setScore] = useState(lead.lead_score || 0);
  const [qualification, setQualification] = useState(lead.qualification_status || 'unqualified');
  const [criteria, setCriteria] = useState<ScoringCriteria[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const queryClient = useQueryClient();

  const updateScoreMutation = useMutation({
    mutationFn: async ({ leadId, newScore, newQualification }: { leadId: string; newScore: number; newQualification: string }) => {
      const { error } = await supabase
        .from('leads')
        .update({ 
          lead_score: newScore, 
          qualification_status: newQualification 
        })
        .eq('id', leadId);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success('Lead score updated successfully');
      queryClient.invalidateQueries(['leads']);
      onScoreUpdated?.(variables.newScore, variables.newQualification);
    },
    onError: (error) => {
      console.error('Error updating score:', error);
      toast.error('Failed to update lead score');
    }
  });

  const calculateLeadScore = () => {
    setIsCalculating(true);
    
    const scoringCriteria: ScoringCriteria[] = [
      // Firmographic scoring
      {
        name: 'Large Company',
        category: 'firmographic',
        points: 20,
        met: (lead.clients?.company_size || 0) > 500,
        description: 'Company has more than 500 employees'
      },
      {
        name: 'High Deal Value',
        category: 'firmographic',
        points: 25,
        met: (lead.deal_value || 0) > 50000,
        description: 'Deal value exceeds $50,000'
      },
      {
        name: 'Medium Deal Value',
        category: 'firmographic',
        points: 15,
        met: (lead.deal_value || 0) >= 10000 && (lead.deal_value || 0) <= 50000,
        description: 'Deal value between $10,000 - $50,000'
      },
      
      // Industry scoring
      {
        name: 'Technology Industry',
        category: 'demographic',
        points: 15,
        met: lead.industry === 'technology',
        description: 'Lead is in technology sector'
      },
      {
        name: 'Healthcare Industry',
        category: 'demographic',
        points: 15,
        met: lead.industry === 'healthcare',
        description: 'Lead is in healthcare sector'
      },
      {
        name: 'Finance Industry',
        category: 'demographic',
        points: 15,
        met: lead.industry === 'finance',
        description: 'Lead is in finance sector'
      },
      
      // Contact information scoring
      {
        name: 'Complete Contact Info',
        category: 'behavioral',
        points: 10,
        met: !!(lead.email && lead.phone),
        description: 'Has both email and phone number'
      },
      {
        name: 'Has Email',
        category: 'behavioral',
        points: 5,
        met: !!lead.email,
        description: 'Valid email address provided'
      },
      {
        name: 'Has Phone',
        category: 'behavioral',
        points: 5,
        met: !!lead.phone,
        description: 'Phone number provided'
      },
      
      // Engagement scoring
      {
        name: 'High Priority Status',
        category: 'engagement',
        points: 20,
        met: lead.status_bucket === 'P1',
        description: 'Lead marked as high priority (P1)'
      },
      {
        name: 'Medium Priority Status',
        category: 'engagement',
        points: 10,
        met: lead.status_bucket === 'P2',
        description: 'Lead marked as medium priority (P2)'
      },
      {
        name: 'Has Tags',
        category: 'engagement',
        points: 5,
        met: !!(lead.tags && lead.tags.length > 0),
        description: 'Lead has been tagged for categorization'
      },
      {
        name: 'Has Notes',
        category: 'engagement',
        points: 5,
        met: !!lead.notes,
        description: 'Additional notes have been added'
      },
      {
        name: 'Follow-up Scheduled',
        category: 'engagement',
        points: 15,
        met: !!lead.follow_up_due_date,
        description: 'Follow-up activity has been scheduled'
      }
    ];

    // Filter only met criteria and calculate score
    const metCriteria = scoringCriteria.filter(c => c.met);
    const calculatedScore = metCriteria.reduce((total, criterion) => total + criterion.points, 0);
    
    // Determine qualification status based on score
    let newQualification = 'unqualified';
    if (calculatedScore >= 80) {
      newQualification = 'opportunity';
    } else if (calculatedScore >= 50) {
      newQualification = 'sales_qualified';
    } else if (calculatedScore >= 25) {
      newQualification = 'marketing_qualified';
    }

    setCriteria(scoringCriteria);
    setScore(calculatedScore);
    setQualification(newQualification);
    setIsCalculating(false);

    // Auto-save the calculated score
    updateScoreMutation.mutate({
      leadId: lead.id,
      newScore: calculatedScore,
      newQualification: newQualification
    });
  };

  useEffect(() => {
    calculateLeadScore();
  }, [lead.id]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 50) return 'text-blue-600 bg-blue-100';
    if (score >= 25) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getQualificationBadge = (qual: string) => {
    const badges = {
      'unqualified': { color: 'bg-gray-100 text-gray-800', label: 'Unqualified' },
      'marketing_qualified': { color: 'bg-yellow-100 text-yellow-800', label: 'Marketing Qualified' },
      'sales_qualified': { color: 'bg-blue-100 text-blue-800', label: 'Sales Qualified' },
      'opportunity': { color: 'bg-green-100 text-green-800', label: 'Opportunity' }
    };
    
    return badges[qual as keyof typeof badges] || badges.unqualified;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'firmographic': return <ChartBarIcon className="h-4 w-4" />;
      case 'demographic': return <StarIcon className="h-4 w-4" />;
      case 'behavioral': return <ArrowTrendingUpIcon className="h-4 w-4" />;
      case 'engagement': return <SparklesIcon className="h-4 w-4" />;
      default: return <StarIcon className="h-4 w-4" />;
    }
  };

  const qualificationBadge = getQualificationBadge(qualification);

  return (
    <div className="space-y-6">
      {/* Score Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Lead Score</h3>
          <Button 
            onClick={calculateLeadScore}
            disabled={isCalculating}
            size="sm"
            variant="outline"
          >
            {isCalculating ? 'Calculating...' : 'Recalculate'}
          </Button>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="text-center">
            <div className={`text-3xl font-bold rounded-full w-20 h-20 flex items-center justify-center ${getScoreColor(score)}`}>
              {score}
            </div>
            <p className="text-sm text-gray-500 mt-2">Score</p>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Qualification Status</span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${qualificationBadge.color}`}>
                {qualificationBadge.label}
              </span>
            </div>
            
            {/* Score Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-blue-500' : score >= 25 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min((score / 100) * 100, 100)}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0</span>
              <span>25</span>
              <span>50</span>
              <span>80</span>
              <span>100+</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scoring Criteria Breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">Scoring Breakdown</h4>
        
        <div className="space-y-4">
          {['firmographic', 'demographic', 'behavioral', 'engagement'].map(category => {
            const categoryCriteria = criteria.filter(c => c.category === category);
            const metCount = categoryCriteria.filter(c => c.met).length;
            const totalPoints = categoryCriteria.filter(c => c.met).reduce((sum, c) => sum + c.points, 0);
            
            return (
              <div key={category} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getCategoryIcon(category)}
                    <h5 className="font-medium text-gray-900 capitalize">{category}</h5>
                  </div>
                  <div className="text-sm text-gray-600">
                    {metCount}/{categoryCriteria.length} criteria met · {totalPoints} points
                  </div>
                </div>
                
                <div className="space-y-2">
                  {categoryCriteria.map((criterion, idx) => (
                    <div key={idx} className={`flex items-center justify-between p-2 rounded ${criterion.met ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${criterion.met ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span className={`text-sm ${criterion.met ? 'text-green-900' : 'text-gray-600'}`}>
                          {criterion.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs ${criterion.met ? 'text-green-600' : 'text-gray-400'}`}>
                          +{criterion.points} pts
                        </span>
                        {criterion.met && <span className="text-green-500 text-xs">✓</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scoring Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h5 className="font-medium text-blue-900 mb-2">💡 Improve Lead Score</h5>
        <ul className="text-sm text-blue-800 space-y-1">
          {criteria.filter(c => !c.met).slice(0, 3).map((criterion, idx) => (
            <li key={idx}>• {criterion.description}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};