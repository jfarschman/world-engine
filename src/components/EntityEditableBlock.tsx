'use client';

import { useState, createContext, useContext } from 'react';
import EntityEditForm from './EntityEditForm';

// Define the shape of our dropdown lists
interface SimpleList { 
  id: number; 
  name: string; 
}

// Context for the Edit Button (the pencil icon uses this)
const EditContext = createContext<{
  setIsEditing: (v: boolean) => void;
} | null>(null);

export function useEditMode() {
  const context = useContext(EditContext);
  if (!context) throw new Error('useEditMode must be used within EntityEditableBlock');
  return context;
}

interface EntityEditableBlockProps {
  entity: any; // We use 'any' here to handle the complex Prisma includes without a massive type file
  isLoggedIn: boolean;
  children: React.ReactNode;
  // This is the new part: passing the lists down
  lists?: {
    locations: SimpleList[];
    races: SimpleList[];
    families: SimpleList[];
    orgs: SimpleList[];
  };
}

export default function EntityEditableBlock({ entity, isLoggedIn, children, lists }: EntityEditableBlockProps) {
  const [isEditing, setIsEditing] = useState(false);

  // If not logged in, just show the content (Read Mode)
  if (!isLoggedIn) {
    return <div className="relative group">{children}</div>;
  }

  // If Editing, show the Form
  if (isEditing) {
    return (
      <div className="max-w-4xl mx-auto mt-6">
        <EntityEditForm 
           entity={entity} 
           lists={lists} 
           onCancel={() => setIsEditing(false)} 
        />
      </div>
    );
  }

  // If Logged In but NOT Editing, show content + provide context for the Edit Button
  return (
    <EditContext.Provider value={{ setIsEditing }}>
      <div className="relative group">
        {children}
      </div>
    </EditContext.Provider>
  );
}