import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query || query.length < 3) {
    return NextResponse.json([]);
  }

  // Fetch entities matching the name
  const entities = await prisma.entity.findMany({
    where: {
      name: {
        contains: query,
        mode: 'insensitive', // Case insensitive search
      },
    },
    select: {
      id: true,
      name: true,
      type: true,
    },
    take: 10, // Limit results for speed
  });

  // Sort: Characters first, then others
  const sorted = entities.sort((a, b) => {
    const isCharA = a.type === 'Character';
    const isCharB = b.type === 'Character';
    
    if (isCharA && !isCharB) return -1;
    if (!isCharA && isCharB) return 1;
    return 0;
  });

  return NextResponse.json(sorted);
}