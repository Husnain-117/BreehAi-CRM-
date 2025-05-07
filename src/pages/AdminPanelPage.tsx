import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminPanel from '../components/result-checker/AdminPanel';

export default function AdminPanelPage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('admin_logged_in') !== 'true') {
      navigate('/admin-login');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-red-50 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-red-600 mb-8">Admin Dashboard</h1>
        <button
          onClick={() => {
            localStorage.removeItem('admin_logged_in');
            window.location.href = '/admin-login';
          }}
          className="absolute top-4 right-4 bg-gray-200 text-red-600 px-3 py-1 rounded hover:bg-red-100"
        >
          Logout
        </button>
        <AdminPanel />
      </div>
    </div>
  );
}