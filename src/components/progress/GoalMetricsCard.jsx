import React from 'react';

export default function GoalMetricsCard({ goalType, cards }) {
  return (
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
  );
}

