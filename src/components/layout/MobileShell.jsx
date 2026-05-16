import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

export default function MobileShell() {
  return (
    <div className="flex justify-center min-h-screen bg-background">
      <div className="w-full max-w-[430px] min-h-screen flex flex-col relative">
        <main className="flex-1 pb-20 overflow-y-auto">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  );
}