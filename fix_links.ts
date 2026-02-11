import { PrismaClient } from '@prisma/client'; // Updated for standard node_modules

console.log("🚀 World-Aware Link Fixer Starting...");

const prisma = new PrismaClient();
const TAG_REGEX = /(?:\[\[|\[)\s*(\w+):(\d+)(?:\|([^\]]+))?(?:\]\]|\])/g;

async function enrichWorldLinks(worldId: number, worldName: string) {
  console.log(`\n🌍 Processing World: ${worldName} (ID: ${worldId})`);

  // 1. Fetch only Entities for THIS world
  const worldEntities = await prisma.entity.findMany({
    where: { worldId },
    select: { id: true, name: true }
  });
  const nameMap = new Map(worldEntities.map(e => [e.id, e.name]));

  // 2. Process Entities in this world
  const entities = await prisma.entity.findMany({
    where: { worldId },
    select: { id: true, entry: true, name: true }
  });

  let entityUpdateCount = 0;
  for (const r of entities) {
    if (!r.entry) continue;
    const { newEntry, isDirty } = processText(r.entry, nameMap);
    if (isDirty) {
      await prisma.entity.update({ where: { id: r.id }, data: { entry: newEntry } });
      entityUpdateCount++;
    }
  }

  // 3. Process Posts (Journals) in this world
  const posts = await prisma.post.findMany({
    where: { entity: { worldId } },
    select: { id: true, entry: true, name: true }
  });

  let postUpdateCount = 0;
  for (const p of posts) {
    if (!p.entry) continue;
    const { newEntry, isDirty } = processText(p.entry, nameMap);
    if (isDirty) {
      await prisma.post.update({ where: { id: p.id }, data: { entry: newEntry } });
      postUpdateCount++;
    }
  }

  console.log(`   ✅ Updated ${entityUpdateCount} Entities and ${postUpdateCount} Posts.`);
}

// Helper to handle the Regex logic
function processText(entry: string, nameMap: Map<number, string>) {
  let isDirty = false;
  const newEntry = entry.replace(TAG_REGEX, (match, type, idStr, existingLabel) => {
    const id = parseInt(idStr);
    
    if (existingLabel) {
      const normalized = `[${type}:${id}|${existingLabel}]`;
      if (match !== normalized) isDirty = true;
      return normalized;
    }

    const dbName = nameMap.get(id);
    if (dbName) {
      isDirty = true; 
      return `[${type}:${id}|${dbName}]`;
    }

    return `[${type}:${id}]`;
  });

  return { newEntry, isDirty };
}

async function main() {
  try {
    const worlds = await prisma.world.findMany();
    for (const world of worlds) {
      await enrichWorldLinks(world.id, world.name);
    }
    console.log("\n✨ All worlds synchronized and linked.");
  } catch (e) {
    console.error("\n❌ Script Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();