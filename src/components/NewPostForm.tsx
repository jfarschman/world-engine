'use client';

import { useState } from 'react';
import { createPost } from '@/app/actions';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import RichTextEditor from './RichTextEditor';

export default function NewPostForm({ entityId }: { entityId: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editorContent, setEditorContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    // The rich text HTML is passed via the hidden input named 'entry' below
    await createPost(formData);
    
    // Reset form
    setIsOpen(false);
    setEditorContent('');
    setIsSubmitting(false);
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

      <form action={handleSubmit} className="space-y-4">
        <input type="hidden" name="entity_id" value={entityId} />
        
        {/* Hidden Input to carry the Editor HTML to the server */}
        <input type="hidden" name="entry" value={editorContent} />
        
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
          {/* Optional: Add back Private checkbox if needed, kept simple for now */}
        </div>

        {/* Rich Content Editor */}
        <div>
          <RichTextEditor 
            content={editorContent} 
            onChange={(html) => setEditorContent(html)} 
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-2">
          <button 
            type="button" 
            onClick={() => setIsOpen(false)}
            disabled={isSubmitting}
            className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md"
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Post'}
          </button>
        </div>
      </form>
    </div>
  );
}