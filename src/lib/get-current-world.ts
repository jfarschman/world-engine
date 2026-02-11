import { headers } from 'next/headers';
import { prisma } from './prisma';

export async function getCurrentWorld() {
  const headersList = await headers();
  const host = headersList.get('host') || ''; // e.g. "lsoc.hitechsavvy.com" or "localhost:3000"
  
  // Clean the domain (remove port number if testing locally)
  const domain = host.split(':')[0]; 

  // 1. Try to find a world matching this specific domain or slug
  const world = await prisma.world.findFirst({
    where: {
      OR: [
        { domain: domain },             // Exact match "drakkenheim.hitechsavvy.com"
        { slug: domain.split('.')[0] }  // Subdomain match "drakkenheim"
      ]
    }
  });

  // 2. If found, return it.
  if (world) return world;

  // 3. FALLBACK: Default to "Little Shoppe" (ID 1)
  // This ensures that localhost or unconfigured domains always show your main campaign.
  return { id: 1, name: 'Little Shoppe of Curiosities', slug: 'lsoc' };
}