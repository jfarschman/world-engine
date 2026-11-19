import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const TARGET_WORLD_ID = 4;

async function main() {
  console.log(`🔒 Securing Labyrinth (World ${TARGET_WORLD_ID}) data...`);

  // 1. Update all Entities in World 4
  const entityUpdate = await prisma.entity.updateMany({
    where: { worldId: TARGET_WORLD_ID },
    data: { is_private: true }
  });
  console.log(`   ✅ Marked ${entityUpdate.count} entities as private.`);

  // 2. Update all Posts (Notes) attached to World 4 Entities
  // We use the relational query 'entity: { worldId: 4 }' to find the right posts
  const postUpdate = await prisma.post.updateMany({
    where: { 
      entity: { worldId: TARGET_WORLD_ID } 
    },
    data: { is_private: true }
  });
  console.log(`   ✅ Marked ${postUpdate.count} notes as private.`);

  console.log("\nDone! Everything in this world is now locked down.");
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
