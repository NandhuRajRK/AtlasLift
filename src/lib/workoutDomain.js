import { parseISO } from 'date-fns';

export function buildProgramDayMap(programDays = []) {
  return new Map(programDays.map((d) => [d.id, d]));
}

export function resolveSessionDisplayName(session, programDayMap) {
  if (!session) return '';
  return programDayMap?.get(session.programDayId)?.dayName || session.name;
}

export function calculateWeeklyLoadChange({ allSets = [], sessionById, currentWeekStart, prevWeekStart, prevWeekEnd }) {
  const currentWeekLoad = allSets.reduce((sum, st) => {
    const session = sessionById.get(st.workoutSessionId);
    if (!session?.date || session.status !== 'completed') return sum;
    if (parseISO(session.date) < currentWeekStart) return sum;
    return sum + Number(st.weightKg || 0) * Number(st.reps || 0);
  }, 0);

  const previousWeekLoad = allSets.reduce((sum, st) => {
    const session = sessionById.get(st.workoutSessionId);
    if (!session?.date || session.status !== 'completed') return sum;
    const d = parseISO(session.date);
    if (d < prevWeekStart || d > prevWeekEnd) return sum;
    return sum + Number(st.weightKg || 0) * Number(st.reps || 0);
  }, 0);

  const loadChangePct = previousWeekLoad > 0
    ? ((currentWeekLoad - previousWeekLoad) / previousWeekLoad) * 100
    : 0;

  return { currentWeekLoad, previousWeekLoad, loadChangePct };
}

