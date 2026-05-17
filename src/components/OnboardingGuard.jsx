import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { appClient } from '@/api/localClient';
import { Navigate } from 'react-router-dom';

export default function OnboardingGuard({ children }) {
  const { data: profiles, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => appClient.entities.UserProfile.list('-created_date', 50),
  });

  if (isLoading || (isFetching && !profiles)) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background px-6">
        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">Could not load your profile data.</p>
          <button onClick={() => refetch()} className="text-xs text-primary font-medium">Retry</button>
        </div>
      </div>
    );
  }

  const profileList = profiles || [];
  const hasCompletedOnboarding = profileList.some((p) => Boolean(p?.onboardingComplete));
  if (!hasCompletedOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}
