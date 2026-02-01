import { prisma } from '@/lib/prisma';
import Link from 'next/link';

interface EntityListProps {
  type: string; // e.g., "Character", "Location", "Organisation"
  title: string;
}

export default async function EntityList({ type, title }: EntityListProps) {
  // Fetch entities of the requested type
  const entities = await prisma.entity.findMany({
    where: { type: type },
    select: { id: true, name: true, type: true, image_uuid: true, image_ext: true },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-3xl font-bold leading-tight text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">
          Index of known {title.toLowerCase()} in the database.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {entities.map((entity) => (
          <Link 
            key={entity.id} 
            href={`/entity/${entity.id}`}
            className="group relative flex items-center space-x-3 rounded-lg border border-slate-300 bg-white px-6 py-5 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 hover:border-slate-400"
          >
            {/* Thumbnail Image (if exists) */}
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-slate-200 overflow-hidden">
               {entity.image_uuid && entity.image_ext ? (
                 <img 
                   src={`/gallery/${entity.image_uuid}.${entity.image_ext}`} 
                   alt="" 
                   className="h-full w-full object-cover"
                   loading="lazy"
                 />
               ) : (
                 <div className="h-full w-full flex items-center justify-center text-slate-400 font-bold text-xs">
                   {entity.name.substring(0,2).toUpperCase()}
                 </div>
               )}
            </div>
            
            <div className="min-w-0 flex-1">
              <span className="absolute inset-0" aria-hidden="true" />
              <p className="text-sm font-medium text-slate-900">{entity.name}</p>
              <p className="truncate text-sm text-slate-500">{entity.type}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}