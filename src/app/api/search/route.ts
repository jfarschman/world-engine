import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCurrentWorld } from '@/lib/get-current-world'; // <--- IMPORT

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const pageParam = searchParams.get('page');
  const page = pageParam ? parseInt(pageParam) : 1;
  const limit = 25;
  const offset = (page - 1) * limit;

  // 1. GET CURRENT WORLD
  const world = await getCurrentWorld(); // <--- GET WORLD ID

  if (!query || query.length < 3) {
    return NextResponse.json({ results: [], total: 0 });
  }

  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.has('lore_session');

  // Sanitize input
  const cleanQuery = query.replace(/[^\w\s]/gi, '').trim().split(/\s+/).join(' & ');

  if (!cleanQuery) return NextResponse.json({ results: [], total: 0 });

  try {
    // 2. INJECT WORLD ID INTO SQL
    // Added: AND "worldId" = ${world.id}
    
    const results = await prisma.$queryRaw`
      SELECT 
        id, 
        name, 
        type, 
        image_uuid, 
        image_ext,
        'Entity' as source,
        id as "parentId",
        ts_rank(to_tsvector('english', name || ' ' || coalesce("entry", '')), plainto_tsquery('english', ${query})) as rank,
        1 as priority
      FROM "Entity"
      WHERE to_tsvector('english', name || ' ' || coalesce("entry", '')) @@ plainto_tsquery('english', ${query})
      AND "worldId" = ${world.id}  -- <--- WORLD FILTER
      AND (${isLoggedIn} OR "is_private" = false)
      
      UNION ALL
      
      SELECT 
        p.id, 
        p.name, 
        'Journal Entry' as type, 
        e.image_uuid,
        e.image_ext,
        'Post' as source,
        p."entityId" as "parentId",
        ts_rank(to_tsvector('english', p.name || ' ' || coalesce(p."entry", '')), plainto_tsquery('english', ${query})) as rank,
        2 as priority
      FROM "Post" p
      JOIN "Entity" e ON p."entityId" = e.id
      WHERE to_tsvector('english', p.name || ' ' || coalesce(p."entry", '')) @@ plainto_tsquery('english', ${query})
      AND e."worldId" = ${world.id} -- <--- WORLD FILTER (JOINED)
      AND (${isLoggedIn} OR e."is_private" = false)
      
      ORDER BY priority ASC, rank DESC
      LIMIT ${limit} OFFSET ${offset};
    `;

    // Simple count query for pagination (optional, but good practice to filter count too)
    // For now, returning results is the priority.

    return NextResponse.json({ results, page });
  } catch (error) {
    console.error('Search failed:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}