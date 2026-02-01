import { prisma } from '@/lib/prisma';
import { createEntity } from '@/app/actions';
import { redirect } from 'next/navigation';

export default async function CreateEntityPage() {
  
  // 1. FETCH HELPERS (The "Smart" part)
  const locations = await prisma.entity.findMany({
    where: { type: 'Location' },
    orderBy: { name: 'asc' },
    select: { id: true, name: true }
  });

  const races = await prisma.entity.findMany({
    where: { type: 'Race' },
    orderBy: { name: 'asc' },
    select: { id: true, name: true }
  });

  const families = await prisma.entity.findMany({
    where: { type: 'Family' },
    orderBy: { name: 'asc' },
    select: { id: true, name: true }
  });
  
  const orgs = await prisma.entity.findMany({
    where: { type: 'Organisation' },
    orderBy: { name: 'asc' },
    select: { id: true, name: true }
  });

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-8 px-4">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-extrabold text-slate-900">Create New Entity</h1>
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

// We split the Form into a Client Component so we can handle the "Type" switching state
// while keeping the data fetching on the server.
import EntityForm from './form';