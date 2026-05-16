import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Dumbbell, UtensilsCrossed, Droplets, TrendingUp } from 'lucide-react';

const tabs = [
  { path: '/', icon: Home, label: 'Today' },
  { path: '/workout', icon: Dumbbell, label: 'Workout' },
  { path: '/meals', icon: UtensilsCrossed, label: 'Meals' },
  { path: '/water', icon: Droplets, label: 'Water' },
  { path: '/progress', icon: TrendingUp, label: 'Progress' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-card/95 backdrop-blur-xl border-t border-border z-50">
      <div className="flex items-center justify-around h-16 px-1">
        {tabs.map(({ path, icon: Icon, label }) => {
          const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center justify-center gap-0.5 w-16 h-14 rounded-xl transition-all ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
      {/* Safe area for iOS */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}