// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
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
      setError(err.message || 'Failed to login. Please check your credentials.');
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6"> {/* animate-fadeIn was removed from here previously, which is good for now */}
      <div className="text-center">
        <h2 className="text-3xl font-semibold text-foreground">Welcome Back!</h2>
        <p className="text-muted-foreground mt-1">Please sign in to continue.</p>
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

      <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
        <Link to="/signup" className="font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded">
            Sign up
          </Link>
        </p>
    </div>
  );
};

export default LoginPage; 