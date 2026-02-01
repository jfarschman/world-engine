'use client';

import { PencilIcon } from '@heroicons/react/24/outline';
import { useEditMode } from './EntityEditableBlock';

export default function EditButton({ className }: { className?: string }) {
  const { setIsEditing } = useEditMode();

  return (
    <button
      onClick={() => setIsEditing(true)}
      title="Edit Entity"
      className={className}
    >
      <PencilIcon className="w-5 h-5" />
    </button>
  );
}