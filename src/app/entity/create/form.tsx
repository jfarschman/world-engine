'use client';

import { useState, useEffect } from 'react';
import { createEntity } from '@/app/actions';
import { useSearchParams } from 'next/navigation';
// NEW IMPORT:
import RichTextEditor from '@/components/RichTextEditor';

interface SimpleEntity { id: number; name: string; }

interface FormProps {
  locations: SimpleEntity[];
  races: SimpleEntity[];
  families: SimpleEntity[];
  orgs: SimpleEntity[];
}

export default function EntityForm({ locations, races, families, orgs }: FormProps) {
  const searchParams = useSearchParams();
  const [type, setType] = useState(searchParams.get('type') || 'Character');

  // NEW STATE: Track the editor content
  const [entryContent, setEntryContent] = useState('');

  useEffect(() => {
    const paramType = searchParams.get('type');
    if (paramType) setType(paramType);
  }, [searchParams]);

  return (
    <form action={createEntity} className="space-y-8">
        
      {/* TYPE SELECTOR */}
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
        <label className="block text-sm font-medium text-slate-700 mb-2">Entity Type</label>
        <div className="flex flex-wrap gap-2">
          {['Character', 'Location', 'Organisation', 'Family', 'Race', 'Note'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`
                px-4 py-2 rounded-full text-sm font-bold transition-all
                ${type === t 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300'}
              `}
            >
              {t}
            </button>
          ))}
        </div>
        <input type="hidden" name="type" value={type} />
      </div>

      {/* CORE FIELDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700">Name</label>
          <input name="name" type="text" required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border py-2 px-3" placeholder="Entity Name" />
        </div>
        
        {/* Image Filename */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700">Image Filename</label>
          <div className="flex">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-300 bg-slate-50 text-slate-500 text-sm">
              /gallery/
            </span>
            <input name="image_filename" type="text" className="flex-1 block w-full rounded-none rounded-r-md border-slate-300 focus:border-blue-500 focus:ring-blue-500 border py-2 px-3" placeholder="filename.jpg" />
          </div>
        </div>

        {/* --- REPLACED TEXTAREA WITH RICH EDITOR --- */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          
          {/* Hidden input carries the HTML content to the server action */}
          <input type="hidden" name="entry" value={entryContent} />
          
          <RichTextEditor 
            content={entryContent} 
            onChange={(html) => setEntryContent(html)} 
          />
        </div>
      </div>

      {/* DYNAMIC SECTIONS */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 border-b pb-2">
          {type} Specifics
        </h3>

        {/* CHARACTER FIELDS */}
        {type === 'Character' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Title / Class</label>
              <input name="title" type="text" className="mt-1 block w-full border rounded-md py-2 px-3 border-slate-300" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Age</label>
              <input name="age" type="text" className="mt-1 block w-full border rounded-md py-2 px-3 border-slate-300" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700">Race / Ancestry</label>
              <select name="race_id" className="mt-1 block w-full border rounded-md py-2 px-3 border-slate-300 bg-white">
                <option value="">-- None --</option>
                {races.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Location</label>
              <select name="location_id" className="mt-1 block w-full border rounded-md py-2 px-3 border-slate-300 bg-white">
                <option value="">-- Unknown --</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* LOCATION FIELDS */}
        {type === 'Location' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
              <label className="block text-sm font-medium text-slate-700">Parent Location</label>
              <select name="parent_location_id" className="mt-1 block w-full border rounded-md py-2 px-3 border-slate-300 bg-white">
                <option value="">-- Top Level --</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div className="flex items-center pt-8">
              <input name="is_destroyed" type="checkbox" className="h-4 w-4 text-red-600 rounded border-slate-300" />
              <label className="ml-2 block text-sm text-slate-900">Is Destroyed?</label>
            </div>
          </div>
        )}

        {/* ORGANISATION FIELDS */}
        {type === 'Organisation' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-slate-700">Headquarters (Location)</label>
               <select name="location_id" className="mt-1 block w-full border rounded-md py-2 px-3 border-slate-300 bg-white">
                 <option value="">-- None --</option>
                 {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
               </select>
             </div>
             <div className="flex items-center pt-8">
               <input name="is_defunct" type="checkbox" className="h-4 w-4 text-red-600 rounded border-slate-300" />
               <label className="ml-2 block text-sm text-slate-900">Is Defunct?</label>
             </div>
           </div>
        )}

        {/* NOTE FIELDS */}
        {type === 'Note' && (
            <div>
              <label className="block text-sm font-medium text-slate-700">Category</label>
              <select name="note_type" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border py-2 px-2 bg-white">
                <option value="General">General</option>
                <option value="Session Plan">Session Plan</option>
                <option value="Secret">Secret</option>
                <option value="Idea">Idea</option>
              </select>
            </div>
        )}

      </div>

      <button type="submit" className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors">
        Create {type}
      </button>
    </form>
  );
}