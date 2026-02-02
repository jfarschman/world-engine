'use client';

import { useState, createContext, useContext } from 'react';
import EntityEditForm from './EntityEditForm';

const EditContext = createContext<{
  setIsEditing: (v: boolean) => void;
} | null>(null);

export function useEditMode() {
  const context = useContext(EditContext);
  if (!context) throw new Error('useEditMode must be used within EntityEditableBlock');
  return context;
}

// --- THIS IS THE KEY FIX ---
interface EntityEditableBlockProps {
  entity: {
    id: number;
    name: string;
    type: string;
    entry: string | null;
    // Add these so they pass through to the form!
    image_uuid?: string | null;
    image_ext?: string | null;
    focal_x?: number | null;
    focal_y?: number | null;
  };
  isLoggedIn: boolean;
  children: React.ReactNode;
}

export default function EntityEditableBlock({ entity, isLoggedIn, children }: EntityEditableBlockProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <div className="max-w-4xl mx-auto mt-6">
        {/* Now the form receives the image data correctly */}
        <EntityEditForm entity={entity} onCancel={() => setIsEditing(false)} />
      </div>
    );
  }

  return (
    <EditContext.Provider value={{ setIsEditing }}>
      <div className="relative group">
        {children}
      </div>
    </EditContext.Provider>
  );
}