// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please check your credentials.');
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold font-display text-foreground">Welcome Back!</h1>
        <p className="text-muted-foreground">Please sign in to continue.</p>
      </div>
      {error && (
        <div className="mb-4 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          {error}
        </div>
      )}
      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-1">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2.5 border border-input bg-background sm:bg-input rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary sm:text-sm transition-colors duration-150"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password"className="block text-sm font-medium text-muted-foreground mb-1">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2.5 border border-input bg-background sm:bg-input rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary sm:text-sm transition-colors duration-150"
            placeholder="••••••••"
          />
          {/* Optional: Add Forgot Password link here */}
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-60 transition-opacity duration-150"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </div>
      </form>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Don't have an account?{' '}
        <Link to="/signup" className="font-medium text-primary hover:text-primary/80 underline underline-offset-2 transition-colors">
          Sign up
        </Link>
      </p>
    </>
  );
};

export default LoginPage; 