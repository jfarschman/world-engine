import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { stripKankaMentions } from '@/lib/utils';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params;
  const id = parseInt(idStr);

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
        // --- ADDED FOCAL POINTS HERE ---
        focal_x: true,
        focal_y: true,
        // -------------------------------
        entry: true,
      },
    });

    if (!entity) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // 1. Resolve Mentions (turn [Link] into Link)
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