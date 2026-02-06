import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { stripKankaMentions } from '@/lib/utils';
import { cookies } from 'next/headers'; // <--- IMPORT

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params;
  const id = parseInt(idStr);

  // LOGIN CHECK
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.has('lore_session');

  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const entity = await prisma.entity.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        type: true,
        image_uuid: true,
        image_ext: true,
        focal_x: true,
        focal_y: true,
        entry: true,
        is_private: true, // <--- SELECT THIS
      },
    });

    if (!entity) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // --- SECURITY CHECK ---
    if (entity.is_private && !isLoggedIn) {
       return NextResponse.json({ error: 'Private' }, { status: 403 });
    }
    // ----------------------

    // 1. Resolve Mentions
    let cleanText = stripKankaMentions(entity.entry || '');
    
    // 2. Strip HTML Tags
    cleanText = cleanText.replace(/<[^>]*>?/gm, '');
    
    // 3. Decode HTML Entities
    cleanText = cleanText
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"');

    // 4. Truncate
    const previewText = cleanText.length > 800 
      ? cleanText.slice(0, 800) + '...' 
      : cleanText || 'No description available.';

    return NextResponse.json({
      ...entity,
      entry: previewText 
    });

  } catch (error) {
    console.error('Preview fetch failed:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}