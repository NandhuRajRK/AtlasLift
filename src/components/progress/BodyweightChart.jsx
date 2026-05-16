import React from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { format } from 'date-fns';

export default function BodyweightChart({ metrics }) {
  const data = [...metrics]
    .filter(m => m.bodyweightKg)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-30)
    .map(m => ({
      date: format(new Date(m.date), 'MMM d'),
      weight: m.bodyweightKg,
    }));

  if (data.length === 0) return null;

  return (
    <div className="bg-card rounded-2xl p-4 border border-border">
      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">Bodyweight Trend</div>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(220, 8%, 50%)' }} axisLine={false} tickLine={false} />
            <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 10, fill: 'hsl(220, 8%, 50%)' }} axisLine={false} tickLine={false} width={35} />
            <Tooltip
              contentStyle={{ background: 'hsl(220, 13%, 12%)', border: '1px solid hsl(220, 12%, 18%)', borderRadius: 8, fontSize: 12, color: 'white' }}
            />
            <Line type="monotone" dataKey="weight" stroke="hsl(150, 50%, 45%)" strokeWidth={2} dot={{ r: 3, fill: 'hsl(150, 50%, 45%)' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}