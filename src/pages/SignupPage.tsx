// src/pages/SignupPage.tsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const SignupPage: React.FC = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setMessage(null);
      return;
    }
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const { data, error: signupError } = await signup(email, password, fullName);

      if (signupError) {
        setError(signupError.message || 'Signup failed. Please try again.');
      } else if (data?.user?.identities?.length === 0) {
         setError("This email may already be registered but unverified. Try logging in or resetting password if confirmed.");
      } else if (data?.user) {
        setMessage("Signup successful! Please check your email for a confirmation link to complete your registration, then login.");
        // Clear form or redirect to a message page
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setFullName('');
        // navigate('/login'); // Or navigate to a page that says "check your email"
      } else {
        setError("An unexpected error occurred during signup. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold font-display text-foreground">Create Your Account</h1>
        <p className="text-muted-foreground">Join us and get started!</p>
      </div>

      {error && (
        <div className="mb-4 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          {error}
        </div>
      )}
      {message && (
        <div className="mb-4 text-sm text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-700/30 p-3 rounded-md">
          {message}
        </div>
      )}

      {!message && ( // Only show form if there's no success message
        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-muted-foreground mb-1">Full Name</label>
            <input 
              id="fullName" 
              name="fullName" 
              type="text" 
              required 
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 block w-full px-3 py-2.5 border border-input bg-background sm:bg-input rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary sm:text-sm transition-colors duration-150"
              placeholder="Your Full Name"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-1">Email address</label>
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
            <label htmlFor="password"className="block text-sm font-medium text-muted-foreground mb-1">Password</label>
            <input 
              id="password" 
              name="password" 
              type="password" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2.5 border border-input bg-background sm:bg-input rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary sm:text-sm transition-colors duration-150"
              placeholder="Create a password (min. 6 characters)"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword"className="block text-sm font-medium text-muted-foreground mb-1">Confirm Password</label>
            <input 
              id="confirmPassword" 
              name="confirmPassword" 
              type="password" 
              required 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2.5 border border-input bg-background sm:bg-input rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary sm:text-sm transition-colors duration-150"
              placeholder="Confirm your password"
            />
          </div>
          <div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-60 transition-opacity duration-150">
              {loading ? 'Signing up...' : 'Create Account'}
            </button>
          </div>
        </form>
      )}

      <p className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
        <Link to="/login" className="font-medium text-primary hover:text-primary/80 underline underline-offset-2 transition-colors">
            Login
          </Link>
        </p>
    </>
  );
};

export default SignupPage; 