import { prisma } from '@/lib/prisma';

export default async function HitCounter() {
  // Use upsert to safely increment the counter (or create it if it's the first run)
  const stats = await prisma.siteStats.upsert({
    where: { id: 1 },
    update: { views: { increment: 1 } },
    create: { id: 1, views: 1 },
  });

  return (
    <div className="w-full bg-slate-100 border-t border-slate-200 py-2 text-center">
      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
        Declarations of Truth: {stats.views.toLocaleString()}
      </span>
    </div>
  );
}