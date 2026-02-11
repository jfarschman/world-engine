import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const idMap = new Map<number, number>(); 
const campaignWorldMap = new Map<number, number>(); // Cache for World IDs

// Helper to find World ID from Kanka Campaign ID
async function getWorldId(kankaId: number): Promise<number> {
  if (!kankaId) return 1; // Default to Little Shoppe if missing
  if (campaignWorldMap.has(kankaId)) return campaignWorldMap.get(kankaId)!;

  const world = await prisma.world.findUnique({
    where: { kanka_campaign_id: kankaId }
  });

  if (world) {
    campaignWorldMap.set(kankaId, world.id);
    return world.id;
  } else {
    console.warn(`⚠️  Warning: Unknown Campaign ID ${kankaId}. Defaulting to World 1.`);
    campaignWorldMap.set(kankaId, 1);
    return 1;
  }
}

async function processEntities(folderName: string, type: string, pass: number) {
  const dirPath = path.join('./kanka-backup', folderName);
  if (!fs.existsSync(dirPath)) return;

  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));
  console.log(`--- Pass ${pass} | ${type}: ${files.length} files ---`);

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(dirPath, file), 'utf8'));
    const { entity } = data;
    
    // --- DETERMINE WORLD ID ---
    // We look at the top-level campaign_id in the JSON
    const worldId = await getWorldId(data.campaign_id);

    idMap.set(data.id, entity.id);

    try {
      // --- PASS 1: CORE DATA, POSTS, IMAGE EXTENSIONS, & WORLD ID ---
      if (pass === 1) {
        let detectedExt = null;
        if (entity.image_uuid) {
          const galleryDir = path.resolve(process.cwd(), 'public', 'gallery');
          const imageJsonPath = path.join(galleryDir, `${entity.image_uuid}.json`);

          if (fs.existsSync(imageJsonPath)) {
            const imageJson = JSON.parse(fs.readFileSync(imageJsonPath, 'utf8'));
            detectedExt = imageJson.ext;
          }
        }

        await prisma.entity.upsert({
          where: { id: entity.id },
          update: { 
            name: entity.name, 
            entry: entity.entry, 
            image_ext: detectedExt,
            worldId: worldId // <--- UPDATE EXISTING TO CORRECT WORLD
          }, 
          create: {
            id: entity.id,
            name: entity.name,
            type: type, 
            entry: entity.entry,
            is_private: entity.is_private === 1 || data.is_private === 1,
            image_uuid: entity.image_uuid,
            image_ext: detectedExt,
            worldId: worldId // <--- SET WORLD ID ON CREATE
          }
        });

        // Universal Posts (Logs/Backstories)
        if (entity.posts && Array.isArray(entity.posts)) {
          for (const p of entity.posts) {
            await prisma.post.upsert({
              where: { id: p.id },
              update: { name: p.name, entry: p.entry, position: p.position },
              create: { 
                id: p.id, 
                name: p.name, 
                entry: p.entry, 
                position: p.position, 
                entityId: entity.id 
              }
            });
          }
        }

        // Specialized Tables
        if (type === 'Character') {
          await prisma.character.upsert({
            where: { entityId: entity.id },
            update: {},
            create: { entityId: entity.id, age: data.age, sex: data.sex, title: data.title, is_dead: data.is_dead === 1 }
          });
        } else if (type === 'Journal') {
          await prisma.journal.upsert({
            where: { entityId: entity.id },
            update: {},
            create: { entityId: entity.id, date: data.date ? new Date(data.date) : null }
          });
        } else if (type === 'Location') {
          await prisma.location.upsert({
            where: { entityId: entity.id },
            update: {},
            create: { entityId: entity.id, is_destroyed: data.is_destroyed === 1 }
          });
        } else if (type === 'Race') {
          await prisma.race.upsert({
            where: { entityId: entity.id },
            update: {},
            create: { entityId: entity.id, is_extinct: data.is_extinct === 1 }
          });
        } else if (type === 'Family') {
          await prisma.family.upsert({
            where: { entityId: entity.id },
            update: {},
            create: { entityId: entity.id, is_extinct: data.is_extinct === 1 }
          });
        } else if (type === 'Organisation') {
          await prisma.organisation.upsert({
            where: { entityId: entity.id },
            update: {},
            create: { entityId: entity.id, is_defunct: data.is_defunct === 1 }
          });
        } else if (type === 'Note') {
          await prisma.note.upsert({
            where: { entityId: entity.id },
            update: {},
            create: { 
                entityId: entity.id, 
                type: data.type || "General" 
            }
          });
        }
      } 
      
      // --- PASS 2: HIERARCHY ---
      else if (pass === 2) {
        if (entity.parentId) {
          await prisma.entity.update({
            where: { id: entity.id },
            data: { parentId: entity.parentId }
          }).catch(() => {});
        }
      }

      // --- PASS 3: RELATIONSHIPS ---
      else if (pass === 3) {
        if (type === 'Character' && data.character_races) {
          for (const r of data.character_races) {
            const raceEntityId = idMap.get(r.race_id);
            if (raceEntityId) {
              await prisma.character.update({ where: { entityId: entity.id }, data: { raceId: raceEntityId } }).catch(() => {});
            }
          }
        }
        if (type === 'Organisation' && data.members) {
          const orgEntityId = idMap.get(data.id);
          for (const m of data.members) {
            const charEntityId = idMap.get(m.character_id);
            if (charEntityId && orgEntityId) {
              await prisma.organisationMember.create({
                data: { characterId: charEntityId, organisationId: orgEntityId, role: m.role }
              }).catch(() => {});
            }
          }
        }
        if (type === 'Family' && data.pivotMembers) {
          const famEntityId = idMap.get(data.id);
          for (const pm of data.pivotMembers) {
            const charEntityId = idMap.get(pm.character_id);
            if (charEntityId && famEntityId) {
              await prisma.familyMember.create({
                data: { characterId: charEntityId, familyId: famEntityId }
              }).catch(() => {});
            }
          }
        }
      }
    } catch (e) {
      if (e instanceof Error) console.error(`Error on ${entity.name}: ${e.message}`);
    }
  }
}

async function main() {
  const folders = [
    { name: 'locations', type: 'Location' },
    { name: 'races', type: 'Race' },
    { name: 'families', type: 'Family' },
    { name: 'organisations', type: 'Organisation' },
    { name: 'journals', type: 'Journal' },
    { name: 'characters', type: 'Character' },
    { name: 'notes', type: 'Note' }
  ];

  for (let p of [1, 2, 3]) {
    console.log(`\n🚀 STARTING PASS ${p}...`);
    for (const folder of folders) await processEntities(folder.name, folder.type, p);
  }
}

main().finally(() => prisma.$disconnect());