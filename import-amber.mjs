import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

// --- CONFIGURATION ---
const TARGET_WORLD_ID = 4; // Labyrinth
const WIPE_TEST_DATA = false; // Set to true to delete previous test runs
const TEST_START_DATE = new Date('2026-08-16T00:00:00Z'); // The time-barrier for wiping

// --- HELPER: Get or Create Stub ---
// Finds an entity by name/type, or creates a blank stub if it doesn't exist
async function getOrCreateStub(name, type) {
  if (!name) return null;
  
  let entity = await prisma.entity.findFirst({
    where: { name: name, type: type, worldId: TARGET_WORLD_ID }
  });

  if (!entity) {
    console.log(`   [Stub] Creating missing ${type}: ${name}`);
    entity = await prisma.entity.create({
      data: { name, type, worldId: TARGET_WORLD_ID }
    });
    
    // Create the corresponding extension record
    if (type === 'Family') await prisma.family.create({ data: { entityId: entity.id } });
    if (type === 'Organisation') await prisma.organisation.create({ data: { entityId: entity.id } });
    if (type === 'Race') await prisma.race.create({ data: { entityId: entity.id } });
  }
  return entity.id;
}

async function main() {
  console.log("⚔️ Starting Amber Import...");

  // 1. WIPE PREVIOUS TEST DATA (If configured)
  if (WIPE_TEST_DATA) {
    console.log(`🧹 Wiping test data created after ${TEST_START_DATE.toISOString()}...`);
    const deleted = await prisma.entity.deleteMany({
      where: { 
        worldId: TARGET_WORLD_ID, 
        createdAt: { gte: TEST_START_DATE } 
      }
    });
    console.log(`   Deleted ${deleted.count} test entities.`);
  }

  // 2. READ JSON FILES
  const importDir = path.join(process.cwd(), 'imports', 'amber');
  const files = await fs.readdir(importDir);
  const jsonFiles = files.filter(f => f.endsWith('.json'));

  if (jsonFiles.length === 0) {
    console.log("❌ No JSON files found in imports/amber/");
    return;
  }

  // 3. PROCESS EACH FILE
  for (const file of jsonFiles) {
    console.log(`\n📄 Processing file: ${file}`);
    const filePath = path.join(importDir, file);
    const fileData = await fs.readFile(filePath, 'utf8');
    const items = JSON.parse(fileData);

    for (const item of items) {
      console.log(`-> Upserting ${item.type}: ${item.name}`);

      // Resolve Stubs for Relations
      const raceId = await getOrCreateStub(item.race, 'Race');
      const familyId = await getOrCreateStub(item.family, 'Family');
      const orgId = await getOrCreateStub(item.organisation, 'Organisation');

      // Upsert Base Entity
      let entity = await prisma.entity.findFirst({
        where: { name: item.name, type: item.type, worldId: TARGET_WORLD_ID }
      });

      if (!entity) {
        entity = await prisma.entity.create({
          data: {
            name: item.name,
            type: item.type,
            entry: item.description || '',
            worldId: TARGET_WORLD_ID,
            is_private: item.isPrivate || false,
            is_featured: item.isFeatured || false,
          }
        });
      } else {
        entity = await prisma.entity.update({
          where: { id: entity.id },
          data: { entry: item.description || '' } // Update description on existing stub
        });
      }

      // Upsert Specific Type Data
      if (item.type === 'Character') {
        const charData = {
          title: item.title || null,
          age: item.age?.toString() || null,
          role: item.role || 'NPC',
          is_dead: item.isDead || false,
          raceId: raceId || null,
        };

        await prisma.character.upsert({
          where: { entityId: entity.id },
          create: { entityId: entity.id, ...charData },
          update: charData,
        });

        // Handle Many-to-Many Relationships (Family & Org)
        if (familyId) {
          const existingLink = await prisma.familyMember.findFirst({
            where: { characterId: entity.id, familyId: familyId }
          });
          if (!existingLink) {
            await prisma.familyMember.create({
              data: { characterId: entity.id, familyId: familyId }
            });
          }
        }

        if (orgId) {
          const existingLink = await prisma.organisationMember.findFirst({
            where: { characterId: entity.id, organisationId: orgId }
          });
          if (!existingLink) {
            await prisma.organisationMember.create({
              data: { characterId: entity.id, organisationId: orgId }
            });
          }
        }
      }

      // Insert Notes/Posts
      if (item.notes && item.notes.length > 0) {
        for (const note of item.notes) {
          // Check if note already exists to avoid duplicates
          const existingPost = await prisma.post.findFirst({
            where: { entityId: entity.id, name: note.title }
          });

          if (!existingPost) {
            await prisma.post.create({
              data: {
                entityId: entity.id,
                name: note.title,
                entry: note.body,
                is_private: false,
                position: 0,
              }
            });
          }
        }
      }
    }
  }

  console.log("\n✅ Import Complete!");
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
