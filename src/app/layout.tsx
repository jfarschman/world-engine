import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import SidebarShell from '@/components/SidebarShell';
import Footer from '@/components/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'LoreDB',
  description: 'Campaign Manager',
};

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
          {/* md:ml-0 -> Because the sidebar is now 'static' in flex row on desktop, we don't need margin-left. 
              The flex container handles it. */}
          {/* pt-20 -> Adds padding on mobile so content isn't hidden behind the top bar */}
          <main className="flex-1 p-4 pt-20 md:p-8 md:pt-8 overflow-x-hidden">
            {children}
          </main>
        </div>
        <Footer />
      </body>
    </html>
  );
}