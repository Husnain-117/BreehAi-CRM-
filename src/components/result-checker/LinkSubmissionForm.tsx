import { useState } from 'react';
import { saveUserLinks } from '../../utils/supabaseClient';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { toast } from 'sonner';

interface LinkSubmissionFormProps {
  email: string;
  onSuccess?: () => void;
}

function LinkSubmissionForm({ email, onSuccess }: LinkSubmissionFormProps) {
  const [instagramLink, setInstagramLink] = useState('');
  const [linkedinLink, setLinkedinLink] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await saveUserLinks(email, instagramLink, linkedinLink);
      toast.success('Links saved successfully!');
      setInstagramLink('');
      setLinkedinLink('');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error('Error saving links: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        type="url"
        placeholder="https://www.instagram.com/yourpost"
        value={instagramLink}
        onChange={e => setInstagramLink(e.target.value)}
        required
        className="w-full"
      />
      <p className="text-xs text-gray-500 mt-1">
        Format: <span className="font-mono">https://www.instagram.com/yourpost</span><br />
        Example: <span className="font-mono">https://www.instagram.com/p/abc123xyz/</span>
      </p>
      <Input
        type="url"
        placeholder="https://www.linkedin.com/in/yourprofile"
        value={linkedinLink}
        onChange={e => setLinkedinLink(e.target.value)}
        required
        className="w-full"
      />
      <p className="text-xs text-gray-500 mt-1">
        Format: <span className="font-mono">https://www.linkedin.com/in/yourprofile</span><br />
        Example: <span className="font-mono">https://www.linkedin.com/in/johndoe/</span>
      </p>
      <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-yellow-400 to-red-500 hover:from-yellow-500 hover:to-red-600">
        {loading ? 'Saving...' : 'Save Links'}
      </Button>
    </form>
  );
}

export default LinkSubmissionForm;
