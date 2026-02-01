'use client';
import { useState, useEffect } from 'react';
import { resolveKankaMentions } from '@/lib/utils';
// 1. NEW IMPORTS
import parse, { Element, domToReact } from 'html-react-parser';
import EntityLink from './EntityLink';

interface JournalSessionProps {
  id: number;
  name: string;
  initialOpen?: boolean;
}

export default function JournalSession({ id, name, initialOpen = false }: JournalSessionProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // CRITICAL FIX: Check (content === null) instead of (!content)
    if (isOpen && content === null && !loading) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/posts/${id}`);
          if (!res.ok) {
            throw new Error(`Status: ${res.status}`);
          }
          const data = await res.json();
          // Use the util, but ensure we fallback to empty string if undefined
          const safeEntry = data.entry || ''; 
          setContent(resolveKankaMentions(safeEntry));
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

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  // 2. THE PARSER LOGIC (Robust Version)
  const parseContent = (htmlString: string) => {
    return parse(htmlString, {
      replace: (domNode) => {
        // Simple check: Is it an 'a' tag?
        if (domNode.type === 'tag' && domNode.name === 'a') {
          const href = domNode.attribs.href;
          const title = domNode.attribs.title;
          
          let entityId = null;

          // Strategy 1: Trust the Title (handles #123 and :123)
          if (title) {
            const titleMatch = title.match(/[:#](\d+)/); 
            if (titleMatch) entityId = parseInt(titleMatch[1]);
          }

          // Strategy 2: Trust the URL
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
  };

  return (
    <div className="border-b border-slate-200 last:border-0">
      <button 
        onClick={toggleOpen}
        className="w-full text-left py-4 flex justify-between items-center hover:bg-slate-50 transition-colors group"
      >
        <span className={`text-xl font-bold ${isOpen ? 'text-blue-800' : 'text-slate-700 group-hover:text-blue-600'}`}>
          {name}
        </span>
        <span className="text-slate-400">{isOpen ? '−' : '+'}</span>
      </button>
      
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
            <div className="prose prose-slate max-w-none">
              {/* 3. SWAP OUT DANGEROUSLYSETINNERHTML FOR PARSER */}
              {content ? parseContent(content) : <p className="text-slate-400 italic">This entry is empty.</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}