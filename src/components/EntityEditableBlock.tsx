// src/components/EntityEditableBlock.tsx
'use client';

import { useState } from 'react';
import EntityEditForm from './EntityEditForm';
import { PencilIcon } from '@heroicons/react/24/outline'; // Assumes you have heroicons, or use text

interface EntityEditableBlockProps {
  entity: {
    id: number;
    name: string;
    type: string;
    entry: string | null;
  };
  isLoggedIn: boolean;
  children: React.ReactNode;
}

export default function EntityEditableBlock({ entity, isLoggedIn, children }: EntityEditableBlockProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <div className="max-w-4xl mx-auto mt-6">
        <EntityEditForm entity={entity} onCancel={() => setIsEditing(false)} />
      </div>
    );
  }

  return (
    <div className="relative group">
      {/* Edit Button - Positioned Absolute Top Right */}
      {isLoggedIn && (
        <button
          onClick={() => setIsEditing(true)}
          className="absolute top-0 right-0 mt-0 mr-0 z-10 flex items-center space-x-1 px-3 py-1.5 bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm rounded-md text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-all text-sm font-medium"
        >
          <span>Edit</span>
        </button>
      )}
      
      {/* The existing Read-Only View */}
      {children}
    </div>
  );
}