import React from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, UtensilsCrossed, Droplets, Scale } from 'lucide-react';

const actions = [
  { to: '/workout', icon: Dumbbell, label: 'Start Workout', color: 'text-primary' },
  { to: '/meals', icon: UtensilsCrossed, label: 'Log Meal', color: 'text-accent' },
  { to: '/water', icon: Droplets, label: 'Add Water', color: 'text-chart-3' },
  { to: '/progress', icon: Scale, label: 'Log Weight', color: 'text-chart-4' },
];

export default function TodayQuickActions() {
  return (
    <div className="grid grid-cols-4 gap-2">
      {actions.map(({ to, icon: Icon, label, color }) => (
        <Link key={to} to={to}
          className="bg-card rounded-xl p-3 border border-border flex flex-col items-center gap-2 active:scale-95 transition-transform">
          <Icon className={`w-5 h-5 ${color}`} />
          <span className="text-[10px] font-medium text-muted-foreground text-center leading-tight">{label}</span>
        </Link>
      ))}
    </div>
  );
}