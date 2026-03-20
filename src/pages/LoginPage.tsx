// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';

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
      let errorMessage = 'Failed to login. Please check your credentials.';
      if (err instanceof Error) {
        if (err.message && err.message !== '{}' && err.message !== '[object Object]') {
          errorMessage = err.message;
        }
      } else if (typeof err === 'string' && err.trim() !== '' && err !== '{}') {
        errorMessage = err;
      } else if (err?.message && typeof err.message === 'string' && err.message !== '{}') {
        errorMessage = err.message;
      }
      
      // Check for Supabase 5xx network timeout errors.
      if (err?.name === 'AuthRetryableFetchError' || errorMessage.includes('Failed to fetch')) {
        errorMessage = 'Network timeout: The Supabase server is currently unavailable or taking too long to respond. Please try again later.';
      }
      
      setError(errorMessage);
      console.error('Login error:', err);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-left">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">Welcome Back</h2>
        <p className="text-muted-foreground mt-2 text-lg">Please sign in to your account.</p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm p-3 rounded-md">
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
              placeholder="you@example.com"
            className="block w-full px-4 py-2.5 border border-input bg-background rounded-lg shadow-sm placeholder-muted-foreground/70 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow duration-150"
            />
          </div>

          <div>
          <label htmlFor="password" className="block text-sm font-medium text-muted-foreground mb-1">
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
              placeholder="••••••••"
            className="block w-full px-4 py-2.5 border border-input bg-background rounded-lg shadow-sm placeholder-muted-foreground/70 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow duration-150"
            />
          </div>

        <Button 
              type="submit"
              disabled={loading}
          className="w-full py-3 text-base font-semibold transition-transform duration-150 ease-in-out hover:scale-[1.02] active:scale-[0.98]"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Signing in...
            </>
          ) : (
            'Login'
          )}
        </Button>
        </form>

      {/* Signup link removed as per requirement to disable public signups
      <p className="text-left text-sm text-muted-foreground mt-6">
        Don't have an account?{' '}
        <Link to="/signup" className="font-semibold text-primary hover:text-primary/80 transition-colors">
          Sign up
        </Link>
      </p>
      */}
    </div>
  );
};

export default LoginPage; 