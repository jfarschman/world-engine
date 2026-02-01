import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

// This Regex captures 3 groups:
// 1. The Type
// 2. The ID
// 3. The Label (optional) - existing alias you wrote
// It also handles accidental double brackets like [[type:id...]]
const SAFE_TAG_REGEX = /\[{1,2}(\w+):(\d+)(?:\|([^\]]+))?\]{1,2}/g;

async function repairModel(modelName: 'entity' | 'post') {
  console.log(`\n🚑 Safety Repairing ${modelName}...`);
  
  // @ts-ignore
  const records = await prisma[modelName].findMany({
    select: { id: true, entry: true }
  });

  // We still need the name map for tags that have NO label
  const allEntityNames = await prisma.entity.findMany({
    select: { id: true, name: true }
  });
  const nameMap = new Map(allEntityNames.map(e => [e.id, e.name]));

  let updateCount = 0;

  for (const r of records) {
    if (!r.entry) continue;

    let isDirty = false;
    
    const newEntry = r.entry.replace(SAFE_TAG_REGEX, (match, type, idStr, existingLabel) => {
      const id = parseInt(idStr);
      
      // OPTION 1: You provided a label (e.g., "Kustos", "Dee")
      // We specificially preserve 'existingLabel'
      if (existingLabel) {
        const cleanTag = `[${type}:${id}|${existingLabel}]`;
        if (match !== cleanTag) isDirty = true; // Fixes [[...]] or garbage brackets
        return cleanTag;
      }

      // OPTION 2: No label provided, look it up in DB
      const dbName = nameMap.get(id);
      if (dbName) {
        const enrichedTag = `[${type}:${id}|${dbName}]`;
        if (match !== enrichedTag) isDirty = true;
        return enrichedTag;
      }

      // OPTION 3: No label AND not in DB (Broken Link)
      // Return normalized format so it at least parses correctly
      return `[${type}:${id}]`;
    });

    if (isDirty) {
      // @ts-ignore
      await prisma[modelName].update({
        where: { id: r.id },
        data: { entry: newEntry }
      });
      updateCount++;
    }
  }
  console.log(`✅ Repaired ${updateCount} records in ${modelName}.`);
}

async function main() {
  await repairModel('entity');
  await repairModel('post');
  console.log("\n✨ Tags normalized (Overrides Preserved).");
}

main().finally(() => prisma.$disconnect());