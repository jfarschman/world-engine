import { prisma } from '@/lib/prisma';
import Link from 'next/link';

interface EntityListProps {
  type: string;
  title: string;
}

export default async function EntityList({ type, title }: EntityListProps) {
  // Fetch entities (LEAN MODE: Limit to 25 to protect server memory)
  const entities = await prisma.entity.findMany({
    where: { type: type },
    select: { 
      id: true, 
      name: true, 
      type: true, 
      image_uuid: true, 
      image_ext: true,
      // --- ADDED FOCAL POINTS HERE ---
      focal_x: true,
      focal_y: true,
    },
    orderBy: { name: 'asc' },
    take: 25, 
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-3xl font-bold leading-tight text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">
          Showing top 25 {title.toLowerCase()}.
        </p>
      </div>

      {/* GRID LAYOUT */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {entities.map((entity) => (
          <Link 
            key={entity.id} 
            href={`/entity/${entity.id}`}
            className="group block bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Image Container: Aspect 4/3 (Wider than tall) */}
            <div className="aspect-[4/3] bg-slate-100 relative">
               {entity.image_uuid && entity.image_ext ? (
                 <img 
                   src={`/gallery/${entity.image_uuid}.${entity.image_ext}`} 
                   alt={entity.name} 
                   className="w-full h-full object-cover"
                   loading="lazy"
                   // --- FOCAL POINT APPLIED HERE ---
                   style={{
                      objectPosition: `${entity.focal_x || 50}% ${entity.focal_y || 50}%`
                   }}
                 />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold text-2xl">
                   {entity.name.substring(0,2).toUpperCase()}
                 </div>
               )}
            </div>
            
            {/* Footer: Name (Truncated) */}
            <div className="p-3 border-t border-slate-100">
              <p className="text-sm font-semibold text-slate-800 truncate" title={entity.name}>
                {entity.name}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider">
                {entity.type}
              </p>
            </div>
          </Link>
        ))}
      </div>
      
      {/* Empty State Helper */}
      {entities.length === 0 && (
        <div className="text-center py-12 text-slate-400 italic">
          No {title.toLowerCase()} found.
        </div>
      )}
    </div>
  );
}