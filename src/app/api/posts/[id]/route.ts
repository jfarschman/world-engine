import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Unwrap the params (Next.js 15 requirement)
  const { id: idStr } = await params;
  const id = parseInt(idStr);

  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    // 2. Fetch the specific POST
    const post = await prisma.post.findUnique({
      where: { id: id },
      select: { 
        id: true, 
        name: true, 
        entry: true,
        // We can add is_private here later if needed
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // 3. Return the single object (NOT an array)
    return NextResponse.json(post);
  } catch (error) {
    console.error('Failed to fetch post:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}