import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { logout } from '@/app/actions';
import SidebarSearch from './SidebarSearch';
import { 
  HomeIcon, 
  UserGroupIcon, 
  MapIcon, 
  BuildingLibraryIcon, 
  UsersIcon, 
  SparklesIcon,
  DocumentTextIcon,
  PlusIcon,
  ArrowRightOnRectangleIcon, 
  ArrowLeftOnRectangleIcon,
  BookOpenIcon 
} from '@heroicons/react/24/outline';

const navItems = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Characters', href: '/characters', icon: UserGroupIcon, type: 'Character' },
  { name: 'Locations', href: '/locations', icon: MapIcon, type: 'Location' },
  { name: 'Organisations', href: '/organisations', icon: BuildingLibraryIcon, type: 'Organisation' },
  { name: 'Families', href: '/families', icon: UsersIcon, type: 'Family' },
  { name: 'Races', href: '/races', icon: SparklesIcon, type: 'Race' },
  { name: 'Notes', href: '/notes', icon: DocumentTextIcon, type: 'Note' },
  // NEW ITEM HERE:
  { name: 'Journals', href: '/journals', icon: BookOpenIcon }, 
];

export default async function Sidebar() {
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.has('lore_session');

  // Fetch recent journals for the bottom section
  const recentPosts = await prisma.post.findMany({
    take: 5,
    orderBy: { id: 'desc' },
    include: { entity: true }
  });

  return (
    <div className="flex h-full w-64 flex-col bg-slate-900 text-white shadow-xl fixed left-0 top-0 bottom-0 overflow-y-auto z-50">
      
      {/* Brand */}
      <div className="flex h-16 items-center justify-center border-b border-slate-800 bg-slate-950 px-4 shrink-0">
        <h1 className="text-xl font-bold tracking-widest text-blue-400">LORE<span className="text-white">DB</span></h1>
      </div>

      {/* Search */}
      <div className="mt-4 shrink-0">
        <SidebarSearch />
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-2 overflow-y-auto">
        {navItems.map((item) => (
          <div key={item.name} className="group relative flex items-center">
            <Link
              href={item.href}
              className="flex flex-1 items-center rounded-l-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <item.icon className="mr-3 h-6 w-6 flex-shrink-0 text-slate-400 group-hover:text-blue-400" aria-hidden="true" />
              {item.name}
            </Link>
            
            {/* Contextual Create Button (Only if type is defined) */}
            {isLoggedIn && item.type && (
               <Link
                 href={`/entity/create?type=${item.type}`}
                 className="hidden group-hover:flex items-center justify-center px-2 py-2 rounded-r-md hover:bg-slate-700 text-slate-500 hover:text-green-400 transition-colors"
                 title={`Create new ${item.type}`}
               >
                 <PlusIcon className="h-4 w-4" />
               </Link>
            )}
          </div>
        ))}

        {/* RECENT JOURNALS SECTION (kept as requested!) */}
        {recentPosts.length > 0 && (
          <div className="pt-6 pb-2">
            <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Recent Activity
            </h3>
            <div className="space-y-1">
              {recentPosts.map(post => (
                <Link 
                  key={post.id}
                  href={`/entity/${post.entityId}?open=${post.id}`}
                  className="group flex items-center px-3 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors truncate"
                >
                  <BookOpenIcon className="mr-3 h-4 w-4 flex-shrink-0 text-slate-600 group-hover:text-amber-500" />
                  <span className="truncate">
                    {post.name}
                    <span className="block text-[10px] text-slate-600 group-hover:text-slate-500">
                      on {post.entity.name}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-800 p-4 shrink-0">
        {isLoggedIn ? (
          <form action={logout}>
            <button className="flex w-full items-center px-2 py-2 text-sm font-medium text-red-400 hover:bg-slate-800 hover:text-red-300 rounded-md transition-colors">
              <ArrowLeftOnRectangleIcon className="mr-3 h-5 w-5" />
              Logout
            </button>
          </form>
        ) : (
          <Link 
            href="/login"
            className="flex w-full items-center px-2 py-2 text-sm font-medium text-blue-400 hover:bg-slate-800 hover:text-blue-300 rounded-md transition-colors"
          >
            <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
            DM Login
          </Link>
        )}
      </div>
    </div>
  );
}