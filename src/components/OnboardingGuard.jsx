import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { appClient } from '@/api/localClient';
import { Navigate } from 'react-router-dom';

export default function OnboardingGuard({ children }) {
  const { data: profiles, isLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => appClient.entities.UserProfile.list(),
    initialData: [],
  });

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const profile = profiles[0];
  if (!profile || !profile.onboardingComplete) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}