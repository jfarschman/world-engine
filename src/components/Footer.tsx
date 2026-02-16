'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Define the shape of the props this component expects
interface FooterProps {
  userRole?: 'ADMIN' | 'DM' | 'PLAYER' | 'GUEST';
}

export default function Footer({ userRole = 'GUEST' }: FooterProps) {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();
  
  // Don't show footer on the login page
  if (pathname === '/login') return null;

  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          
          {/* COLUMN 1: Campaign / Instance Info */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              World Engine
            </h3>
            <p className="text-sm text-slate-500">
              A self-hosted TTRPG campaign manager. 
              Organize your lore, characters, and adventures locally.
            </p>
            <p className="text-xs text-slate-400 mt-4">
              &copy; {currentYear} Jay Farschman.
            </p>
          </div>

          {/* COLUMN 2: Navigation */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Navigation
            </h3>
            <ul className="space-y-1">
              <li>
                <Link href="/" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/search" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">
                  Global Search
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">
                  GM Login
                </Link>
              </li>

              {/* --- NEW: ADMIN ONLY LINK --- */}
              {userRole === 'ADMIN' && (
                <li className="pt-2 mt-2 border-t border-slate-100">
                  <a 
                    href="/api/export" 
                    className="text-sm text-indigo-600 font-medium hover:text-indigo-800 transition-colors flex items-center gap-2"
                  >
                    <span>Export World Data (Zip)</span>
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* COLUMN 3: Credits */}
          <div className="space-y-2 md:text-right">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Open Source
            </h3>
            <div className="flex flex-col md:items-end space-y-1">
              <a 
                href="https://github.com/jfarschman/world-engine" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-2"
              >
                <span>View on GitHub</span>
              </a>
              <span className="text-xs text-slate-400">
                Powered by Next.js & Prisma
              </span>
              <span className="text-xs text-slate-400">
                For fools who want to DIY
              </span>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}