import React, { useState, useRef } from 'react';
import { Instagram, Linkedin, Camera, Star } from 'lucide-react';
import html2canvas from 'html2canvas';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Progress } from '../ui/progress';
import { CandidateData, updateCandidateData } from '../../utils/googleSheets';
import LinkSubmissionForm from './LinkSubmissionForm';

interface VerificationStepsProps {
  result: CandidateData;
  onUpdate: () => void;
}

const VerificationSteps: React.FC<VerificationStepsProps> = ({ result, onUpdate }) => {
  const [instagramHandle, setInstagramHandle] = useState(result.instagramHandle || '');
  const [instagramPostLink, setInstagramPostLink] = useState(result.instagramPostLink || '');
  const [linkedinPostLink, setLinkedinPostLink] = useState(result.linkedinPostLink || '');
  const [showLeadName, setShowLeadName] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const progress = [
    result.instagramHandle ? 25 : 0,
    result.instagramFollowed ? 50 : 0,
    result.linkedinShared ? 75 : 0,
    showLeadName ? 100 : 0
  ].reduce((a, b) => a + b, 0);

  const handleInstagramSubmit = async () => {
    if (!instagramHandle) {
      toast.error('Please enter your Instagram handle');
      return;
    }

    const success = await updateCandidateData(result.email, {
      instagramHandle,
      instagramFollowed: true
    });

    if (success) {
      toast.success('Instagram handle saved!');
      onUpdate();
    }
  };

  const handleCaptureScreenshot = async () => {
    if (!resultRef.current) return;

    try {
      const canvas = await html2canvas(resultRef.current);
      const link = document.createElement('a');
      link.download = `trendtial-internship-result-${result.name}.png`;
      link.href = canvas.toDataURL();
      link.click();
      toast.success('Screenshot captured!');
    } catch (error) {
      toast.error('Failed to capture screenshot');
    }
  };

  const handleLinkedInShare = () => {
    const text = encodeURIComponent('Thrilled to be selected for the @Trendtial email marketing internship! #Internship #Marketing');
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}&summary=${text}`, '_blank');
  };

  const handleVerifyLinks = async () => {
    if (!instagramPostLink || !linkedinPostLink) {
      toast.error('Please provide both Instagram and LinkedIn post links');
      return;
    }

    if (!instagramPostLink.includes('instagram.com') || !linkedinPostLink.includes('linkedin.com')) {
      toast.error('Please provide valid Instagram and LinkedIn post links');
      return;
    }

    const success = await updateCandidateData(result.email, {
      instagramPostLink,
      linkedinPostLink,
      linkedinShared: true
    });

    if (success) {
      setShowLeadName(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      toast.success('Links verified! Lead name unlocked!');
      onUpdate();
    }
  };

  return (
    <div className="space-y-6 mt-8">
      <Progress value={progress} className="h-2" />
      
      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-red-500 mb-3 flex items-center gap-2">
            <Instagram className="h-5 w-5" /> Instagram Verification
          </h3>
          <div className="space-y-3">
            <Input
              placeholder="Enter your Instagram handle"
              value={instagramHandle}
              onChange={(e) => setInstagramHandle(e.target.value)}
              className="focus:ring-2 focus:ring-red-500 transition-all"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleInstagramSubmit}
                className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
              >
                Submit Handle
              </Button>
              <Button
                onClick={() => window.open('https://instagram.com/trendtialmarketing', '_blank')}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 animate-pulse"
              >
                Follow @trendtialmarketing
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-red-500 mb-3 flex items-center gap-2">
            <Linkedin className="h-5 w-5" /> Share Your Success
          </h3>
          <div className="space-y-3">
            <Button
              onClick={handleCaptureScreenshot}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              <Camera className="h-4 w-4 mr-2" /> Capture Your Win!
            </Button>
            <div className="text-sm text-gray-600 italic animate-slide-in">
              Blast this news on LinkedIn! Use: "Thrilled to be selected for the @Trendtial email marketing internship! #Internship #Marketing"
            </div>
            <Button
              onClick={handleLinkedInShare}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 animate-spin-slow"
            >
              <Linkedin className="h-4 w-4 mr-2" /> Share on LinkedIn
            </Button>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-red-500 mb-3 flex items-center gap-2">
            <Star className="h-5 w-5" /> Prove Your Hype!
          </h3>
          <div className="space-y-3">
            <LinkSubmissionForm email={result.email} onSuccess={() => {/* do something */}} />
          </div>
        </div>

        {showLeadName && (
          <div className="bg-gradient-to-r from-yellow-400 to-red-500 p-4 rounded-lg text-white animate-fade-in">
            <h3 className="font-bold text-xl mb-2">Your Lead:</h3>
            <p className="text-2xl font-bold">{result.leadName}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerificationSteps; 