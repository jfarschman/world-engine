'use client';

import { updateEntity } from '@/app/actions';
import { useState } from 'react';
import RichTextEditor from './RichTextEditor';
import ImageUploader from './ImageUploader'; 

// Define the shape locally to avoid import errors
interface SimpleList { 
  id: number; 
  name: string; 
}

interface EntityEditFormProps {
  entity: any; 
  lists?: {
    locations: SimpleList[];
    races: SimpleList[];
    families: SimpleList[];
    orgs: SimpleList[];
  };
  onCancel: () => void;
}

const processInitialContent = (content: string | null) => {
  if (!content) return '';
  // Convert legacy bracket shortcodes to HTML spans for the editor
  return content.replace(
    /\[(character|location|organisation|family|race|note|post|item|entity):(\d+)\|([^\]]+)\]/gi,
    (match, type, id, label) => {
      return `<span data-type="mention" class="bg-green-100 text-green-800 rounded px-1 py-0.5 font-medium decoration-clone" data-id="${id}" data-label="${label}">${label}</span>`;
    }
  );
};

export default function EntityEditForm({ entity, lists, onCancel }: EntityEditFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [entryContent, setEntryContent] = useState(processInitialContent(entity.entry));
  const type = entity.type;

  const handleSubmit = async (formData: FormData) => {
    setIsSaving(true);
    await updateEntity(formData);
    setIsSaving(false);
    onCancel(); 
  };

  return (
    <form action={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 space-y-6">
      <input type="hidden" name="id" value={entity.id} />
      {/* Hidden input to pass the rich text HTML */}
      <input type="hidden" name="entry" value={entryContent} />

      {/* HEADER: Name, Type, Featured */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        <div className="md:col-span-6">
          <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
          <input 
            name="name" 
            defaultValue={entity.name} 
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
            required 
          />
        </div>
        <div className="md:col-span-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
          {/* We lock the type in edit mode to prevent data loss (e.g. turning a Location into a Character loses the parent_id) */}
          <select 
            name="type" 
            defaultValue={entity.type} 
            className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-50 text-slate-500 pointer-events-none"
          >
            <option value={entity.type}>{entity.type}</option>
          </select>
        </div>
        <div className="md:col-span-2 pt-6">
           <label className="inline-flex items-center cursor-pointer">
             <input 
               type="checkbox" 
               name="is_featured" 
               defaultChecked={entity.is_featured} 
               className="h-5 w-5 text-amber-500 border-slate-300 rounded focus:ring-amber-500" 
             />
             <span className="ml-2 text-sm font-bold text-slate-700">Featured?</span>
           </label>
        </div>
      </div>

      {/* --- DYNAMIC FIELDS (Restored Tech Debt) --- */}
      <div className="bg-slate-50 p-4 rounded-md border border-slate-200 space-y-4">
        
        {/* CHARACTER SPECIFIC FIELDS */}
        {type === 'Character' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-slate-700">Title / Class</label>
               <input name="title" defaultValue={entity.character?.title} className="w-full px-3 py-2 border rounded-md" />
             </div>
             <div>
               <label className="block text-sm font-medium text-slate-700">Age</label>
               <input name="age" defaultValue={entity.character?.age} className="w-full px-3 py-2 border rounded-md" />
             </div>
             <div>
               <label className="block text-sm font-medium text-slate-700">Race</label>
               <select name="race_id" defaultValue={entity.character?.raceId || ""} className="w-full px-3 py-2 border rounded-md bg-white">
                 <option value="">-- None --</option>
                 {lists?.races.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
               </select>
             </div>
             <div>
               <label className="block text-sm font-medium text-slate-700">Family</label>
               <select name="family_id" defaultValue={entity.character?.familyId || ""} className="w-full px-3 py-2 border rounded-md bg-white">
                 <option value="">-- None --</option>
                 {lists?.families.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
               </select>
             </div>
             <div>
               <label className="block text-sm font-medium text-slate-700">Organisation</label>
               <select name="organisation_id" defaultValue={entity.character?.organisationId || ""} className="w-full px-3 py-2 border rounded-md bg-white">
                 <option value="">-- None --</option>
                 {lists?.orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
               </select>
             </div>
             <div className="flex items-center pt-6">
               <label className="inline-flex items-center">
                 <input type="checkbox" name="is_dead" defaultChecked={entity.character?.is_dead} className="h-4 w-4 text-red-600 rounded border-slate-300" />
                 <span className="ml-2 text-sm text-slate-700">Is Dead?</span>
               </label>
             </div>
          </div>
        )}

        {/* LOCATION SPECIFIC FIELDS */}
        {type === 'Location' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-slate-700">Parent Location</label>
               <select name="parent_location_id" defaultValue={entity.location?.parentLocationId || ""} className="w-full px-3 py-2 border rounded-md bg-white">
                 <option value="">-- Top Level --</option>
                 {/* Filter out self to prevent setting self as parent */}
                 {lists?.locations.filter(l => l.id !== entity.id).map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
               </select>
             </div>
             <div className="flex items-center pt-6">
               <label className="inline-flex items-center">
                 <input type="checkbox" name="is_destroyed" defaultChecked={entity.location?.is_destroyed} className="h-4 w-4 text-red-600 rounded border-slate-300" />
                 <span className="ml-2 text-sm text-slate-700">Is Destroyed?</span>
               </label>
             </div>
          </div>
        )}

        {/* ORGANISATION SPECIFIC FIELDS */}
        {type === 'Organisation' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-slate-700">Headquarters</label>
               <select name="location_id" defaultValue={entity.organisation?.locationId || ""} className="w-full px-3 py-2 border rounded-md bg-white">
                 <option value="">-- None --</option>
                 {lists?.locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
               </select>
             </div>
             <div className="flex items-center pt-6">
               <label className="inline-flex items-center">
                 <input type="checkbox" name="is_defunct" defaultChecked={entity.organisation?.is_defunct} className="h-4 w-4 text-red-600 rounded border-slate-300" />
                 <span className="ml-2 text-sm text-slate-700">Is Defunct?</span>
               </label>
             </div>
          </div>
        )}

        {/* FAMILY / RACE SPECIFIC FIELDS */}
        {(type === 'Family' || type === 'Race') && (
           <div className="flex items-center">
             <label className="inline-flex items-center">
               <input 
                 type="checkbox" 
                 name="is_extinct" 
                 defaultChecked={type === 'Family' ? entity.family?.is_extinct : entity.race?.is_extinct} 
                 className="h-4 w-4 text-red-600 rounded border-slate-300" 
               />
               <span className="ml-2 text-sm text-slate-700">Is Extinct?</span>
             </label>
           </div>
        )}
      </div>

      {/* IMAGE UPLOADER */}
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

      {/* RICH TEXT EDITOR */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Entry</label>
        <RichTextEditor 
          content={entryContent} 
          onChange={(html) => setEntryContent(html)} 
        />
      </div>

      {/* BUTTONS */}
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