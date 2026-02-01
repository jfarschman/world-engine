'use client';

import { useState, createContext, useContext } from 'react';
import EntityEditForm from './EntityEditForm';

// 1. Create a Context to share the "setIsEditing" function
const EditContext = createContext<{
  setIsEditing: (v: boolean) => void;
} | null>(null);

// 2. Export a hook so our button can use it
export function useEditMode() {
  const context = useContext(EditContext);
  if (!context) throw new Error('useEditMode must be used within EntityEditableBlock');
  return context;
}

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

  // If in Edit Mode, show the form
  if (isEditing) {
    return (
      <div className="max-w-4xl mx-auto mt-6">
        <EntityEditForm entity={entity} onCancel={() => setIsEditing(false)} />
      </div>
    );
  }

  // If in Read Mode, wrap the children in the Provider so they can access the trigger
  return (
    <EditContext.Provider value={{ setIsEditing }}>
      <div className="relative group">
        {/* No floating button here anymore! */}
        {children}
      </div>
    </EditContext.Provider>
  );
}