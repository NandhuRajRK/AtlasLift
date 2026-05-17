import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Meals from '@/pages/Meals';

const mockProfileList = vi.fn();
const mockMealFilter = vi.fn();
const mockMealList = vi.fn();
const mockMealDelete = vi.fn();
const mockToast = vi.fn();

vi.mock('@/api/localClient', () => ({
  appClient: {
    entities: {
      UserProfile: { list: (...args) => mockProfileList(...args) },
      MealLog: {
        filter: (...args) => mockMealFilter(...args),
        list: (...args) => mockMealList(...args),
        delete: (...args) => mockMealDelete(...args),
      },
    },
  },
}));

vi.mock('@/components/ui/use-toast', () => ({
  toast: (...args) => mockToast(...args),
}));

function wrap(ui) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{ui}</QueryClientProvider>;
}

describe('Meals undo delete flow', () => {
  beforeEach(() => {
    mockProfileList.mockResolvedValue([{ id: 'p1', calorieTarget: 2200, proteinTarget: 160 }]);
    mockMealFilter.mockResolvedValue([{ id: 'm1', name: 'Chicken', date: '2026-05-17', mealType: 'lunch', calories: 500, protein: 40, carbs: 50, fat: 10 }]);
    mockMealList.mockResolvedValue([]);
    mockMealDelete.mockResolvedValue({ success: true });
    mockToast.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('cancels deletion when Undo is clicked from toast action', async () => {
    render(wrap(<Meals />));
    await waitFor(() => expect(screen.getByText('Chicken')).toBeInTheDocument());
    const mealLabel = screen.getByText('Chicken');
    const mealCard = mealLabel.closest('.bg-card');
    const rowButtons = mealCard.querySelectorAll('button');
    const deleteButton = rowButtons[rowButtons.length - 1];
    vi.useFakeTimers();
    fireEvent.click(deleteButton);

    const toastPayload = mockToast.mock.calls[0][0];
    toastPayload.action.props.onClick();
    vi.advanceTimersByTime(6000);

    expect(mockMealDelete).not.toHaveBeenCalled();
  });
});
