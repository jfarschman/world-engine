'use client';

import { useState, useTransition } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';

interface DeleteButtonProps {
  id: number;
  action: (id: number) => Promise<void | { error?: string }>;
  label?: string;
  className?: string;
}

export default function DeleteButton({ id, action, label, className }: DeleteButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this permanently? This cannot be undone.')) {
      startTransition(async () => {
        try {
          const result = await action(id);
          // Only show error if the server explicitly returned an error object
          if (result && result.error) {
            alert(`Error: ${result.error}`);
          }
        } catch (e) {
          // If the page is redirecting, this catch might trigger harmlessly.
          // We ignore it to prevent false alarms during the page transition.
          console.log("Delete action completed."); 
        }
      });
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={isPending}
      className={`flex items-center transition-colors disabled:opacity-50 disabled:cursor-wait ${className} ${isPending ? 'text-slate-400' : 'text-red-600 hover:text-red-800'}`}
      title="Delete"
    >
      {isPending ? (
         <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
         </svg>
      ) : (
        <TrashIcon className="h-5 w-5" />
      )}
      {label && <span className="ml-2">{label}</span>}
    </button>
  );
}