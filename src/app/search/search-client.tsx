'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

interface SearchResult {
  id: number;
  parentId: number;
  name: string;
  type: string;
  source: 'Entity' | 'Post';
  snippet: string;
}

export default function SearchClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
   
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 3) {
        performSearch(query);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const currentParams = new URLSearchParams(window.location.search);
    if (query !== currentParams.get('q')) {
       router.replace(`/search?q=${encodeURIComponent(query)}`);
    }
  }, [query, router]);

  const performSearch = async (term: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
      const data = await res.json();
      setResults(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 border-b border-slate-200 pb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Global Search</h1>
        <div className="relative">
          <input
            type="text"
            className="w-full text-lg px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none shadow-sm"
            placeholder="Search characters, journals, locations..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {loading && (
            <div className="absolute right-4 top-4">
              <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
            </div>
          )}
        </div>
        <p className="mt-2 text-sm text-slate-500">
          Type at least 3 characters to search.
        </p>
      </div>

      <div className="space-y-6">
        {results.length === 0 && query.length >= 3 && !loading && (
           <div className="text-center py-12 text-slate-500">
             No results found for "{query}".
           </div>
        )}

        {results.map((result) => (
          <div 
            key={`${result.source}-${result.id}`} 
            className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <Link 
                href={result.source === 'Post' 
                  ? `/entity/${result.parentId}?open=${result.id}` 
                  : `/entity/${result.id}`
                }
                className="text-xl font-bold text-blue-700 hover:underline"
              >
                {result.name}
              </Link>
              <span className={`px-2 py-1 rounded text-xs uppercase font-bold tracking-wider ${
                result.source === 'Post' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
              }`}>
                {result.type}
              </span>
            </div>
            
            <div 
              className="text-slate-600 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: `...${result.snippet}...` }}
            />
            
            {result.source === 'Post' && (
               <div className="mt-2 text-xs text-slate-400">
                 Found in Journal Entry #{result.id}
               </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}