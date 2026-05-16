import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/api/localClient';
import { getToday, getDateRange } from '@/lib/dateUtils';
import { Scale, TrendingUp, Dumbbell, Droplets, UtensilsCrossed } from 'lucide-react';
import { format, subDays, parseISO, differenceInCalendarDays } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import GradientButton from '@/components/ui/GradientButton';
import BodyweightChart from '@/components/progress/BodyweightChart';
import AdherenceCards from '@/components/progress/AdherenceCards';
import StrengthChart from '@/components/progress/StrengthChart';
import { selectPrimaryProfile } from '@/lib/profileUtils';

export default function Progress() {
  const today = getToday();
  const queryClient = useQueryClient();
  const [showWeightForm, setShowWeightForm] = useState(false);
  const [weightVal, setWeightVal] = useState('');
  const [waistVal, setWaistVal] = useState('');
  const [chestVal, setChestVal] = useState('');
  const [armVal, setArmVal] = useState('');
  const [thighVal, setThighVal] = useState('');
  const [photoSaving, setPhotoSaving] = useState(false);

  const { data: metrics } = useQuery({
    queryKey: ['bodyMetrics'],
    queryFn: () => appClient.entities.BodyMetric.list('-date', 60),
    initialData: [],
  });

  const { data: sessions } = useQuery({
    queryKey: ['allWorkoutSessions'],
    queryFn: () => appClient.entities.WorkoutSession.list('-date', 120),
    initialData: [],
  });

  const { data: sets } = useQuery({
    queryKey: ['allWorkoutSets'],
    queryFn: () => appClient.entities.WorkoutSet.list('-created_date', 2000),
    initialData: [],
  });

  const { data: meals } = useQuery({
    queryKey: ['allMealsForProgress'],
    queryFn: () => appClient.entities.MealLog.list('-date', 1200),
    initialData: [],
  });

  const { data: hydrationEntries } = useQuery({
    queryKey: ['allHydrationForProgress'],
    queryFn: () => appClient.entities.HydrationEntry.list('-date', 1200),
    initialData: [],
  });

  const { data: profiles } = useQuery({ queryKey: ['userProfile'], queryFn: () => appClient.entities.UserProfile.list('-created_date', 50), initialData: [] });
  const profile = selectPrimaryProfile(profiles) || {};
  const goalType = profile.goalType || 'general_fitness';
  const showAdvancedMeasurements = Boolean(profile.enableAdvancedBodyMeasurements);

  const sevenDaysAgo = subDays(new Date(), 6);
  const twentyEightDaysAgo = subDays(new Date(), 27);
  const weekDateSet = new Set(Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), i), 'yyyy-MM-dd')));
  const periodDateSet = new Set(Array.from({ length: 28 }, (_, i) => format(subDays(new Date(), i), 'yyyy-MM-dd')));

  const completedSessions = sessions.filter((s) => s.status === 'completed');
  const weekSessions = completedSessions.filter((s) => {
    if (!s.date) return false;
    return parseISO(s.date) >= sevenDaysAgo;
  });
  const periodSessions = completedSessions.filter((s) => {
    if (!s.date) return false;
    return parseISO(s.date) >= twentyEightDaysAgo;
  });

  const sessionMap = new Map(sessions.map((s) => [s.id, s]));
  const weekSets = sets.filter((st) => {
    const session = sessionMap.get(st.workoutSessionId);
    if (!session?.date || session.status !== 'completed') return false;
    return parseISO(session.date) >= sevenDaysAgo;
  });

  const weeklyVolumeSets = weekSets.filter((st) => Number(st.reps) > 0).length;
  const weeklyLoad = weekSets.reduce((sum, st) => sum + (Number(st.weightKg || 0) * Number(st.reps || 0)), 0);
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
  const weightAvg7d = weights7d.length ? (weights7d.reduce((sum, m) => sum + Number(m.bodyweightKg), 0) / weights7d.length) : null;
  const latestWeight = weights.length ? Number(weights[weights.length - 1].bodyweightKg || 0) : null;
  const weightTrend7d = latestWeight != null && weightAvg7d != null ? (latestWeight - weightAvg7d) : null;

  const latestMetric = weights.length ? weights[weights.length - 1] : null;
  const baselineMetric = [...weights].reverse().find((m) => parseISO(m.date) <= twentyEightDaysAgo) || (weights.length ? weights[0] : null);
  const weightDelta4w = latestMetric && baselineMetric ? (Number(latestMetric.bodyweightKg || 0) - Number(baselineMetric.bodyweightKg || 0)) : null;
  const waistSeries = [...metrics].filter((m) => Number.isFinite(Number(m.waistCm))).sort((a, b) => a.date.localeCompare(b.date));
  const latestWaist = waistSeries.length ? Number(waistSeries[waistSeries.length - 1].waistCm || 0) : null;
  const baselineWaist = [...waistSeries].reverse().find((m) => parseISO(m.date) <= twentyEightDaysAgo) || (waistSeries.length ? waistSeries[0] : null);
  const waistDelta4w = latestWaist != null && baselineWaist ? (latestWaist - Number(baselineWaist.waistCm || 0)) : null;

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
    .slice(0, 20);

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

  const handlePhotoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        setPhotoSaving(true);
        const photoUrl = reader.result;
        // Always append a new photo entry so prior photos are preserved in timeline.
        await appClient.entities.BodyMetric.create({ date: today, progressPhotoUrl: photoUrl });
        queryClient.invalidateQueries({ queryKey: ['bodyMetrics'] });
      } finally {
        setPhotoSaving(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const logWeight = useMutation({
    mutationFn: () => appClient.entities.BodyMetric.create({
      date: today,
      bodyweightKg: Number(weightVal),
      waistCm: waistVal ? Number(waistVal) : undefined,
      chestCm: showAdvancedMeasurements && chestVal ? Number(chestVal) : undefined,
      armCm: showAdvancedMeasurements && armVal ? Number(armVal) : undefined,
      thighCm: showAdvancedMeasurements && thighVal ? Number(thighVal) : undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bodyMetrics'] });
      setShowWeightForm(false);
      setWeightVal('');
      setWaistVal('');
      setChestVal('');
      setArmVal('');
      setThighVal('');
    },
  });

  const todayWeight = metrics.find((m) => m.date === today && Number.isFinite(Number(m.bodyweightKg)));

  return (
    <div className="px-4 pt-6 pb-4 space-y-4">
      <h1 className="text-lg font-bold text-foreground">Progress</h1>

      <div className="bg-card rounded-2xl p-4 border border-border">
        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">Goal Metrics · {goalType.replace('_', ' ')}</div>
        <div className="grid grid-cols-2 gap-2">
          {cards.map((card) => (
            <div key={card.label} className="rounded-xl bg-secondary p-3">
              <div className="text-[11px] text-muted-foreground">{card.label}</div>
              <div className="text-sm font-bold text-foreground mt-1">{card.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Log Weight */}
      <div className="bg-card rounded-2xl p-4 border border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-chart-4" />
            <span className="text-sm font-semibold text-foreground">Bodyweight</span>
          </div>
          {todayWeight ? (
            <span className="text-sm font-bold text-foreground">{todayWeight.bodyweightKg} kg</span>
          ) : (
            <button onClick={() => setShowWeightForm(true)} className="text-xs text-primary font-medium">Log Today</button>
          )}
        </div>
        {showWeightForm && (
          <div className="mt-3 space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">Weight (kg)</Label>
                <Input type="number" value={weightVal} onChange={e => setWeightVal(e.target.value)}
                  placeholder={profile.currentWeightKg?.toString() || '73'} className="bg-secondary border-0 text-foreground mt-1 h-11" />
              </div>
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">Waist (cm, optional)</Label>
                <Input type="number" value={waistVal} onChange={e => setWaistVal(e.target.value)}
                  placeholder="80" className="bg-secondary border-0 text-foreground mt-1 h-11" />
              </div>
            </div>
            {showAdvancedMeasurements && (
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Chest (cm)</Label>
                  <Input type="number" value={chestVal} onChange={e => setChestVal(e.target.value)}
                    placeholder="95" className="bg-secondary border-0 text-foreground mt-1 h-11" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Arm (cm)</Label>
                  <Input type="number" value={armVal} onChange={e => setArmVal(e.target.value)}
                    placeholder="34" className="bg-secondary border-0 text-foreground mt-1 h-11" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Thigh (cm)</Label>
                  <Input type="number" value={thighVal} onChange={e => setThighVal(e.target.value)}
                    placeholder="55" className="bg-secondary border-0 text-foreground mt-1 h-11" />
                </div>
              </div>
            )}
            <GradientButton onClick={() => logWeight.mutate()} disabled={!weightVal || logWeight.isPending} className="w-full h-11">
              {logWeight.isPending ? 'Saving...' : 'Save'}
            </GradientButton>
          </div>
        )}
      </div>

      {/* Bodyweight Chart */}
      <BodyweightChart metrics={metrics} />

      {/* Adherence */}
      <AdherenceCards profile={profile} />

      {/* Strength */}
      <StrengthChart />

      <div className="bg-card rounded-2xl p-4 border border-border space-y-2">
        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Circumference Delta (4w)</div>
        <div className="grid grid-cols-2 gap-2">
          {circumferenceCards.map((item) => (
            <div key={item.label} className="rounded-xl bg-secondary p-3">
              <div className="text-[11px] text-muted-foreground">{item.label}</div>
              <div className="text-sm font-bold text-foreground mt-1">
                {item.delta == null ? 'N/A' : `${item.delta >= 0 ? '+' : ''}${item.delta.toFixed(1)} ${item.unit}`}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Progress Photos</div>
          <label className="text-xs text-primary font-medium cursor-pointer">
            {photoSaving ? 'Saving...' : 'Add Photo'}
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </label>
        </div>
        {photoMetrics.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {photoMetrics.map((m) => (
              <div key={m.id} className="space-y-1">
                <img src={m.progressPhotoUrl} alt="Progress" className="w-full h-24 object-cover rounded-lg border border-border" />
                <div className="text-[10px] text-muted-foreground text-center">{m.date}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No progress photos yet.</p>
        )}
      </div>

      {(goalType === 'cut' || goalType === 'lean_bulk' || goalType === 'recomp') && goalCheckins[goalType] && (
        <div className="bg-card rounded-2xl p-4 border border-border space-y-2">
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{goalCheckins[goalType].title}</div>
          <ul className="space-y-1">
            {goalCheckins[goalType].points.map((point) => (
              <li key={point} className="text-sm text-foreground">• {point}</li>
            ))}
          </ul>
        </div>
      )}

      {calorieAdjust && (
        <div className="bg-card rounded-2xl p-4 border border-border space-y-2">
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Goal-Aware Nutrition Recommendation</div>
          <p className="text-sm text-foreground">{calorieAdjust.note}</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-secondary p-3">
              <div className="text-[11px] text-muted-foreground">Calories</div>
              <div className="text-sm font-bold text-foreground mt-1">{calorieAdjust.calories >= 0 ? '+' : ''}{calorieAdjust.calories} kcal</div>
            </div>
            <div className="rounded-xl bg-secondary p-3">
              <div className="text-[11px] text-muted-foreground">Protein</div>
              <div className="text-sm font-bold text-foreground mt-1">{calorieAdjust.protein >= 0 ? '+' : ''}{calorieAdjust.protein} g</div>
            </div>
            <div className="rounded-xl bg-secondary p-3">
              <div className="text-[11px] text-muted-foreground">Carbs</div>
              <div className="text-sm font-bold text-foreground mt-1">{calorieAdjust.carbs >= 0 ? '+' : ''}{calorieAdjust.carbs} g</div>
            </div>
            <div className="rounded-xl bg-secondary p-3">
              <div className="text-[11px] text-muted-foreground">Fat</div>
              <div className="text-sm font-bold text-foreground mt-1">{calorieAdjust.fat >= 0 ? '+' : ''}{calorieAdjust.fat} g</div>
            </div>
          </div>
        </div>
      )}

      {(goalType === 'strength' || goalType === 'lean_bulk' || goalType === 'recomp') && (
        <div className="bg-card rounded-2xl p-4 border border-border space-y-2">
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">PR Highlights</div>
          {prHighlights.length > 0 ? (
            prHighlights.map((pr) => (
              <div key={pr.name} className="flex items-center justify-between bg-secondary rounded-xl px-3 py-2">
                <span className="text-sm text-foreground">{pr.name}</span>
                <span className="text-xs text-muted-foreground">{pr.weight > 0 ? `${pr.weight} kg` : ''}{pr.weight > 0 && pr.reps > 0 ? ' × ' : ''}{pr.reps > 0 ? `${pr.reps} reps` : ''}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No PR data yet.</p>
          )}
        </div>
      )}

      {(goalType === 'strength' || goalType === 'general_fitness' || goalType === 'maintain') && (
        <div className="bg-card rounded-2xl p-4 border border-border space-y-2">
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Recovery Proxy</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-secondary p-3">
              <div className="text-[11px] text-muted-foreground">Planned Recovery/Week</div>
              <div className="text-sm font-bold text-foreground mt-1">{recoveryDaysPerWeek.toFixed(1)} days</div>
            </div>
            <div className="rounded-xl bg-secondary p-3">
              <div className="text-[11px] text-muted-foreground">Actual Recovery/Week</div>
              <div className="text-sm font-bold text-foreground mt-1">{avgRecoveryDaysPerWeek.toFixed(1)} days</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
