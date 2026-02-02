'use client';

import { useState } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

export default function SidebarShell({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* 1. MOBILE TOP BAR (Only visible on mobile) */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-16 bg-slate-900 text-white flex items-center justify-between px-4 border-b border-slate-800 shadow-md">
         <span className="font-bold tracking-widest text-blue-400">LORE<span className="text-white">DB</span></span>
         <button 
           onClick={() => setIsOpen(!isOpen)}
           className="p-2 text-slate-300 hover:text-white"
         >
           {isOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
         </button>
      </div>

      {/* 2. SIDEBAR CONTAINER (Sliding logic) */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white shadow-xl transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 md:static md:block
      `}>
        {/* Render the Server Component passed from Layout */}
        {children}
      </aside>

      {/* 3. DARK OVERLAY (Click to close on mobile) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}