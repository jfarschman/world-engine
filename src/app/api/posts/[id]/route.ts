import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getCurrentWorld } from '@/lib/get-current-world';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params;
  const id = parseInt(idStr);

  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  const world = await getCurrentWorld();
  const canSeePrivate = ['ADMIN', 'DM', 'PLAYER'].includes(world.myRole);

  try {
    const post = await prisma.post.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        entry: true,
        is_private: true,
        entity: {
          select: {
            worldId: true,
            is_private: true,
          },
        },
      },
    });

    if (!post || post.entity.worldId !== world.id) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (!canSeePrivate && (post.is_private || post.entity.is_private)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({
      id: post.id,
      name: post.name,
      entry: post.entry,
    });
  } catch (error) {
    console.error('Failed to fetch post:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}