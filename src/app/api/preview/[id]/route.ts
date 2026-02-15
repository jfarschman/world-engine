import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { stripKankaMentions } from '@/lib/utils';
import { getCurrentWorld } from '@/lib/get-current-world'; // [NEW] Import

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params;
  const id = parseInt(idStr);

  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  // 1. GET WORLD CONTEXT & PERMISSIONS
  const world = await getCurrentWorld();
  
  // Who can see private content? (Everyone except GUEST)
  const canSeePrivate = ['ADMIN', 'DM', 'PLAYER'].includes(world.myRole);

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
        is_private: true,
        worldId: true, // [NEW] Need this to check scope
        // --- FETCH STATUS FLAGS ---
        character: { select: { is_dead: true } },
        location: { select: { is_destroyed: true } },
        organisation: { select: { is_defunct: true } },
        family: { select: { is_extinct: true } },
        race: { select: { is_extinct: true } },
      },
    });

    if (!entity) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // [NEW] WORLD SCOPE CHECK
    // If the entity belongs to a different world, pretend it doesn't exist
    if (entity.worldId !== world.id) {
      return NextResponse.json({ error: 'Not found in this world' }, { status: 404 });
    }

    // [NEW] PRIVACY CHECK (Role-Based)
    if (entity.is_private && !canSeePrivate) {
       return NextResponse.json({ error: 'Private' }, { status: 403 });
    }

    // --- DETERMINE INACTIVE STATE ---
    let isInactive = false;
    if (entity.type === 'Character' && entity.character?.is_dead) isInactive = true;
    if (entity.type === 'Location' && entity.location?.is_destroyed) isInactive = true;
    if (entity.type === 'Organisation' && entity.organisation?.is_defunct) isInactive = true;
    if (entity.type === 'Family' && entity.family?.is_extinct) isInactive = true;
    if (entity.type === 'Race' && entity.race?.is_extinct) isInactive = true;

    // Clean text logic (Preserved exactly as is)
    let cleanText = stripKankaMentions(entity.entry || '');
    cleanText = cleanText.replace(/<[^>]*>?/gm, '');
    cleanText = cleanText
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"');

    const previewText = cleanText.length > 800 
      ? cleanText.slice(0, 800) + '...' 
      : cleanText || 'No description available.';

    return NextResponse.json({
      id: entity.id,
      name: entity.name,
      type: entity.type,
      image_uuid: entity.image_uuid,
      image_ext: entity.image_ext,
      focal_x: entity.focal_x,
      focal_y: entity.focal_y,
      entry: previewText,
      is_inactive: isInactive 
    });

  } catch (error) {
    console.error('Preview fetch failed:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}