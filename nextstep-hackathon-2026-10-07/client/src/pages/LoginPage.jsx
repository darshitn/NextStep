import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SignInForm from '../components/SignInForm.jsx';
import ErrorNotice from '../components/ErrorNotice.jsx';
import { apiService } from '../services/apiService.js';

export default function LoginPage({ onUserAuthenticated }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSignIn = async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const { user } = await apiService.signIn(email, password);
      onUserAuthenticated(user);

      // Check if user already has an active goal
      const res = await apiService.getGoal();
      if (res?.data?.goal) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err.message || 'Failed to authenticate student account.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-8 sm:py-16 flex flex-col items-center justify-center">
      <SignInForm
        onSignIn={handleSignIn}
        demoAccounts={apiService.demoAccounts}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
}
