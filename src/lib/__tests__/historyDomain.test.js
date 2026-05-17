import { describe, expect, it } from 'vitest';
import { filterMeasurementMetrics, groupMeals, makeRangeSummary } from '@/lib/historyDomain';

describe('historyDomain', () => {
  it('aggregates meal totals', () => {
    const out = groupMeals([
      { calories: 500, protein: 30, carbs: 40, fat: 20 },
      { calories: 300, protein: 20, carbs: 10, fat: 10 },
    ]);
    expect(out).toEqual({ calories: 800, protein: 50, carbs: 50, fat: 30 });
  });

  it('filters out photo-only metric rows', () => {
    const rows = [
      { id: 'm1', progressPhotoUrl: 'x' },
      { id: 'm2', bodyweightKg: 80 },
    ];
    expect(filterMeasurementMetrics(rows).map((r) => r.id)).toEqual(['m2']);
  });

  it('creates date-range summary', () => {
    const summary = makeRangeSummary({
      daysBack: 7,
      sessions: [{ date: '2026-05-16', status: 'completed' }],
      meals: [{ date: '2026-05-16', calories: 500, protein: 40 }],
      hydration: [{ date: '2026-05-16', amountMl: 1000 }],
      metrics: [
        { date: '2026-05-11', bodyweightKg: 80 },
        { date: '2026-05-16', bodyweightKg: 79 },
      ],
    });
    expect(summary.dayCount).toBe(1);
    expect(summary.cals).toBe(500);
    expect(summary.protein).toBe(40);
    expect(summary.water).toBe(1000);
    expect(summary.weightDelta).not.toBeNull();
    expect(typeof summary.weightDelta).toBe('number');
  });
});
