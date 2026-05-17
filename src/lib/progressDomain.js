import { format, parseISO, subDays } from 'date-fns';

export function computeProgressInsights({
  metrics = [],
  sessions = [],
  sets = [],
  meals = [],
  hydrationEntries = [],
  profile = {},
  goalType = 'general_fitness',
  showAdvancedMeasurements = false,
  photoLimit = 20,
}) {
  const sevenDaysAgo = subDays(new Date(), 6);
  const twentyEightDaysAgo = subDays(new Date(), 27);
  const weekDateSet = new Set(Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), i), 'yyyy-MM-dd')));
  const periodDateSet = new Set(Array.from({ length: 28 }, (_, i) => format(subDays(new Date(), i), 'yyyy-MM-dd')));

  const completedSessions = sessions.filter((s) => s.status === 'completed');
  const weekSessions = completedSessions.filter((s) => s.date && parseISO(s.date) >= sevenDaysAgo);
  const periodSessions = completedSessions.filter((s) => s.date && parseISO(s.date) >= twentyEightDaysAgo);

  const sessionMap = new Map(sessions.map((s) => [s.id, s]));
  const weekSets = sets.filter((st) => {
    const session = sessionMap.get(st.workoutSessionId);
    if (!session?.date || session.status !== 'completed') return false;
    return parseISO(session.date) >= sevenDaysAgo;
  });

  const weeklyVolumeSets = weekSets.filter((st) => Number(st.reps) > 0).length;
  const weeklyLoad = weekSets.reduce((sum, st) => sum + Number(st.weightKg || 0) * Number(st.reps || 0), 0);

  const prByExercise = new Map();
  sets.forEach((st) => {
    const name = st.exerciseName || 'Unknown';
    const score = Number(st.weightKg || 0) * 1000 + Number(st.reps || 0);
    const existing = prByExercise.get(name);
    if (!existing || score > existing.score) {
      prByExercise.set(name, { name, weight: Number(st.weightKg || 0), reps: Number(st.reps || 0), score });
    }
  });
  const prHighlights = Array.from(prByExercise.values())
    .filter((pr) => pr.weight > 0 || pr.reps > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const mealsByDate = meals.reduce((acc, m) => {
    if (!m.date) return acc;
    if (!acc[m.date]) acc[m.date] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    acc[m.date].calories += Number(m.calories || 0);
    acc[m.date].protein += Number(m.protein || 0);
    acc[m.date].carbs += Number(m.carbs || 0);
    acc[m.date].fat += Number(m.fat || 0);
    return acc;
  }, {});

  const waterByDate = hydrationEntries.reduce((acc, h) => {
    if (!h.date) return acc;
    acc[h.date] = (acc[h.date] || 0) + Number(h.amountMl || 0);
    return acc;
  }, {});

  const weeklyDatesWithWorkout = new Set(weekSessions.map((s) => s.date));
  const weeklyWorkoutDays = weeklyDatesWithWorkout.size;
  const workoutStreak = (() => {
    const workoutDates = new Set(completedSessions.map((s) => s.date));
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      if (workoutDates.has(date)) streak += 1;
      else break;
    }
    return streak;
  })();

  const calorieTarget = Number(profile.calorieTarget || 2200);
  const proteinTarget = Number(profile.proteinTarget || 160);
  const waterTarget = Number(profile.waterTargetMl || 3000);
  const plannedDaysPerWeek = Number(profile.trainingDaysPerWeek || 4);

  const periodMealDates = Object.keys(mealsByDate).filter((d) => periodDateSet.has(d));
  const nutritionAdherenceDays = periodMealDates.filter((d) => {
    const day = mealsByDate[d];
    const calWithin = day.calories >= calorieTarget * 0.9 && day.calories <= calorieTarget * 1.1;
    const proteinMet = day.protein >= proteinTarget * 0.9;
    return calWithin && proteinMet;
  }).length;
  const nutritionAdherencePct = periodMealDates.length > 0 ? Math.round((nutritionAdherenceDays / periodMealDates.length) * 100) : 0;

  const weeklyMealDates = Object.keys(mealsByDate).filter((d) => weekDateSet.has(d));
  const weeklyCals = weeklyMealDates.map((d) => mealsByDate[d].calories);
  const weeklyProtein = weeklyMealDates.map((d) => mealsByDate[d].protein);
  const avgCals7d = weeklyCals.length ? Math.round(weeklyCals.reduce((a, b) => a + b, 0) / weeklyCals.length) : 0;
  const avgProtein7d = weeklyProtein.length ? Math.round(weeklyProtein.reduce((a, b) => a + b, 0) / weeklyProtein.length) : 0;
  const calorieVariance = weeklyCals.length
    ? Math.round(Math.sqrt(weeklyCals.reduce((sum, v) => sum + (v - avgCals7d) ** 2, 0) / weeklyCals.length))
    : 0;

  const hydrationDaysMet = Object.keys(waterByDate).filter((d) => periodDateSet.has(d) && waterByDate[d] >= waterTarget).length;
  const hydrationTrackedDays = Object.keys(waterByDate).filter((d) => periodDateSet.has(d)).length;
  const hydrationAdherencePct = hydrationTrackedDays > 0 ? Math.round((hydrationDaysMet / hydrationTrackedDays) * 100) : 0;

  const weights = [...metrics]
    .filter((m) => m.date && Number.isFinite(Number(m.bodyweightKg)))
    .sort((a, b) => a.date.localeCompare(b.date));
  const weights7d = weights.filter((m) => parseISO(m.date) >= sevenDaysAgo);
  const weightAvg7d = weights7d.length ? weights7d.reduce((sum, m) => sum + Number(m.bodyweightKg), 0) / weights7d.length : null;
  const latestWeight = weights.length ? Number(weights[weights.length - 1].bodyweightKg || 0) : null;
  const weightTrend7d = latestWeight != null && weightAvg7d != null ? latestWeight - weightAvg7d : null;

  const latestMetric = weights.length ? weights[weights.length - 1] : null;
  const baselineMetric = [...weights].reverse().find((m) => parseISO(m.date) <= twentyEightDaysAgo) || (weights.length ? weights[0] : null);
  const weightDelta4w = latestMetric && baselineMetric ? Number(latestMetric.bodyweightKg || 0) - Number(baselineMetric.bodyweightKg || 0) : null;
  const waistSeries = [...metrics].filter((m) => Number.isFinite(Number(m.waistCm))).sort((a, b) => a.date.localeCompare(b.date));
  const latestWaist = waistSeries.length ? Number(waistSeries[waistSeries.length - 1].waistCm || 0) : null;
  const baselineWaist = [...waistSeries].reverse().find((m) => parseISO(m.date) <= twentyEightDaysAgo) || (waistSeries.length ? waistSeries[0] : null);
  const waistDelta4w = latestWaist != null && baselineWaist ? latestWaist - Number(baselineWaist.waistCm || 0) : null;

  const periodWorkoutDays = new Set(periodSessions.map((s) => s.date)).size;
  const weeksInPeriod = 4;
  const plannedDaysPeriod = plannedDaysPerWeek * weeksInPeriod;
  const programAdherencePct = plannedDaysPeriod > 0 ? Math.round((periodWorkoutDays / plannedDaysPeriod) * 100) : 0;
  const recoveryDaysPerWeek = Math.max(0, 7 - plannedDaysPerWeek);
  const avgWorkoutDaysPerWeek = Math.round((periodWorkoutDays / weeksInPeriod) * 10) / 10;
  const avgRecoveryDaysPerWeek = Math.max(0, 7 - avgWorkoutDaysPerWeek);

  const metricCardsByGoal = {
    cut: [
      { label: 'Weight Trend (7d)', value: weightTrend7d == null ? 'N/A' : `${weightTrend7d >= 0 ? '+' : ''}${weightTrend7d.toFixed(1)} kg` },
      { label: 'Waist Delta (4w)', value: waistDelta4w == null ? 'N/A' : `${waistDelta4w >= 0 ? '+' : ''}${waistDelta4w.toFixed(1)} cm` },
      { label: 'Nutrition Adherence', value: `${nutritionAdherencePct}%` },
      { label: 'Hydration Adherence', value: `${hydrationAdherencePct}%` },
    ],
    lean_bulk: [
      { label: 'Weight Trend (7d)', value: weightTrend7d == null ? 'N/A' : `${weightTrend7d >= 0 ? '+' : ''}${weightTrend7d.toFixed(1)} kg` },
      { label: 'Weekly Volume Sets', value: `${weeklyVolumeSets}` },
      { label: 'Weekly Load', value: `${Math.round(weeklyLoad)} kg` },
      { label: 'Nutrition Adherence', value: `${nutritionAdherencePct}%` },
    ],
    recomp: [
      { label: 'Waist Delta (4w)', value: waistDelta4w == null ? 'N/A' : `${waistDelta4w >= 0 ? '+' : ''}${waistDelta4w.toFixed(1)} cm` },
      { label: 'Weight Delta (4w)', value: weightDelta4w == null ? 'N/A' : `${weightDelta4w >= 0 ? '+' : ''}${weightDelta4w.toFixed(1)} kg` },
      { label: 'Program Adherence', value: `${programAdherencePct}%` },
      { label: 'Protein Avg (7d)', value: `${avgProtein7d} g` },
    ],
    strength: [
      { label: 'Weekly Volume Sets', value: `${weeklyVolumeSets}` },
      { label: 'Weekly Load', value: `${Math.round(weeklyLoad)} kg` },
      { label: 'Workout Days (7d)', value: `${weeklyWorkoutDays}` },
      { label: 'Current Streak', value: `${workoutStreak} days` },
    ],
    maintain: [
      { label: 'Weight Trend (7d)', value: weightTrend7d == null ? 'N/A' : `${weightTrend7d >= 0 ? '+' : ''}${weightTrend7d.toFixed(1)} kg` },
      { label: 'Calories Avg (7d)', value: `${avgCals7d} kcal` },
      { label: 'Calorie Variance', value: `±${calorieVariance} kcal` },
      { label: 'Hydration Adherence', value: `${hydrationAdherencePct}%` },
    ],
    general_fitness: [
      { label: 'Workout Days (7d)', value: `${weeklyWorkoutDays}` },
      { label: 'Program Adherence', value: `${programAdherencePct}%` },
      { label: 'Hydration Adherence', value: `${hydrationAdherencePct}%` },
      { label: 'Nutrition Adherence', value: `${nutritionAdherencePct}%` },
    ],
  };

  const cards = metricCardsByGoal[goalType] || metricCardsByGoal.general_fitness;

  const getMeasurementDelta4w = (field) => {
    const series = [...metrics]
      .filter((m) => Number.isFinite(Number(m[field])))
      .sort((a, b) => a.date.localeCompare(b.date));
    if (series.length === 0) return null;
    const latest = Number(series[series.length - 1][field] || 0);
    const baseline = [...series].reverse().find((m) => parseISO(m.date) <= twentyEightDaysAgo) || series[0];
    return latest - Number(baseline[field] || 0);
  };

  const circumferenceCards = [
    { label: 'Waist', delta: getMeasurementDelta4w('waistCm'), unit: 'cm' },
    ...(showAdvancedMeasurements
      ? [
          { label: 'Chest', delta: getMeasurementDelta4w('chestCm'), unit: 'cm' },
          { label: 'Arm', delta: getMeasurementDelta4w('armCm'), unit: 'cm' },
          { label: 'Thigh', delta: getMeasurementDelta4w('thighCm'), unit: 'cm' },
        ]
      : []),
  ];

  const photoMetrics = [...metrics]
    .filter((m) => Boolean(m.progressPhotoUrl))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, photoLimit);

  const goalCheckins = {
    cut: {
      title: 'Cut Check-In',
      points: [
        'Is your 7-day weight trend moving down by ~0.2 to 0.7 kg/week?',
        'If strength is dropping quickly, consider a smaller deficit.',
      ],
    },
    lean_bulk: {
      title: 'Lean Bulk Check-In',
      points: [
        'Is your weight trend increasing slowly (~0.1 to 0.4 kg/week)?',
        'If waist gain is fast, reduce surplus slightly.',
      ],
    },
    recomp: {
      title: 'Recomp Check-In',
      points: [
        'Is waist trending down while strength or reps trend up?',
        'If both stall, tighten protein consistency and training execution.',
      ],
    },
  };

  const calorieAdjust = (() => {
    if (weightTrend7d == null) return null;
    if (goalType === 'cut') {
      if (weightTrend7d > 0.2) return { calories: -150, protein: +10, carbs: -20, fat: -5, note: 'Weight is trending up during cut.' };
      if (weightTrend7d < -0.9) return { calories: +150, protein: 0, carbs: +20, fat: +5, note: 'Weight is dropping too fast.' };
      return { calories: 0, protein: 0, carbs: 0, fat: 0, note: 'Current intake looks on track.' };
    }
    if (goalType === 'lean_bulk') {
      if (weightTrend7d < 0.05) return { calories: +150, protein: +5, carbs: +20, fat: +5, note: 'Weight gain is too slow for lean bulk.' };
      if (weightTrend7d > 0.5) return { calories: -150, protein: 0, carbs: -20, fat: -5, note: 'Weight gain may be too fast.' };
      return { calories: 0, protein: 0, carbs: 0, fat: 0, note: 'Current intake looks on track.' };
    }
    if (goalType === 'recomp') {
      if (waistDelta4w != null && waistDelta4w > 0.8) return { calories: -100, protein: +10, carbs: -15, fat: -5, note: 'Waist is rising; lean toward slight deficit.' };
      if (weightTrend7d != null && weightTrend7d < -0.6) return { calories: +100, protein: +5, carbs: +10, fat: +5, note: 'Weight is dropping quickly; nudge intake up.' };
      return { calories: 0, protein: 0, carbs: 0, fat: 0, note: 'Current intake looks on track.' };
    }
    return null;
  })();

  return {
    cards,
    circumferenceCards,
    photoMetrics,
    goalCheckins,
    calorieAdjust,
    prHighlights,
    recoveryDaysPerWeek,
    avgRecoveryDaysPerWeek,
  };
}

