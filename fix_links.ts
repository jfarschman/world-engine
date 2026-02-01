import { PrismaClient } from './src/generated/prisma/index.js';

// 1. Immediate feedback to prove the script loaded
console.log("🚀 Link Fixer Starting...");

const prisma = new PrismaClient();

// REGEX: Captures [type:id] and [type:id|Label]
// Handles mixed brackets like [[type:id]] gracefully
const TAG_REGEX = /(?:\[\[|\[)\s*(\w+):(\d+)(?:\|([^\]]+))?(?:\]\]|\])/g;

async function enrichModel(modelName: 'entity' | 'post') {
  console.log(`\n🔍 Scanning ${modelName} table...`);
  
  // @ts-ignore - Dynamic model access
  const records = await prisma[modelName].findMany({
    select: { id: true, entry: true }
  });

  console.log(`   Found ${records.length} records. Fetching entity names...`);

  // Pre-fetch ALL names to specific map for O(1) lookup
  const allEntities = await prisma.entity.findMany({
    select: { id: true, name: true }
  });
  const nameMap = new Map(allEntities.map(e => [e.id, e.name]));

  let updateCount = 0;

  for (const r of records) {
    if (!r.entry) continue;

    let isDirty = false;
    
    // Replace tags with their "Enriched" version
    const newEntry = r.entry.replace(TAG_REGEX, (match: string, type: string, idStr: string, existingLabel: string | undefined) => {
      const id = parseInt(idStr);
      
      // Case A: Tag already has a label (e.g. [character:123|Calliope])
      // We keep it, just ensuring brackets are clean
      if (existingLabel) {
        const normalized = `[${type}:${id}|${existingLabel}]`;
        if (match !== normalized) isDirty = true;
        return normalized;
      }

      // Case B: Tag has NO label (e.g. [character:123])
      // We look up the name in our DB
      const dbName = nameMap.get(id);
      if (dbName) {
        // Found it! Add the name to the tag
        const enriched = `[${type}:${id}|${dbName}]`;
        isDirty = true; 
        return enriched;
      }

      // Case C: ID not found in DB (Broken Link)
      // Leave it as-is so we can spot it later
      return `[${type}:${id}]`;
    });

    if (isDirty) {
      // @ts-ignore
      await prisma[modelName].update({
        where: { id: r.id },
        data: { entry: newEntry }
      });
      updateCount++;
      // Show progress every 50 updates
      if (updateCount % 50 === 0) process.stdout.write('.');
    }
  }
  console.log(`\n✅ Fixed ${updateCount} links in ${modelName}.`);
}

async function main() {
  try {
    await enrichModel('entity');
    await enrichModel('post'); // Fixes the Journal Entries
    console.log("\n✨ Database links fully synchronized.");
  } catch (e) {
    console.error("\n❌ Script Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute
main();