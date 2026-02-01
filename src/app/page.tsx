import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { UserGroupIcon, MapIcon, SparklesIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
// NEW IMPORT:
import RichTextRenderer from '@/components/RichTextRenderer';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  // 1. Fetch Featured Entities
  const featuredEntities = await prisma.entity.findMany({
    where: { is_featured: true },
    orderBy: { name: 'asc' },
    include: { character: true, location: true, organisation: true }
  });

  // 2. Fetch Recent Logs
  const recentPosts = await prisma.post.findMany({
    take: 5,
    orderBy: { id: 'desc' },
    include: { entity: true }
  });

  // 3. Stats
  const stats = {
    chars: await prisma.character.count(),
    locs: await prisma.location.count(),
    orgs: await prisma.organisation.count(),
    notes: await prisma.note.count(),
  };

  return (
    <div className="space-y-12">
      
      {/* HEADER */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-extrabold text-slate-900">Dashboard</h1>
        <p className="mt-2 text-slate-500">Welcome back, Dungeon Master.</p>
      </div>

      {/* 1. FEATURED / HONOR CARDS */}
      {featuredEntities.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center">
            <StarIconSolid className="h-6 w-6 text-amber-400 mr-2" />
            Featured Entities
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {featuredEntities.map(entity => (
              <div 
                key={entity.id} 
                className="group flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg hover:border-blue-300 transition-all h-full"
              >
                {/* IMAGE HEADER */}
                <Link href={`/entity/${entity.id}`} className="block relative w-full aspect-video bg-slate-800 overflow-hidden">
                  {entity.image_uuid ? (
                    <img 
                      src={`/gallery/${entity.image_uuid}.${entity.image_ext}`} 
                      className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                      alt={entity.name}
                    />
                  ) : (
                    <div className="w-full h-full opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-100 via-slate-400 to-slate-900"></div>
                  )}
                  
                  {/* TITLE OVERLAY */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 pt-12">
                      <h3 className="text-xl font-bold text-white leading-tight group-hover:text-blue-200">
                        {entity.name}
                      </h3>
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-300">
                        {entity.type}
                      </span>
                  </div>
                </Link>

                {/* CONTENT PREVIEW */}
                <div className="relative p-4 flex-1">
                  <div className="h-40 overflow-hidden prose prose-sm prose-slate max-w-none text-slate-600">
                    {/* HERE IS THE FIX: */}
                    <RichTextRenderer content={entity.entry} />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                </div>
                
                {/* FOOTER */}
                <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 text-xs text-slate-400 font-medium flex justify-between z-10 relative">
                    <span>Updated {new Date(entity.updatedAt).toLocaleDateString()}</span>
                    <Link href={`/entity/${entity.id}`} className="group-hover:translate-x-1 transition-transform text-blue-500 font-bold">
                      Open File &rarr;
                    </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. RECENT LOGS LIST */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 font-bold text-slate-700">
          Latest Journal Entries
        </div>
        <div className="divide-y divide-slate-100">
          {recentPosts.map(post => (
            <Link 
              key={post.id} 
              href={`/entity/${post.entityId}?open=${post.id}`}
              className="block px-6 py-4 hover:bg-slate-50 transition-colors group"
            >
              <div className="flex justify-between items-start">
                 <div>
                   <div className="font-semibold text-slate-900 group-hover:text-blue-600">
                     {post.name}
                   </div>
                   <div className="text-sm text-slate-500 mt-0.5">
                     Attached to <span className="font-medium text-slate-700">{post.entity.name}</span>
                   </div>
                 </div>
                 <div className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">
                   #{post.id}
                 </div>
              </div>
            </Link>
          ))}
          {recentPosts.length === 0 && (
             <div className="p-8 text-center text-slate-400 italic">No journals recorded yet.</div>
          )}
        </div>
      </div>

      {/* 3. STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-slate-200">
        <StatCard label="Characters" value={stats.chars} icon={UserGroupIcon} color="blue" />
        <StatCard label="Locations" value={stats.locs} icon={MapIcon} color="green" />
        <StatCard label="Organisations" value={stats.orgs} icon={SparklesIcon} color="purple" />
        <StatCard label="Notes" value={stats.notes} icon={DocumentTextIcon} color="amber" />
      </div>

    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: any) {
  const colors: any = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    amber: "bg-amber-100 text-amber-600",
  };
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
      <div className={`p-3 rounded-lg ${colors[color]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</div>
      </div>
    </div>
  );
}