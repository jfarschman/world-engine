import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getCurrentWorld } from '@/lib/get-current-world';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  // Match the editor's threshold (2 chars)
  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const world = await getCurrentWorld();

    const results = await prisma.entity.findMany({
      where: {
        worldId: world.id, 
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
      take: 5,
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    const formatted = results.map(entity => ({
      id: entity.id,
      label: entity.name, 
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    // Return empty array instead of 500 to keep Editor alive
    return NextResponse.json([]); 
  }
}