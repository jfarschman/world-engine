// src/components/EntityEditForm.tsx
'use client';

import { updateEntity } from '@/app/actions';
import { useState } from 'react';

interface EntityEditFormProps {
  entity: {
    id: number;
    name: string;
    type: string;
    entry: string | null;
  };
  onCancel: () => void;
}

export default function EntityEditForm({ entity, onCancel }: EntityEditFormProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setIsSaving(true);
    await updateEntity(formData);
    setIsSaving(false);
    onCancel(); // Switch back to read mode
  };

  return (
    <form action={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 space-y-6">
      <input type="hidden" name="id" value={entity.id} />

      {/* Header Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
          <input
            name="name"
            defaultValue={entity.name}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
          <select
            name="type"
            defaultValue={entity.type}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="Character">Character</option>
            <option value="Location">Location</option>
            <option value="Organisation">Organisation</option>
            <option value="Family">Family</option>
            <option value="Race">Race</option>
            <option value="Item">Item</option>
            <option value="Note">Note</option>
          </select>
        </div>
      </div>

      {/* Entry / Description */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Entry (HTML/Text)</label>
        <textarea
          name="entry"
          defaultValue={entity.entry || ''}
          rows={12}
          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
        />
        <p className="text-xs text-slate-400 mt-1">Basic HTML tags are supported.</p>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}