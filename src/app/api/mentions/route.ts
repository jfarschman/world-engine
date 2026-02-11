import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getCurrentWorld } from '@/lib/get-current-world';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  // 1. Get World Context
  const world = await getCurrentWorld();

  try {
    const results = await prisma.entity.findMany({
      where: {
        worldId: world.id, // <--- WORLD FILTER
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
      take: 5,
      select: {
        id: true,
        name: true,
        type: true, // Useful if you want to show "Strahd (Character)" in the dropdown
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Format for Tiptap: needs 'id' and 'label' (or whatever your editor expects)
    const formatted = results.map(entity => ({
      id: entity.id,
      label: entity.name, 
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch mentions' }, { status: 500 });
  }
}