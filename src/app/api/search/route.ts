import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const pageParam = searchParams.get('page');
  const page = pageParam ? parseInt(pageParam) : 1;
  const limit = 25;
  const offset = (page - 1) * limit;

  if (!query || query.length < 3) {
    return NextResponse.json({ results: [], total: 0 });
  }

  // 1. CHECK LOGIN STATUS
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.has('lore_session');

  // Sanitize input
  // (Note: cleanQuery formats it for certain TS query types, but plainto_tsquery handles raw text well too. 
  // We'll stick to the logic you provided).
  const cleanQuery = query.replace(/[^\w\s]/gi, '').trim().split(/\s+/).join(' & ');

  if (!cleanQuery) return NextResponse.json({ results: [], total: 0 });

  try {
    // We select image fields now, and JOIN posts to their parent to get the image
    // PRIVACY LOGIC ADDED: "AND (${isLoggedIn} OR ... = false)"
    
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
      AND (${isLoggedIn} OR e."is_private" = false)
      
      ORDER BY priority ASC, rank DESC
      LIMIT ${limit} OFFSET ${offset};
    `;

    return NextResponse.json({ results, page });
  } catch (error) {
    console.error('Search failed:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}