import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import WorkoutSummary from '@/components/workout/WorkoutSummary';

const mockFilterSets = vi.fn();
const mockListDays = vi.fn();

vi.mock('@/api/localClient', () => ({
  appClient: {
    entities: {
      WorkoutSet: { filter: (...args) => mockFilterSets(...args) },
      ProgramDay: { list: (...args) => mockListDays(...args) },
    },
  },
}));

function wrap(ui) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{ui}</QueryClientProvider>;
}

describe('WorkoutSummary', () => {
  it('shows canonical program day name when mapped by programDayId', async () => {
    mockFilterSets.mockResolvedValueOnce([]);
    mockListDays.mockResolvedValueOnce([{ id: 'd1', dayName: 'Day 1 Push' }]);
    render(wrap(<WorkoutSummary session={{ id: 's1', name: 'Quick Workout', date: '2026-05-17', programDayId: 'd1' }} onClose={() => {}} />));
    await waitFor(() => expect(screen.getByText('Day 1 Push')).toBeInTheDocument());
  });
});

