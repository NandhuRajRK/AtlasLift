import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import OnboardingGuard from '@/components/OnboardingGuard';

const mockList = vi.fn();

vi.mock('@/api/localClient', () => ({
  appClient: {
    entities: {
      UserProfile: {
        list: (...args) => mockList(...args),
      },
    },
  },
}));

vi.mock('react-router-dom', () => ({
  Navigate: ({ to }) => <div data-testid="navigate">{to}</div>,
}));

function wrap(ui) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{ui}</QueryClientProvider>;
}

describe('OnboardingGuard', () => {
  it('redirects to onboarding when profile is incomplete', async () => {
    mockList.mockResolvedValueOnce([{ id: 'p1', onboardingComplete: false }]);
    render(wrap(<OnboardingGuard><div>app</div></OnboardingGuard>));
    await waitFor(() => expect(screen.getByTestId('navigate')).toHaveTextContent('/onboarding'));
  });

  it('renders children when onboarding is complete', async () => {
    mockList.mockResolvedValueOnce([{ id: 'p1', onboardingComplete: true }]);
    render(wrap(<OnboardingGuard><div>app</div></OnboardingGuard>));
    await waitFor(() => expect(screen.getByText('app')).toBeInTheDocument());
  });
});

