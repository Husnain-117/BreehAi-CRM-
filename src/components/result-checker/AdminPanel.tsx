import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { FaInstagram, FaLinkedin } from 'react-icons/fa';

export default function AdminPanel() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch all candidates from Supabase
  const fetchRows = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('user_links')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      alert('Error fetching data: ' + error.message);
    } else {
      setRows(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRows();
    // Subscribe to changes for real-time updates
    const channel = supabase
      .channel('user_links_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_links' },
        fetchRows
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="overflow-x-auto bg-white rounded-2xl shadow-2xl p-6 border border-gray-100 max-w-5xl mx-auto">
      <h2 className="text-2xl font-extrabold mb-6 text-center text-gradient bg-gradient-to-r from-red-500 via-yellow-400 to-red-500 bg-clip-text text-transparent">
        All Candidate Submissions
      </h2>
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <svg className="animate-spin h-8 w-8 text-red-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="bg-gradient-to-r from-yellow-100 to-red-100 sticky top-0 z-10">
                <th className="px-4 py-2 text-left font-bold text-gray-700">Email</th>
                <th className="px-4 py-2 text-left font-bold text-gray-700">Instagram Handle</th>
                <th className="px-4 py-2 text-left font-bold text-gray-700">Instagram Link</th>
                <th className="px-4 py-2 text-left font-bold text-gray-700">LinkedIn Link</th>
                <th className="px-4 py-2 text-left font-bold text-gray-700">Submitted At</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">No submissions yet.</td>
                </tr>
              )}
              {rows.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  className={`transition-all duration-200 hover:bg-yellow-50 hover:shadow-lg ${idx % 2 === 0 ? 'bg-white' : 'bg-red-50'}`}
                >
                  <td className="px-4 py-2 rounded-l-xl font-medium">{row.email}</td>
                  <td className="px-4 py-2">{row.instagram_handle}</td>
                  <td className="px-4 py-2">
                    {row.instagram_link && (
                      <a
                        href={row.instagram_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-pink-600 hover:underline"
                      >
                        <FaInstagram className="inline-block" /> Instagram
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {row.linkedin_link && (
                      <a
                        href={row.linkedin_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-700 hover:underline"
                      >
                        <FaLinkedin className="inline-block" /> LinkedIn
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-2 rounded-r-xl text-gray-500">
                    {row.created_at ? new Date(row.created_at).toLocaleString() : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
