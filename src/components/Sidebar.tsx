import Link from 'next/link';
import { cookies } from 'next/headers';
import { logout } from '@/app/actions';
import SidebarSearch from './SidebarSearch';
import { getCurrentWorld } from '@/lib/get-current-world'; // <--- Import Helper
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
  { name: 'Ancestries', href: '/ancestries', icon: SparklesIcon, type: 'Race' },
  { name: 'Notes', href: '/notes', icon: DocumentTextIcon, type: 'Note' },
  { name: 'Journals', href: '/journals', icon: BookOpenIcon }, 
];

export default async function Sidebar() {
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.has('lore_session');
  
  // 1. Fetch Dynamic World Data
  const world = await getCurrentWorld();

  return (
    <div className="flex h-full w-full flex-col bg-slate-900 text-white overflow-y-auto">

      {/* Brand: Dynamic Name */}
      <div className="flex h-16 items-center justify-center border-b border-slate-800 bg-slate-950 px-4 shrink-0">
        <h1 className="text-xl font-bold tracking-widest text-blue-400">
          {/* Split name for styling (First word blue, rest white) */}
          {world.name.split(' ')[0]} <span className="text-white">{world.name.split(' ').slice(1).join(' ')}</span>
        </h1>
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
            
            {/* Contextual Create Button */}
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