import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { appClient } from '@/api/localClient';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function StrengthChart() {
  const [selectedExercise, setSelectedExercise] = useState('');

  const { data: sets } = useQuery({
    queryKey: ['allSets'],
    queryFn: () => appClient.entities.WorkoutSet.list('-created_date', 500),
    initialData: [],
  });

  const { data: sessions } = useQuery({
    queryKey: ['allSessions'],
    queryFn: () => appClient.entities.WorkoutSession.list('-date', 50),
    initialData: [],
  });

  const completedSets = sets.filter(s => s.isCompleted && s.weightKg > 0);
  const exerciseNames = [...new Set(completedSets.map(s => s.exerciseName))].sort();

  const active = selectedExercise || exerciseNames[0] || '';

  const sessionMap = {};
  sessions.forEach(s => { sessionMap[s.id] = s; });

  const chartData = completedSets
    .filter(s => s.exerciseName === active)
    .map(s => {
      const session = sessionMap[s.workoutSessionId];
      const e1rm = (s.weightKg || 0) * (1 + (s.reps || 0) / 30);
      return {
        date: session?.date || s.created_date?.split('T')[0] || '',
        weight: s.weightKg,
        reps: s.reps,
        e1rm: Math.round(e1rm * 10) / 10,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  // Deduplicate by date, take best e1rm per day
  const byDate = {};
  chartData.forEach(d => {
    if (!byDate[d.date] || d.e1rm > byDate[d.date].e1rm) {
      byDate[d.date] = d;
    }
  });
  const uniqueData = Object.values(byDate).map(d => ({
    ...d,
    dateLabel: d.date ? format(new Date(d.date), 'MMM d') : '',
  }));

  if (exerciseNames.length === 0) return null;

  return (
    <div className="bg-card rounded-2xl p-4 border border-border">
      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">Strength Trend</div>
      <Select value={active} onValueChange={setSelectedExercise}>
        <SelectTrigger className="bg-secondary border-0 text-foreground h-10 mb-3 text-sm">
          <SelectValue placeholder="Select exercise" />
        </SelectTrigger>
        <SelectContent>
          {exerciseNames.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
        </SelectContent>
      </Select>
      {uniqueData.length > 1 ? (
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={uniqueData}>
              <XAxis dataKey="dateLabel" tick={{ fontSize: 10, fill: 'hsl(220, 8%, 50%)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(220, 8%, 50%)' }} axisLine={false} tickLine={false} width={35} />
              <Tooltip
                contentStyle={{ background: 'hsl(220, 13%, 12%)', border: '1px solid hsl(220, 12%, 18%)', borderRadius: 8, fontSize: 12, color: 'white' }}
                formatter={(val) => [`${val} kg`, 'Est. 1RM']}
              />
              <Line type="monotone" dataKey="e1rm" stroke="hsl(270, 60%, 58%)" strokeWidth={2} dot={{ r: 3, fill: 'hsl(270, 60%, 58%)' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-6">Need more data points to show trend.</p>
      )}
    </div>
  );
}