'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface SearchResult {
  id: number;
  parentId: number;
  name: string;
  type: string;
  image_uuid: string | null;
  image_ext: string | null;
  focal_x: number | null;
  focal_y: number | null;
  source: 'Entity' | 'Post';
}

export default function SearchClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
   
  const initialQuery = searchParams.get('q') || '';
  const initialPage = parseInt(searchParams.get('page') || '1');

  const [query, setQuery] = useState(initialQuery);
  const [page, setPage] = useState(initialPage);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 3) {
        performSearch(query, page);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, page]);

  // Sync URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentParams = new URLSearchParams(window.location.search);
      if (query !== currentParams.get('q') || page.toString() !== currentParams.get('page')) {
         router.replace(`/search?q=${encodeURIComponent(query)}&page=${page}`);
      }
    }
  }, [query, page, router]);

  // Reset page when query changes
  const handleQueryChange = (val: string) => {
    setQuery(val);
    setPage(1); // Always reset to page 1 on new search
  };

  const performSearch = async (term: string, pageNum: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(term)}&page=${pageNum}`);
      const data = await res.json();
      // Handle response structure { results: [...] }
      setResults(Array.isArray(data) ? data : []); 
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="mb-6 border-b border-slate-200 pb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Global Search</h1>
        <div className="relative max-w-lg">
          <input
            type="text"
            className="w-full px-4 py-2 border border-slate-300 rounded-md focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Search..."
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            autoFocus
          />
          {loading && (
            <div className="absolute right-3 top-2.5">
              <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
            </div>
          )}
        </div>
      </div>

      {/* RESULTS GRID */}
      {results.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {results.map((result) => (
            <Link 
              key={`${result.source}-${result.id}`} 
              href={result.source === 'Post' 
                ? `/entity/${result.parentId}?open=${result.id}` 
                : `/entity/${result.id}`
              }
              className="group block bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Image Container: Aspect 4/3 (Wider than tall) */}
              <div className="aspect-[4/3] bg-slate-100 relative">
                {result.image_uuid && result.image_ext ? (
                  <img 
                    src={`/gallery/${result.image_uuid}.${result.image_ext}`}
                    alt={result.name}
                    className="w-full h-full object-cover transition-all duration-500"
                    loading="lazy"
                    // --- NEW: Apply the focal point ---
                    style={{
                      objectPosition: `${result.focal_x ?? 50}% ${result.focal_y ?? 50}%`
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold text-2xl">
                    {result.name.substring(0,2).toUpperCase()}
                  </div>
                )}
                
                {/* Type Badge Overlay */}
                <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-black/50 text-white backdrop-blur-sm">
                  {result.type}
                </span>
              </div>

              {/* Name Footer */}
              <div className="p-3 border-t border-slate-100">
                <p className="text-sm font-semibold text-slate-800 truncate" title={result.name}>
                  {result.name}
                </p>
                {result.source === 'Post' && (
                  <p className="text-[10px] text-slate-400 mt-0.5">Journal Entry</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        query.length >= 3 && !loading && (
          <div className="text-center py-12 text-slate-500">
            No results found.
          </div>
        )
      )}

      {/* Simple Pagination Controls */}
      {results.length > 0 && (
        <div className="mt-8 flex justify-center space-x-4">
          <button 
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-slate-500">
            Page {page}
          </span>
          {/* We show Next if we have a full page of results (25). 
              If < 25, we are likely at the end. */}
          <button 
            disabled={results.length < 25}
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}