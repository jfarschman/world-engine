import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { getCurrentWorld } from '@/lib/get-current-world'; 

interface EntityListProps {
  type: string;
  title: string;
  page?: number;
}

export default async function EntityList({ type, title, page = 1 }: EntityListProps) {
  const pageSize = 25;
  const skip = (page - 1) * pageSize;
  
  // 1. GET WORLD CONTEXT & PERMISSIONS
  const world = await getCurrentWorld();
  
  // Define who can see private content (Everything except GUEST)
  const canSeePrivate = ['ADMIN', 'DM', 'PLAYER'].includes(world.myRole);

  console.log(`DEBUG: Fetching ${type} for World: ${world.name} (ID: ${world.id}). Role: ${world.myRole}`);

  // 2. BUILD FILTER
  const whereClause = {
    type: type,
    worldId: world.id, 
    // If user is GUEST, force is_private: false. Otherwise, show all.
    ...(canSeePrivate ? {} : { is_private: false })
  };

  // 3. Fetch Data with Status Flags
  const entities = await prisma.entity.findMany({
    where: whereClause,
    select: { 
      id: true, 
      name: true, 
      type: true, 
      image_uuid: true, 
      image_ext: true,
      focal_x: true,
      focal_y: true,
      is_private: true, // Fetch this to potentially visualize lock icons later
      // --- FETCH STATUS FLAGS ---
      character: { select: { is_dead: true } },
      location: { select: { is_destroyed: true } },
      organisation: { select: { is_defunct: true } },
      family: { select: { is_extinct: true } },
      race: { select: { is_extinct: true } },
    },
    orderBy: { name: 'asc' },
    take: pageSize,
    skip: skip,
  });

  // 4. Count Total (Scoped to World)
  const totalCount = await prisma.entity.count({ where: whereClause });
  const totalPages = Math.ceil(totalCount / pageSize);
  
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold leading-tight text-slate-900">{title}</h1>
          <p className="mt-2 text-sm text-slate-500">
            <span className="font-semibold text-blue-600 mr-1">{world.name}:</span>
            Showing {skip + 1}-{Math.min(skip + pageSize, totalCount)} of {totalCount}
          </p>
        </div>
      </div>

      {/* THE GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {entities.map((entity) => {
          // --- CALCULATE INACTIVE STATE ---
          const isInactive = 
            (entity.type === 'Character' && entity.character?.is_dead) ||
            (entity.type === 'Location' && entity.location?.is_destroyed) ||
            (entity.type === 'Organisation' && entity.organisation?.is_defunct) ||
            (entity.type === 'Family' && entity.family?.is_extinct) ||
            (entity.type === 'Race' && entity.race?.is_extinct);

          return (
            <Link 
              key={entity.id} 
              href={`/entity/${entity.id}`}
              className="group block bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-shadow relative"
            >
               {/* Visual Indicator for Private Entities (Visible to DMs/Players) */}
               {entity.is_private && (
                <div className="absolute top-2 right-2 z-10 bg-black/50 text-white p-1 rounded-full" title="Private">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                    <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
                  </svg>
                </div>
              )}

              <div className="aspect-[4/3] bg-slate-100 relative">
                 {entity.image_uuid && entity.image_ext ? (
                   <img 
                     src={`/gallery/${entity.image_uuid}.${entity.image_ext}`} 
                     alt={entity.name} 
                     className={`w-full h-full object-cover loading="lazy" ${isInactive ? 'grayscale' : ''}`}
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
              
              <div className="p-3 border-t border-slate-100">
                <p className="text-sm font-semibold text-slate-800 truncate" title={entity.name}>
                  {entity.name}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider">
                  {entity.type}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
      
      {/* PAGINATION CONTROLS */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4 pt-8">
          {hasPrev ? (
            <Link 
              href={`?page=${page - 1}`}
              className="flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
            >
              <ChevronLeftIcon className="h-4 w-4 mr-2" />
              Previous
            </Link>
          ) : (
            <button disabled className="flex items-center px-4 py-2 text-sm font-medium text-slate-300 bg-slate-50 border border-slate-200 rounded-md cursor-not-allowed">
              <ChevronLeftIcon className="h-4 w-4 mr-2" />
              Previous
            </button>
          )}

          <span className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </span>

          {hasNext ? (
            <Link 
              href={`?page=${page + 1}`}
              className="flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
            >
              Next
              <ChevronRightIcon className="h-4 w-4 ml-2" />
            </Link>
          ) : (
            <button disabled className="flex items-center px-4 py-2 text-sm font-medium text-slate-300 bg-slate-50 border border-slate-200 rounded-md cursor-not-allowed">
              Next
              <ChevronRightIcon className="h-4 w-4 ml-2" />
            </button>
          )}
        </div>
      )}

      {entities.length === 0 && (
        <div className="text-center py-12 text-slate-400 italic">
          No {title.toLowerCase()} found in {world.name}.
        </div>
      )}
    </div>
  );
}