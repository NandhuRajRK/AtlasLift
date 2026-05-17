import { parseISO, subDays } from 'date-fns';

export function groupMeals(meals = []) {
  return meals.reduce(
    (acc, m) => {
      acc.calories += Number(m.calories || 0);
      acc.protein += Number(m.protein || 0);
      acc.carbs += Number(m.carbs || 0);
      acc.fat += Number(m.fat || 0);
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

export function filterMeasurementMetrics(metrics = []) {
  return metrics.filter((m) =>
    ['bodyweightKg', 'waistCm', 'chestCm', 'armCm', 'thighCm'].some((k) => Number.isFinite(Number(m[k])))
  );
}

export function makeRangeSummary({ daysBack, sessions = [], meals = [], hydration = [], metrics = [] }) {
  const startDate = subDays(new Date(), daysBack - 1);
  const include = (d) => {
    if (!d) return false;
    const parsed = parseISO(d);
    return !Number.isNaN(parsed.getTime()) && parsed >= startDate;
  };

  const completed = sessions.filter((s) => s.status === 'completed' && include(s.date));
  const dayCount = new Set(completed.map((s) => s.date)).size;
  const cals = meals.filter((m) => include(m.date)).reduce((sum, m) => sum + Number(m.calories || 0), 0);
  const protein = meals.filter((m) => include(m.date)).reduce((sum, m) => sum + Number(m.protein || 0), 0);
  const water = hydration.filter((h) => include(h.date)).reduce((sum, h) => sum + Number(h.amountMl || 0), 0);
  const periodMetrics = metrics.filter((m) => include(m.date) && Number.isFinite(Number(m.bodyweightKg)));
  const latest = periodMetrics.length ? Number(periodMetrics[0].bodyweightKg || 0) : null;
  const oldest = periodMetrics.length ? Number(periodMetrics[periodMetrics.length - 1].bodyweightKg || 0) : null;
  const weightDelta = latest != null && oldest != null ? latest - oldest : null;

  return { dayCount, cals, protein, water, weightDelta };
}

