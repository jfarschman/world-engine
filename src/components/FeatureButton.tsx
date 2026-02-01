'use client';

import { StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { toggleFeatured } from '@/app/actions';

export default function FeatureButton({ id, isFeatured }: { id: number, isFeatured: boolean }) {
  return (
    <button 
      onClick={() => toggleFeatured(id)}
      className={`p-2 rounded-full transition-colors ${isFeatured ? 'text-amber-400 bg-amber-50' : 'text-slate-300 hover:text-amber-400 hover:bg-slate-50'}`}
      title={isFeatured ? "Unfeature" : "Feature on Dashboard"}
    >
      {isFeatured ? <StarIconSolid className="h-6 w-6" /> : <StarIcon className="h-6 w-6" />}
    </button>
  );
}