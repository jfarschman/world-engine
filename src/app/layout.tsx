import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar'; // <--- Import the new component

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
        <div className="flex min-h-screen">
          
          {/* REPLACE THE OLD SIDEBAR CODE WITH THIS LINE: */}
          <Sidebar />

          <main className="flex-1 ml-64 p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}