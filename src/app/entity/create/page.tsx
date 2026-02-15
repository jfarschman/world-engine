import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import EntityForm from './form';
import { getCurrentWorld } from '@/lib/get-current-world'; // [NEW] Import

export default async function CreateEntityPage() {
  
  // 1. GET WORLD CONTEXT & CHECK PERMISSIONS
  const world = await getCurrentWorld();

  // Security Gate: Only ADMIN and DM can create entities
  if (world.myRole !== 'ADMIN' && world.myRole !== 'DM') {
    redirect('/'); 
  }

  // 2. FETCH HELPERS (Scoped to Current World)
  const locations = await prisma.entity.findMany({
    where: { type: 'Location', worldId: world.id }, // [NEW] Filter by World
    orderBy: { name: 'asc' },
    select: { id: true, name: true }
  });

  const races = await prisma.entity.findMany({
    where: { type: 'Race', worldId: world.id }, // [NEW] Filter by World
    orderBy: { name: 'asc' },
    select: { id: true, name: true }
  });

  const families = await prisma.entity.findMany({
    where: { type: 'Family', worldId: world.id }, // [NEW] Filter by World
    orderBy: { name: 'asc' },
    select: { id: true, name: true }
  });
  
  const orgs = await prisma.entity.findMany({
    where: { type: 'Organisation', worldId: world.id }, // [NEW] Filter by World
    orderBy: { name: 'asc' },
    select: { id: true, name: true }
  });

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-8 px-4">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-extrabold text-slate-900">Create New Entity</h1>
        <p className="mt-2 text-sm text-slate-500">
          Adding to <span className="font-semibold text-blue-600">{world.name}</span>
        </p>
      </div>

      <EntityForm 
        locations={locations} 
        races={races} 
        families={families} 
        orgs={orgs} 
      />
    </div>
  );
}