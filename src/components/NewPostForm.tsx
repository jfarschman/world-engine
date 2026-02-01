'use client';

import { useState, useRef } from 'react';
import { createPost } from '@/app/actions';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function NewPostForm({ entityId }: { entityId: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (formData: FormData) => {
    await createPost(formData);
    setIsOpen(false);
    formRef.current?.reset();
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors py-2"
      >
        <PlusIcon className="h-5 w-5" />
        <span>New Post</span>
      </button>
    );
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 animate-in fade-in slide-in-from-top-2">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Write New Post</h3>
        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      <form ref={formRef} action={handleSubmit} className="space-y-4">
        <input type="hidden" name="entity_id" value={entityId} />
        
        {/* Title Row */}
        <div className="flex gap-4">
          <div className="flex-1">
            <input 
              name="name" 
              type="text" 
              required
              placeholder="Post Title (e.g. Session Log: The Rat King)"
              className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 text-sm" 
            />
          </div>
          <div className="flex items-center bg-white px-3 border border-slate-300 rounded-md">
            <input 
              name="is_private" 
              id="is_private"
              type="checkbox" 
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-slate-300 rounded" 
            />
            <label htmlFor="is_private" className="ml-2 block text-xs font-bold text-slate-600">
              PRIVATE
            </label>
          </div>
        </div>

        {/* Content */}
        <div>
          <textarea 
            name="entry" 
            rows={4}
            className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 text-sm font-mono"
            placeholder="Write your entry here... (Supports HTML)"
          ></textarea>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-2">
          <button 
            type="button" 
            onClick={() => setIsOpen(false)}
            className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md"
          >
            Cancel
          </button>
          <button 
            type="submit"
            className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm"
          >
            Save Post
          </button>
        </div>
      </form>
    </div>
  );
}