import React from 'react';

export default function CircumferenceCard({ items }) {
  return (
    <div className="bg-card rounded-2xl p-4 border border-border space-y-2">
      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Circumference Delta (4w)</div>
      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => (
          <div key={item.label} className="rounded-xl bg-secondary p-3">
            <div className="text-[11px] text-muted-foreground">{item.label}</div>
            <div className="text-sm font-bold text-foreground mt-1">
              {item.delta == null ? 'N/A' : `${item.delta >= 0 ? '+' : ''}${item.delta.toFixed(1)} ${item.unit}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

