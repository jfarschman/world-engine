import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import SidebarShell from '@/components/SidebarShell';
import Footer from '@/components/Footer';
import HitCounter from '@/components/HitCounter';
import { getCurrentWorld } from '@/lib/get-current-world'; // <--- IMPORT

const inter = Inter({ subsets: ['latin'] });

// REPLACED STATIC METADATA WITH DYNAMIC GENERATION
export async function generateMetadata(): Promise<Metadata> {
  const world = await getCurrentWorld();
  
  return {
    title: {
      template: `%s | ${world.name}`, // "Character Name | Drakkenheim"
      default: world.name,            // "Drakkenheim" (on homepage)
    },
    description: 'Campaign Manager',
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50`}>
        <div className="flex min-h-screen flex-col md:flex-row">
          
          {/* WRAPPER PATTERN: Client Shell holds Server Content */}
          <SidebarShell>
            <Sidebar />
          </SidebarShell>

          {/* MAIN CONTENT AREA */}
          <main className="flex-1 p-4 pt-20 md:p-8 md:pt-8 overflow-x-hidden">
            {children}
          </main>
        </div>
        <Footer />
        <HitCounter />
      </body>
    </html>
  );
}