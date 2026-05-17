import { describe, expect, it } from 'vitest';
import { calculateWeeklyLoadChange, resolveSessionDisplayName } from '@/lib/workoutDomain';

describe('workoutDomain', () => {
  it('resolves session display name from program day map first', () => {
    const map = new Map([['d1', { id: 'd1', dayName: 'Day 1 Push' }]]);
    expect(resolveSessionDisplayName({ name: 'Quick Workout', programDayId: 'd1' }, map)).toBe('Day 1 Push');
    expect(resolveSessionDisplayName({ name: 'Quick Workout', programDayId: 'x' }, map)).toBe('Quick Workout');
  });

  it('calculates weekly load delta across current and previous windows', () => {
    const allSets = [
      { workoutSessionId: 's1', weightKg: 100, reps: 5 },
      { workoutSessionId: 's2', weightKg: 80, reps: 5 },
    ];
    const sessionById = new Map([
      ['s1', { id: 's1', status: 'completed', date: '2026-05-16' }],
      ['s2', { id: 's2', status: 'completed', date: '2026-05-08' }],
    ]);
    const result = calculateWeeklyLoadChange({
      allSets,
      sessionById,
      currentWeekStart: new Date('2026-05-11'),
      prevWeekStart: new Date('2026-05-04'),
      prevWeekEnd: new Date('2026-05-10'),
    });
    expect(result.currentWeekLoad).toBe(500);
    expect(result.previousWeekLoad).toBe(400);
    expect(Math.round(result.loadChangePct)).toBe(25);
  });
});

