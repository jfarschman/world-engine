import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import SidebarShell from '@/components/SidebarShell';
import Footer from '@/components/Footer';
import HitCounter from '@/components/HitCounter';
import { getCurrentWorld } from '@/lib/get-current-world'; 

const inter = Inter({ subsets: ['latin'] });

export async function generateMetadata(): Promise<Metadata> {
  const world = await getCurrentWorld();
  return {
    title: {
      template: `%s | ${world.name}`,
      default: world.name,
    },
    description: 'Campaign Manager',
  };
}

// 1. Make the component async
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 2. Fetch the world data (which includes 'myRole')
  const world = await getCurrentWorld();

  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50`}>
        <div className="flex min-h-screen flex-col md:flex-row">
          
          <SidebarShell>
            <Sidebar />
          </SidebarShell>

          <main className="flex-1 p-4 pt-20 md:p-8 md:pt-8 overflow-x-hidden">
            {children}
          </main>
        </div>
        
        {/* 3. Pass the role to the Footer */}
        <Footer userRole={world.myRole} />
        
        <HitCounter />
      </body>
    </html>
  );
}