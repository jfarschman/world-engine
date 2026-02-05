'use client';

import { useState, useEffect } from 'react';
import { resolveKankaMentions } from '@/lib/utils';
import { updatePost } from '@/app/actions';
import parse, { domToReact } from 'html-react-parser';
import EntityLink from './EntityLink';
import RichTextEditor from './RichTextEditor';
import { PencilSquareIcon } from '@heroicons/react/24/outline';

interface JournalSessionProps {
  id: number;
  name: string;
  initialOpen?: boolean;
}

export default function JournalSession({ id, name, initialOpen = false }: JournalSessionProps) {
  // View State
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [loading, setLoading] = useState(false);
  
  // Data State
  const [content, setContent] = useState<string | null>(null);
  const [currentName, setCurrentName] = useState(name);
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editorContent, setEditorContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setCurrentName(name);
  }, [name]);

  useEffect(() => {
    if (isOpen && content === null && !loading) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/posts/${id}`);
          if (!res.ok) throw new Error(`Status: ${res.status}`);
          const data = await res.json();
          setContent(data.entry || ''); 
        } catch (error) {
          console.error("Failed to load journal entry", error);
          setContent("<p><em>Error loading entry.</em></p>");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [isOpen, content, loading, id]);

  const toggleOpen = () => setIsOpen(!isOpen);

  // --- ROBUST PARSER ---
  const parseContent = (htmlString: string) => {
    try {
      // 1. Resolve Legacy Mentions
      let safeHtml = resolveKankaMentions(htmlString);

      // 2. Sanitize tricky characters
      safeHtml = safeHtml.replace(/<(and|or|but|the)\b/gi, '&lt;$1');

      // 3. Parse and replace Elements
      return parse(safeHtml, {
        replace: (domNode) => {
          // CHECK 1: Tiptap Mentions (<span data-type="mention">)
          if (domNode.type === 'tag' && domNode.name === 'span' && domNode.attribs['data-type'] === 'mention') {
             const id = parseInt(domNode.attribs['data-id']);
             const label = domNode.attribs['data-label'];
             
             if (id) {
               return (
                 <EntityLink id={id} name={label || 'Entity'}>
                   <span className="bg-blue-50 text-blue-700 rounded px-1 py-0.5 font-medium">
                     {/* No '@' symbol, just the name */}
                     {label || 'Entity'}
                   </span>
                 </EntityLink>
               );
             }
          }

          // CHECK 2: Standard Links (<a>)
          if (domNode.type === 'tag' && domNode.name === 'a') {
            const href = domNode.attribs.href;
            const title = domNode.attribs.title;
            let entityId = null;

            if (title) {
              const titleMatch = title.match(/[:#](\d+)/); 
              if (titleMatch) entityId = parseInt(titleMatch[1]);
            }
            if (!entityId && href) {
               const hrefMatch = href.match(/entity\/(\d+)/); 
               if (hrefMatch) entityId = parseInt(hrefMatch[1]);
            }

            if (entityId) {
              return (
                <EntityLink id={entityId} name={title || 'Entity'}>
                  {/* @ts-ignore */}
                  {domToReact(domNode.children)}
                </EntityLink>
              );
            }
          }
        }
      });
    } catch (e) {
      console.error("Parser Error:", e);
      return <div className="text-red-600 bg-red-50 p-2 text-sm font-mono whitespace-pre-wrap">{htmlString}</div>;
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    setEditorContent(content || ''); 
    setIsEditing(true);
    setIsOpen(true);
  };

  const handleSave = async (formData: FormData) => {
    setIsSaving(true);
    await updatePost(formData);
    setCurrentName(formData.get('name') as string);
    setContent(editorContent); 
    setIsSaving(false);
    setIsEditing(false);
  };

  return (
    <div className="border-b border-slate-200 last:border-0 relative">
      
      {/* HEADER */}
      <div className="relative group/header">
        <button 
          onClick={toggleOpen}
          // pr-24 ensures text doesn't run under the buttons
          className="w-full text-left py-4 flex justify-between items-center hover:bg-slate-50 transition-colors pr-24" 
        >
          <span className={`text-xl font-bold ${isOpen ? 'text-blue-800' : 'text-slate-700 group-hover/header:text-blue-600'}`}>
            {currentName}
          </span>
        </button>

        {/* EDIT PENCIL */}
        {/* Removed 'opacity-0' and 'group-hover' classes so it is always visible */}
        {!isEditing && (
          <div className="absolute top-4 right-20 z-20 transition-opacity">
            <button 
              onClick={handleEditClick}
              className="p-1.5 bg-white text-slate-400 hover:text-blue-600 border border-slate-200 rounded-full shadow-sm"
              title="Edit Post"
            >
              <PencilSquareIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
      
      {/* BODY */}
      {isOpen && (
        <div className="pb-8 px-2 animate-in fade-in slide-in-from-top-2 duration-300">
          {loading ? (
             <div className="flex items-center space-x-2 text-slate-400 italic">
                <svg className="animate-spin h-5 w-5 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Unrolling parchment...</span>
            </div>
          ) : (
            <>
              {isEditing ? (
                <form action={handleSave} className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
                  <input type="hidden" name="id" value={id} />
                  <input type="hidden" name="entity_id" value="0" /> 
                  <input type="hidden" name="entry" value={editorContent} />

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label>
                    <input 
                      name="name" 
                      defaultValue={currentName} 
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-bold text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Content</label>
                    <RichTextEditor 
                      content={editorContent} 
                      onChange={(html) => setEditorContent(html)} 
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <button 
                      type="button" 
                      onClick={() => setIsEditing(false)}
                      disabled={isSaving}
                      className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isSaving}
                      className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-sm"
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="prose prose-slate max-w-none pr-8">
                  {content ? parseContent(content) : <p className="text-slate-400 italic">This entry is empty.</p>}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}