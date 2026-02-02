'use client';

import { updateEntity } from '@/app/actions';
import { useState } from 'react';
import RichTextEditor from './RichTextEditor';
import ImageUploader from './ImageUploader'; // <--- IMPORT THIS

interface EntityEditFormProps {
  entity: {
    id: number;
    name: string;
    type: string;
    entry: string | null;
    image_uuid?: string | null;
    image_ext?: string | null;
    focal_x?: number | null;
    focal_y?: number | null;
  };
  onCancel: () => void;
}

const processInitialContent = (content: string | null) => {
  if (!content) return '';
  return content.replace(
    /\[(character|location|organisation|family|race|note|post|item|entity):(\d+)\|([^\]]+)\]/gi,
    (match, type, id, label) => {
      return `<span data-type="mention" class="bg-green-100 text-green-800 rounded px-1 py-0.5 font-medium decoration-clone" data-id="${id}" data-label="${label}">${label}</span>`;
    }
  );
};

export default function EntityEditForm({ entity, onCancel }: EntityEditFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [entryContent, setEntryContent] = useState(processInitialContent(entity.entry));

  const handleSubmit = async (formData: FormData) => {
    setIsSaving(true);
    await updateEntity(formData);
    setIsSaving(false);
    onCancel(); 
  };

  return (
    <form action={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 space-y-6">
      <input type="hidden" name="id" value={entity.id} />
      <input type="hidden" name="entry" value={entryContent} />

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

      {/* --- ADD IMAGE UPLOADER HERE --- */}
      <div className="col-span-full border-t border-slate-100 pt-4">
         <ImageUploader 
           initialImage={entity.image_uuid && entity.image_ext 
             ? `/gallery/${entity.image_uuid}.${entity.image_ext}` 
             : null
           }
           initialX={entity.focal_x || 50}
           initialY={entity.focal_y || 50}
         />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Entry</label>
        <RichTextEditor 
          content={entryContent} 
          onChange={(html) => setEntryContent(html)} 
        />
      </div>

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
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}