'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';

interface EntityPreview {
  id: number;
  name: string;
  type: string;
  image_uuid: string | null;
  image_ext: string | null;
  // --- ADDED FOCAL POINTS ---
  focal_x?: number;
  focal_y?: number;
  // --------------------------
  entry: string;
}

export default function EntityLink({ id, name, children }: { id: number, name: string, children: React.ReactNode }) {
  const [data, setData] = useState<EntityPreview | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const linkRef = useRef<HTMLSpanElement>(null);

  const handleMouseEnter = async () => {
    if (linkRef.current) {
      const rect = linkRef.current.getBoundingClientRect();
      
      let top = rect.bottom + 10; 
      let left = rect.left + (rect.width / 2); 

      // 1. Vertical Check
      if (rect.top > window.innerHeight * 0.6) {
        top = rect.top - 10; 
      }

      // 2. Horizontal Check
      if (left < 250) {
        left = 250; 
      }

      setCoords({ top, left });
    }

    setIsOpen(true);
    
    // Fetch Data
    if (!data && !loading) {
      setLoading(true);
      try {
        const res = await fetch(`/api/preview/${id}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) {
        console.error("Failed to load preview", e);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <span 
      ref={linkRef}
      className="inline-block" 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsOpen(false)}
    >
      <Link 
        href={`/entity/${id}`}
        className="text-blue-700 hover:text-blue-900 hover:underline font-medium transition-colors"
      >
        {children}
      </Link>

      {isOpen && (
        <span 
          style={{ 
            top: coords.top, 
            left: coords.left,
          }}
          className={`
            fixed z-[9999] w-96 bg-white rounded-xl shadow-2xl ring-1 ring-slate-900/10 
            overflow-hidden pointer-events-none transition-all animate-in fade-in zoom-in-95 duration-200 block text-left
            -translate-x-1/2 
            ${coords.top > window.innerHeight * 0.6 ? '-translate-y-full -mt-6' : ''}
          `}
        >
          
          {loading && !data ? (
            <span className="p-8 flex justify-center items-center text-slate-400">
              <span className="animate-spin h-6 w-6 border-2 border-blue-500 rounded-full border-t-transparent block"></span>
            </span>
          ) : data ? (
            <>
              {/* HERO IMAGE */}
              <span className="h-40 w-full bg-slate-100 relative overflow-hidden shrink-0 block">
                {data.image_uuid && data.image_ext ? (
                  <img
                    src={`/gallery/${data.image_uuid}.${data.image_ext}`}
                    alt={data.name}
                    className="absolute inset-0 h-full w-full object-cover"
                    // --- FOCAL POINT APPLIED HERE ---
                    style={{
                      objectPosition: `${data.focal_x || 50}% ${data.focal_y || 50}%`
                    }}
                  />
                ) : (
                  <span className="flex h-full items-center justify-center bg-slate-100 text-slate-300">
                    <span className="text-4xl font-bold">{data.name.charAt(0)}</span>
                  </span>
                )}
                <span className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent block" />
                <span className="absolute bottom-0 left-0 p-4 block">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">{data.type}</span>
                  <span className="text-xl font-bold text-white shadow-sm block">{data.name}</span>
                </span>
              </span>

              {/* TEXT CONTENT */}
              <span className="p-4 bg-white block">
                 <span className="text-xs text-slate-600 leading-relaxed line-clamp-[12] block">
                   {data.entry}
                 </span>
              </span>
            </>
          ) : null}
        </span>
      )}
    </span>
  );
}