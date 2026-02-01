'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';

interface EntityPreview {
  id: number;
  name: string;
  type: string;
  image_uuid: string | null;
  image_ext: string | null;
  entry: string;
}

export default function EntityLink({ id, name, children }: { id: number, name: string, children: React.ReactNode }) {
  const [data, setData] = useState<EntityPreview | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // We now store exact coordinates
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const linkRef = useRef<HTMLSpanElement>(null);

  const handleMouseEnter = async () => {
    if (linkRef.current) {
      const rect = linkRef.current.getBoundingClientRect();
      
      // LOGIC: Where should the card go?
      let top = rect.bottom + 10; // Default: 10px below the link
      let left = rect.left + (rect.width / 2); // Default: Centered on link

      // 1. Vertical Check (Flip to top if near bottom)
      // If we are in the bottom 40% of the screen, show ABOVE
      if (rect.top > window.innerHeight * 0.6) {
        top = rect.top - 10; // This will need CSS 'bottom-0' logic or just calculated height offset
      }

      // 2. Horizontal Check (The "Left Menu" Fix)
      // If the link is very close to the left edge (sidebar area), nudge the card right
      if (left < 250) {
        left = 250; // Force it to start at least 250px from left
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

  // Helper to determine if we are showing above or below based on the coords we set
  // (Simplified: We just use the calculated top for 'below' logic, 
  // but for 'above' logic we'd need to subtract height. 
  // Let's stick to "Always Below" unless it hits the bottom edge, using standard CSS classes.)

  return (
    <span 
      ref={linkRef}
      className="inline-block" // Removed 'relative' so it doesn't trap the child
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
            // If we calculated it should be above, we'd adjust transform.
            // For now, let's let CSS handle the "Above" logic via classes if possible,
            // or just use a smart transform.
          }}
          className={`
            fixed z-[9999] w-96 bg-white rounded-xl shadow-2xl ring-1 ring-slate-900/10 
            overflow-hidden pointer-events-none transition-all animate-in fade-in zoom-in-95 duration-200 block text-left
            -translate-x-1/2 
            ${/* If we are near bottom, translate Y up by 100% */ 
              coords.top > window.innerHeight * 0.6 ? '-translate-y-full -mt-6' : ''
            }
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