import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegistered';

import MobileShell from '@/components/layout/MobileShell';
import Today from '@/pages/Today';
import Workout from '@/pages/Workout';
import Meals from '@/pages/Meals';
import Water from '@/pages/Water';
import Progress from '@/pages/Progress';
import Profile from '@/pages/Profile';
import Programs from '@/pages/Programs';
import Onboarding from '@/pages/Onboarding';
import OnboardingGuard from '@/components/OnboardingGuard';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-xs font-bold tracking-widest text-primary uppercase mb-4">Atlas Lift</div>
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <OnboardingGuard>
      <Routes>
        <Route element={<MobileShell />}>
          <Route path="/" element={<Today />} />
          <Route path="/workout" element={<Workout />} />
          <Route path="/meals" element={<Meals />} />
          <Route path="/water" element={<Water />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/programs" element={<Programs />} />
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </OnboardingGuard>
  );
};


function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <Routes>
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="*" element={<AuthenticatedApp />} />
          </Routes>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
