import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/api/localClient';
import { getToday, getDateRange } from '@/lib/dateUtils';
import { format, parseISO } from 'date-fns';
import { CalendarDays, Droplets, Dumbbell, Scale, UtensilsCrossed, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { selectPrimaryProfile } from '@/lib/profileUtils';
import { filterMeasurementMetrics, groupMeals, makeRangeSummary } from '@/lib/historyDomain';

export default function History() {
  const queryClient = useQueryClient();
  const today = getToday();
  const [selectedDate, setSelectedDate] = useState(today);

  const { data: sessions } = useQuery({
    queryKey: ['historyWorkoutSessions'],
    queryFn: () => appClient.entities.WorkoutSession.list('-date', 1200),
    initialData: [],
  });
  const { data: workoutSets } = useQuery({
    queryKey: ['historyWorkoutSets'],
    queryFn: () => appClient.entities.WorkoutSet.list('-created_date', 5000),
    initialData: [],
  });
  const { data: meals } = useQuery({
    queryKey: ['historyMeals'],
    queryFn: () => appClient.entities.MealLog.list('-date', 3000),
    initialData: [],
  });
  const { data: hydration } = useQuery({
    queryKey: ['historyHydration'],
    queryFn: () => appClient.entities.HydrationEntry.list('-date', 3000),
    initialData: [],
  });
  const { data: metrics } = useQuery({
    queryKey: ['historyBodyMetrics'],
    queryFn: () => appClient.entities.BodyMetric.list('-date', 1200),
    initialData: [],
  });
  const { data: profiles } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => appClient.entities.UserProfile.list('-created_date', 50),
    initialData: [],
  });
  const profile = selectPrimaryProfile(profiles) || {};
  const showAdvancedMeasurements = Boolean(profile.enableAdvancedBodyMeasurements);

  const daySessions = useMemo(() => sessions.filter((s) => s.date === selectedDate), [sessions, selectedDate]);
  const dayMeals = useMemo(() => meals.filter((m) => m.date === selectedDate), [meals, selectedDate]);
  const dayHydration = useMemo(() => hydration.filter((h) => h.date === selectedDate), [hydration, selectedDate]);
  const dayMetrics = useMemo(() => metrics.filter((m) => m.date === selectedDate), [metrics, selectedDate]);
  const dayMeasurementMetrics = useMemo(
    () => filterMeasurementMetrics(dayMetrics),
    [dayMetrics]
  );
  const mealSummary = useMemo(() => groupMeals(dayMeals), [dayMeals]);

  const setsBySessionId = useMemo(() => {
    const map = new Map();
    for (const st of workoutSets) {
      if (!map.has(st.workoutSessionId)) map.set(st.workoutSessionId, []);
      map.get(st.workoutSessionId).push(st);
    }
    return map;
  }, [workoutSets]);

  const [editingMealId, setEditingMealId] = useState(null);
  const [mealEdit, setMealEdit] = useState({});
  const [editingHydrationId, setEditingHydrationId] = useState(null);
  const [hydrationEdit, setHydrationEdit] = useState('');
  const [editingMetricId, setEditingMetricId] = useState(null);
  const [metricEdit, setMetricEdit] = useState({ bodyweightKg: '', waistCm: '', chestCm: '', armCm: '', thighCm: '' });
  const [workoutsVisibleCount, setWorkoutsVisibleCount] = useState(6);
  const [mealsVisibleCount, setMealsVisibleCount] = useState(8);
  const [hydrationVisibleCount, setHydrationVisibleCount] = useState(8);
  const [metricsVisibleCount, setMetricsVisibleCount] = useState(8);

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['historyWorkoutSessions'] }),
      queryClient.invalidateQueries({ queryKey: ['historyWorkoutSets'] }),
      queryClient.invalidateQueries({ queryKey: ['historyMeals'] }),
      queryClient.invalidateQueries({ queryKey: ['historyHydration'] }),
      queryClient.invalidateQueries({ queryKey: ['historyBodyMetrics'] }),
      queryClient.invalidateQueries({ queryKey: ['meals', selectedDate] }),
      queryClient.invalidateQueries({ queryKey: ['hydration', selectedDate] }),
      queryClient.invalidateQueries({ queryKey: ['bodyMetrics'] }),
      queryClient.invalidateQueries({ queryKey: ['workoutSessions'] }),
    ]);
  };

  const deleteWorkout = useMutation({
    mutationFn: async (sessionId) => {
      const linked = workoutSets.filter((s) => s.workoutSessionId === sessionId);
      for (const st of linked) await appClient.entities.WorkoutSet.delete(st.id);
      await appClient.entities.WorkoutSession.delete(sessionId);
    },
    onSuccess: invalidateAll,
  });
  const deleteMeal = useMutation({
    mutationFn: (id) => appClient.entities.MealLog.delete(id),
    onSuccess: invalidateAll,
  });
  const updateMeal = useMutation({
    mutationFn: ({ id, patch }) => appClient.entities.MealLog.update(id, patch),
    onSuccess: async () => {
      setEditingMealId(null);
      await invalidateAll();
    },
  });
  const deleteHydration = useMutation({
    mutationFn: (id) => appClient.entities.HydrationEntry.delete(id),
    onSuccess: invalidateAll,
  });
  const updateHydration = useMutation({
    mutationFn: ({ id, amountMl }) => appClient.entities.HydrationEntry.update(id, { amountMl }),
    onSuccess: async () => {
      setEditingHydrationId(null);
      await invalidateAll();
    },
  });
  const deleteMetric = useMutation({
    mutationFn: (id) => appClient.entities.BodyMetric.delete(id),
    onSuccess: invalidateAll,
  });
  const updateMetric = useMutation({
    mutationFn: ({ id, patch }) => appClient.entities.BodyMetric.update(id, patch),
    onSuccess: async () => {
      setEditingMetricId(null);
      await invalidateAll();
    },
  });

  const recentDates = useMemo(() => getDateRange(21).reverse(), []);
  const waterTotal = dayHydration.reduce((sum, h) => sum + Number(h.amountMl || 0), 0);
  const visibleDaySessions = daySessions.slice(0, workoutsVisibleCount);
  const visibleDayMeals = dayMeals.slice(0, mealsVisibleCount);
  const visibleDayHydration = dayHydration.slice(0, hydrationVisibleCount);
  const visibleDayMetrics = dayMeasurementMetrics.slice(0, metricsVisibleCount);

  const weekly = makeRangeSummary({ daysBack: 7, sessions, meals, hydration, metrics });
  const monthly = makeRangeSummary({ daysBack: 30, sessions, meals, hydration, metrics });
  const compareWeeklyMonthly = {
    workouts: weekly.dayCount - (monthly.dayCount / (30 / 7)),
    calories: weekly.cals - (monthly.cals / (30 / 7)),
    water: weekly.water - (monthly.water / (30 / 7)),
  };

  return (
    <div className="px-4 pt-6 pb-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">History</h1>
        <CalendarDays className="w-5 h-5 text-primary" />
      </div>

      <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Pick Date</div>
        <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-secondary border-0 text-foreground h-11" />
        <div className="flex gap-2 overflow-x-auto pb-1">
          {recentDates.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDate(d)}
              className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap ${selectedDate === d ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'}`}
            >
              {format(parseISO(d), 'MMM d')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-card rounded-xl p-3 border border-border">
          <div className="text-[11px] text-muted-foreground">Workouts</div>
          <div className="text-sm font-bold text-foreground mt-1">{daySessions.length}</div>
        </div>
        <div className="bg-card rounded-xl p-3 border border-border">
          <div className="text-[11px] text-muted-foreground">Water</div>
          <div className="text-sm font-bold text-foreground mt-1">{waterTotal} ml</div>
        </div>
        <div className="bg-card rounded-xl p-3 border border-border">
          <div className="text-[11px] text-muted-foreground">Calories</div>
          <div className="text-sm font-bold text-foreground mt-1">{mealSummary.calories} kcal</div>
        </div>
        <div className="bg-card rounded-xl p-3 border border-border">
          <div className="text-[11px] text-muted-foreground">Weight</div>
          <div className="text-sm font-bold text-foreground mt-1">{dayMeasurementMetrics[0]?.bodyweightKg ? `${dayMeasurementMetrics[0].bodyweightKg} kg` : 'N/A'}</div>
        </div>
      </div>

      <section className="bg-card rounded-2xl p-4 border border-border space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wider"><Dumbbell className="w-3.5 h-3.5" />Workouts</div>
        {daySessions.length === 0 ? <p className="text-sm text-muted-foreground">No workouts logged on this date.</p> : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {visibleDaySessions.map((session) => {
          const setCount = (setsBySessionId.get(session.id) || []).filter((s) => s.isCompleted).length;
          return (
            <div key={session.id} className="bg-secondary rounded-xl p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold text-foreground">{session.name}</div>
                  <div className="text-xs text-muted-foreground">{session.status} · {session.durationMinutes || 0} min · {setCount} sets</div>
                </div>
                <button onClick={() => deleteWorkout.mutate(session.id)} className="w-8 h-8 rounded-lg bg-card flex items-center justify-center">
                  <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
          );
        })}
          </div>
        )}
        {daySessions.length > visibleDaySessions.length && (
          <button onClick={() => setWorkoutsVisibleCount((n) => n + 6)} className="w-full h-9 rounded-lg bg-secondary text-sm font-medium text-foreground">
            Load more workouts
          </button>
        )}
      </section>

      <section className="bg-card rounded-2xl p-4 border border-border space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wider"><UtensilsCrossed className="w-3.5 h-3.5" />Meals</div>
        {dayMeals.length === 0 ? <p className="text-sm text-muted-foreground">No meals logged on this date.</p> : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {visibleDayMeals.map((meal) => (
          <div key={meal.id} className="bg-secondary rounded-xl p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-foreground">{meal.name}</div>
                <div className="text-xs text-muted-foreground">{meal.calories} kcal · P {meal.protein} C {meal.carbs} F {meal.fat}</div>
              </div>
              <button onClick={() => deleteMeal.mutate(meal.id)} className="w-8 h-8 rounded-lg bg-card flex items-center justify-center">
                <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
            {editingMealId === meal.id ? (
              <div className="grid grid-cols-2 gap-2">
                <Input value={mealEdit.name ?? meal.name} onChange={(e) => setMealEdit((p) => ({ ...p, name: e.target.value }))} className="h-9 bg-card border-0 text-foreground col-span-2" />
                <Input type="number" value={mealEdit.calories ?? meal.calories ?? 0} onChange={(e) => setMealEdit((p) => ({ ...p, calories: Number(e.target.value) }))} className="h-9 bg-card border-0 text-foreground" />
                <Input type="number" value={mealEdit.protein ?? meal.protein ?? 0} onChange={(e) => setMealEdit((p) => ({ ...p, protein: Number(e.target.value) }))} className="h-9 bg-card border-0 text-foreground" />
                <Input type="number" value={mealEdit.carbs ?? meal.carbs ?? 0} onChange={(e) => setMealEdit((p) => ({ ...p, carbs: Number(e.target.value) }))} className="h-9 bg-card border-0 text-foreground" />
                <Input type="number" value={mealEdit.fat ?? meal.fat ?? 0} onChange={(e) => setMealEdit((p) => ({ ...p, fat: Number(e.target.value) }))} className="h-9 bg-card border-0 text-foreground" />
                <button onClick={() => updateMeal.mutate({ id: meal.id, patch: mealEdit })} className="h-9 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">Save</button>
                <button onClick={() => { setEditingMealId(null); setMealEdit({}); }} className="h-9 rounded-lg bg-card text-foreground text-xs font-semibold">Cancel</button>
              </div>
            ) : (
              <button onClick={() => { setEditingMealId(meal.id); setMealEdit({}); }} className="text-xs text-primary font-medium">Edit</button>
            )}
          </div>
        ))}
          </div>
        )}
        {dayMeals.length > visibleDayMeals.length && (
          <button onClick={() => setMealsVisibleCount((n) => n + 8)} className="w-full h-9 rounded-lg bg-secondary text-sm font-medium text-foreground">
            Load more meals
          </button>
        )}
      </section>

      <section className="bg-card rounded-2xl p-4 border border-border space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wider"><Droplets className="w-3.5 h-3.5" />Hydration</div>
        {dayHydration.length === 0 ? <p className="text-sm text-muted-foreground">No hydration entries on this date.</p> : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {visibleDayHydration.map((entry) => (
          <div key={entry.id} className="bg-secondary rounded-xl p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="text-sm font-semibold text-foreground">{entry.amountMl} ml</div>
              <button onClick={() => deleteHydration.mutate(entry.id)} className="w-8 h-8 rounded-lg bg-card flex items-center justify-center">
                <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
            {editingHydrationId === entry.id ? (
              <div className="flex gap-2">
                <Input type="number" value={hydrationEdit} onChange={(e) => setHydrationEdit(e.target.value)} className="h-9 bg-card border-0 text-foreground" />
                <button onClick={() => updateHydration.mutate({ id: entry.id, amountMl: Number(hydrationEdit || 0) })} className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">Save</button>
                <button onClick={() => setEditingHydrationId(null)} className="h-9 px-3 rounded-lg bg-card text-foreground text-xs font-semibold">Cancel</button>
              </div>
            ) : (
              <button onClick={() => { setEditingHydrationId(entry.id); setHydrationEdit(String(entry.amountMl || '')); }} className="text-xs text-primary font-medium">Edit</button>
            )}
          </div>
        ))}
          </div>
        )}
        {dayHydration.length > visibleDayHydration.length && (
          <button onClick={() => setHydrationVisibleCount((n) => n + 8)} className="w-full h-9 rounded-lg bg-secondary text-sm font-medium text-foreground">
            Load more hydration
          </button>
        )}
      </section>

      <section className="bg-card rounded-2xl p-4 border border-border space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wider"><Scale className="w-3.5 h-3.5" />Body Metrics</div>
        {dayMeasurementMetrics.length === 0 ? <p className="text-sm text-muted-foreground">No body metrics on this date.</p> : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {visibleDayMetrics.map((m) => (
          <div key={m.id} className="bg-secondary rounded-xl p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="text-sm text-foreground">
                Weight: <span className="font-semibold">{m.bodyweightKg || 'N/A'} kg</span> · Waist: <span className="font-semibold">{m.waistCm || 'N/A'} cm</span>
                {showAdvancedMeasurements ? (
                  <> · Chest: <span className="font-semibold">{m.chestCm || 'N/A'} cm</span> · Arm: <span className="font-semibold">{m.armCm || 'N/A'} cm</span> · Thigh: <span className="font-semibold">{m.thighCm || 'N/A'} cm</span></>
                ) : null}
              </div>
              <button onClick={() => deleteMetric.mutate(m.id)} className="w-8 h-8 rounded-lg bg-card flex items-center justify-center">
                <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
            {editingMetricId === m.id ? (
              <div className="grid grid-cols-2 gap-2">
                <Input type="number" value={metricEdit.bodyweightKg} onChange={(e) => setMetricEdit((p) => ({ ...p, bodyweightKg: e.target.value }))} className="h-9 bg-card border-0 text-foreground" />
                <Input type="number" value={metricEdit.waistCm} onChange={(e) => setMetricEdit((p) => ({ ...p, waistCm: e.target.value }))} className="h-9 bg-card border-0 text-foreground" />
                {showAdvancedMeasurements && (
                  <>
                    <Input type="number" value={metricEdit.chestCm} onChange={(e) => setMetricEdit((p) => ({ ...p, chestCm: e.target.value }))} className="h-9 bg-card border-0 text-foreground" />
                    <Input type="number" value={metricEdit.armCm} onChange={(e) => setMetricEdit((p) => ({ ...p, armCm: e.target.value }))} className="h-9 bg-card border-0 text-foreground" />
                    <Input type="number" value={metricEdit.thighCm} onChange={(e) => setMetricEdit((p) => ({ ...p, thighCm: e.target.value }))} className="h-9 bg-card border-0 text-foreground" />
                  </>
                )}
                <button
                  onClick={() => updateMetric.mutate({
                    id: m.id,
                    patch: {
                      bodyweightKg: metricEdit.bodyweightKg ? Number(metricEdit.bodyweightKg) : undefined,
                      waistCm: metricEdit.waistCm ? Number(metricEdit.waistCm) : undefined,
                      chestCm: showAdvancedMeasurements && metricEdit.chestCm ? Number(metricEdit.chestCm) : undefined,
                      armCm: showAdvancedMeasurements && metricEdit.armCm ? Number(metricEdit.armCm) : undefined,
                      thighCm: showAdvancedMeasurements && metricEdit.thighCm ? Number(metricEdit.thighCm) : undefined,
                    },
                  })}
                  className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold"
                >
                  Save
                </button>
                <button onClick={() => setEditingMetricId(null)} className="h-9 px-3 rounded-lg bg-card text-foreground text-xs font-semibold">Cancel</button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setEditingMetricId(m.id);
                  setMetricEdit({
                    bodyweightKg: String(m.bodyweightKg || ''),
                    waistCm: String(m.waistCm || ''),
                    chestCm: String(m.chestCm || ''),
                    armCm: String(m.armCm || ''),
                    thighCm: String(m.thighCm || ''),
                  });
                }}
                className="text-xs text-primary font-medium"
              >
                Edit
              </button>
            )}
          </div>
        ))}
          </div>
        )}
        {dayMeasurementMetrics.length > visibleDayMetrics.length && (
          <button onClick={() => setMetricsVisibleCount((n) => n + 8)} className="w-full h-9 rounded-lg bg-secondary text-sm font-medium text-foreground">
            Load more metrics
          </button>
        )}
      </section>

      <section className="bg-card rounded-2xl p-4 border border-border space-y-3">
        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Weekly vs Monthly</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-secondary p-3">
            <div className="text-[11px] text-muted-foreground">Workouts (7d)</div>
            <div className="text-sm font-bold text-foreground mt-1">{weekly.dayCount} days</div>
          </div>
          <div className="rounded-xl bg-secondary p-3">
            <div className="text-[11px] text-muted-foreground">Workouts (30d)</div>
            <div className="text-sm font-bold text-foreground mt-1">{monthly.dayCount} days</div>
          </div>
          <div className="rounded-xl bg-secondary p-3">
            <div className="text-[11px] text-muted-foreground">Calories (7d)</div>
            <div className="text-sm font-bold text-foreground mt-1">{weekly.cals}</div>
          </div>
          <div className="rounded-xl bg-secondary p-3">
            <div className="text-[11px] text-muted-foreground">Calories (30d)</div>
            <div className="text-sm font-bold text-foreground mt-1">{monthly.cals}</div>
          </div>
          <div className="rounded-xl bg-secondary p-3">
            <div className="text-[11px] text-muted-foreground">Water (7d)</div>
            <div className="text-sm font-bold text-foreground mt-1">{weekly.water} ml</div>
          </div>
          <div className="rounded-xl bg-secondary p-3">
            <div className="text-[11px] text-muted-foreground">Water (30d)</div>
            <div className="text-sm font-bold text-foreground mt-1">{monthly.water} ml</div>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          Normalized weekly comparison: Workouts {compareWeeklyMonthly.workouts >= 0 ? '+' : ''}{compareWeeklyMonthly.workouts.toFixed(1)} days, Calories {compareWeeklyMonthly.calories >= 0 ? '+' : ''}{Math.round(compareWeeklyMonthly.calories)}, Water {compareWeeklyMonthly.water >= 0 ? '+' : ''}{Math.round(compareWeeklyMonthly.water)} ml.
        </div>
        <div className="text-xs text-muted-foreground">
          Monthly weight delta: {monthly.weightDelta == null ? 'N/A' : `${monthly.weightDelta >= 0 ? '+' : ''}${monthly.weightDelta.toFixed(1)} kg`} · Computed from earliest vs latest metric in the last 30 days.
        </div>
      </section>
    </div>
  );
}
