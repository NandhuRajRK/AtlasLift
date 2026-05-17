import { describe, expect, it } from 'vitest';
import { computeProgressInsights } from '@/lib/progressDomain';

describe('progressDomain', () => {
  it('returns goal cards and highlights for goal type', () => {
    const result = computeProgressInsights({
      metrics: [{ date: '2026-05-16', bodyweightKg: 80, waistCm: 85 }],
      sessions: [{ id: 's1', date: '2026-05-16', status: 'completed' }],
      sets: [{ workoutSessionId: 's1', exerciseName: 'Squat', weightKg: 100, reps: 5 }],
      meals: [{ date: '2026-05-16', calories: 2200, protein: 160 }],
      hydrationEntries: [{ date: '2026-05-16', amountMl: 3000 }],
      profile: { goalType: 'strength', waterTargetMl: 3000, trainingDaysPerWeek: 4 },
      goalType: 'strength',
      showAdvancedMeasurements: false,
    });

    expect(result.cards.length).toBeGreaterThan(0);
    expect(result.prHighlights.length).toBeGreaterThan(0);
    expect(result.circumferenceCards[0].label).toBe('Waist');
  });
});

