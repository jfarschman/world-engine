// Run with: npx tsx audit_images.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Auditing World 2 (Drakkenheim) for missing images...\n");

  const entities = await prisma.entity.findMany({
    where: {
      worldId: 2,
    },
    select: {
      id: true,
      name: true,
      type: true,
      image_uuid: true,
      image_ext: true,
    },
    orderBy: { type: 'asc' }
  });

  const total = entities.length;
  const missingBoth = entities.filter(e => !e.image_uuid && !e.image_ext);
  const missingExt = entities.filter(e => e.image_uuid && !e.image_ext);
  const complete = entities.filter(e => e.image_uuid && e.image_ext);

  console.log("=== SUMMARY ===");
  console.log(`Total Entities:    ${total}`);
  console.log(`Fully Linked:      ${complete.length}`);
  console.log(`UUID but No Ext:   ${missingExt.length} (Fixable via sync)`);
  console.log(`No Image Data:     ${missingBoth.length} (Never imported)`);
  console.log("===============\n");

  if (missingExt.length > 0) {
    console.log("--- UUID EXISTS BUT EXTENSION MISSING ---");
    missingExt.forEach(e => {
      console.log(`[${e.type}] ${e.name.padEnd(30)} | UUID: ${e.image_uuid}`);
    });
  }

  if (missingBoth.length > 0) {
    console.log("\n--- COMPLETELY MISSING IMAGES (No UUID) ---");
    missingBoth.forEach(e => {
      console.log(`[${e.type}] ${e.name}`);
    });
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
