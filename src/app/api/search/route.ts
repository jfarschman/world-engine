import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.length < 3) {
    return NextResponse.json([]);
  }

  // Sanitize input
  const cleanQuery = query.replace(/[^\w\s]/gi, '').trim().split(/\s+/).join(' & ');

  if (!cleanQuery) return NextResponse.json([]);

  try {
    const results = await prisma.$queryRaw`
      SELECT 
        id, 
        name, 
        type, 
        'Entity' as source,
        id as "parentId",
        ts_headline('english', "entry", plainto_tsquery('english', ${query})) as snippet,
        ts_rank(to_tsvector('english', name || ' ' || coalesce("entry", '')), plainto_tsquery('english', ${query})) as rank,
        1 as priority  -- <--- Entities get TOP Priority
      FROM "Entity"
      WHERE to_tsvector('english', name || ' ' || coalesce("entry", '')) @@ plainto_tsquery('english', ${query})
      
      UNION ALL
      
      SELECT 
        p.id, 
        p.name, 
        'Journal Entry' as type, 
        'Post' as source,
        p."entityId" as "parentId",
        ts_headline('english', p."entry", plainto_tsquery('english', ${query})) as snippet,
        ts_rank(to_tsvector('english', p.name || ' ' || coalesce(p."entry", '')), plainto_tsquery('english', ${query})) as rank,
        2 as priority -- <--- Posts get SECONDARY Priority
      FROM "Post" p
      WHERE to_tsvector('english', p.name || ' ' || coalesce(p."entry", '')) @@ plainto_tsquery('english', ${query})
      
      -- The Magic Sorting: Priority first, then Text Rank
      ORDER BY priority ASC, rank DESC
      LIMIT 20;
    `;

    return NextResponse.json(results);
  } catch (error) {
    console.error('Search failed:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}