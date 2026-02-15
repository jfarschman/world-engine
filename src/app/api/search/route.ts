import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getCurrentWorld } from '@/lib/get-current-world'; 

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  
  // 1. GET WORLD CONTEXT & PERMISSIONS
  const world = await getCurrentWorld();
  
  // Who can see private content? (Everyone except GUEST)
  const canSeePrivate = ['ADMIN', 'DM', 'PLAYER'].includes(world.myRole);

  if (!query || query.length < 3) {
    return NextResponse.json([]);
  }

  // Sanitize input for TSQUERY (remove special chars, join with &)
  // This prevents syntax errors in the PostgreSQL full-text search
  const cleanQuery = query.replace(/[^\w\s]/gi, '').trim().split(/\s+/).join(' & ');

  if (!cleanQuery) return NextResponse.json([]);

  try {
    // 2. EXECUTE RAW SQL
    // We pass `world.id` and `canSeePrivate` safely into the query.
    
    const results = await prisma.$queryRaw`
      /* --- SEARCH ENTITIES --- */
      SELECT 
        id, 
        name, 
        type, 
        image_uuid, 
        image_ext,
        is_private,
        'Entity' as source,
        id as "parentId",
        ts_rank(to_tsvector('english', name || ' ' || coalesce("entry", '')), to_tsquery('english', ${cleanQuery})) as rank,
        1 as priority
      FROM "Entity"
      WHERE 
        to_tsvector('english', name || ' ' || coalesce("entry", '')) @@ to_tsquery('english', ${cleanQuery})
        AND "worldId" = ${world.id}
        AND (${canSeePrivate} = true OR "is_private" = false)
      
      UNION ALL
      
      /* --- SEARCH JOURNAL POSTS --- */
      SELECT 
        p.id, 
        p.name, 
        'Journal Entry' as type, 
        e.image_uuid, 
        e.image_ext,
        p.is_private,
        'Post' as source,
        p."entityId" as "parentId",
        ts_rank(to_tsvector('english', p.name || ' ' || coalesce(p."entry", '')), to_tsquery('english', ${cleanQuery})) as rank,
        2 as priority
      FROM "Post" p
      JOIN "Entity" e ON p."entityId" = e.id
      WHERE 
        to_tsvector('english', p.name || ' ' || coalesce(p."entry", '')) @@ to_tsquery('english', ${cleanQuery})
        AND e."worldId" = ${world.id}
        AND (${canSeePrivate} = true OR p."is_private" = false) -- Post must be public
        AND (${canSeePrivate} = true OR e."is_private" = false) -- Parent Entity must be public
      
      ORDER BY priority ASC, rank DESC
      LIMIT 10;
    `;

    return NextResponse.json(results);

  } catch (error) {
    console.error('Search failed:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}