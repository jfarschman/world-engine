import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { cookies } from 'next/headers'; // <--- IMPORT

interface EntityListProps {
  type: string;
  title: string;
  page?: number;
}

export default async function EntityList({ type, title, page = 1 }: EntityListProps) {
  const pageSize = 25;
  const skip = (page - 1) * pageSize;
  
  // LOGIN CHECK
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.has('lore_session');

  const whereClause = {
    type: type,
    ...(isLoggedIn ? {} : { is_private: false }) // <--- FILTER ADDED
  };

  // 1. Fetch Data with Pagination AND Filter
  const entities = await prisma.entity.findMany({
    where: whereClause, // <--- USE CLAUSE
    select: { 
      id: true, 
      name: true, 
      type: true, 
      image_uuid: true, 
      image_ext: true,
      focal_x: true,
      focal_y: true,
    },
    orderBy: { name: 'asc' },
    take: pageSize,
    skip: skip,
  });

  // 2. Count Total with SAME Filter
  const totalCount = await prisma.entity.count({ where: whereClause }); // <--- USE CLAUSE
  const totalPages = Math.ceil(totalCount / pageSize);
  
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold leading-tight text-slate-900">{title}</h1>
          <p className="mt-2 text-sm text-slate-500">
            Showing {skip + 1}-{Math.min(skip + pageSize, totalCount)} of {totalCount}
          </p>
        </div>
      </div>

      {/* THE GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {entities.map((entity) => (
          <Link 
            key={entity.id} 
            href={`/entity/${entity.id}`}
            className="group block bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="aspect-[4/3] bg-slate-100 relative">
               {entity.image_uuid && entity.image_ext ? (
                 <img 
                   src={`/gallery/${entity.image_uuid}.${entity.image_ext}`} 
                   alt={entity.name} 
                   className="w-full h-full object-cover"
                   loading="lazy"
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
        ))}
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
          No {title.toLowerCase()} found.
        </div>
      )}
    </div>
  );
}