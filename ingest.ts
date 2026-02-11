import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const idMap = new Map<number, number>(); 
const campaignWorldMap = new Map<number, number>(); 

async function getWorldId(kankaId: number): Promise<number> {
  if (!kankaId) return 1;
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
    const worldId = await getWorldId(data.campaign_id);

    // Track original ID mapping for relationships
    idMap.set(data.id, entity.id);

    try {
      if (pass === 1) {
        let imageUuid = entity.image_uuid;
        let detectedExt = null;

        // --- IMPROVED IMAGE HANDLING ---
        // If UUID is missing but path exists (Legacy RHoD style)
        if (!imageUuid && entity.image_path) {
          const pathParts = entity.image_path.split('/');
          const filenameWithExt = pathParts[pathParts.length - 1];
          const filenameParts = filenameWithExt.split('.');
          
          imageUuid = filenameParts[0]; // Extract ID from filename
          detectedExt = filenameParts[1]; // Extract extension from filename
        } 

        // If we have a UUID but still need an extension (Newer Kanka style)
        if (imageUuid && !detectedExt) {
          const galleryDir = path.resolve(process.cwd(), 'public', 'gallery');
          const imageJsonPath = path.join(galleryDir, `${imageUuid}.json`);

          if (fs.existsSync(imageJsonPath)) {
            const imageJson = JSON.parse(fs.readFileSync(imageJsonPath, 'utf8'));
            detectedExt = imageJson.ext;
          }
        }

        // --- DECOUPLED UPSERT ---
        // We look for the ID. If it exists but belongs to a DIFFERENT world, 
        // the original PK logic would overwrite it. 
        // Note: This still uses entity.id as PK, but ensures worldId is synced.
        await prisma.entity.upsert({
          where: { id: entity.id },
          update: { 
            name: entity.name, 
            entry: entity.entry, 
            image_uuid: imageUuid,
            image_ext: detectedExt,
            worldId: worldId 
          }, 
          create: {
            id: entity.id,
            name: entity.name,
            type: type, 
            entry: entity.entry,
            is_private: entity.is_private === 1 || data.is_private === 1,
            image_uuid: imageUuid,
            image_ext: detectedExt,
            worldId: worldId 
          }
        });

        // Universal Posts
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
            update: { age: data.age?.toString(), sex: data.sex, title: data.title, is_dead: data.is_dead === 1 },
            create: { entityId: entity.id, age: data.age?.toString(), sex: data.sex, title: data.title, is_dead: data.is_dead === 1 }
          });
        } else if (type === 'Journal') {
          await prisma.journal.upsert({
            where: { entityId: entity.id },
            update: { date: data.date ? new Date(data.date) : null },
            create: { entityId: entity.id, date: data.date ? new Date(data.date) : null }
          });
        } else if (type === 'Location') {
          await prisma.location.upsert({
            where: { entityId: entity.id },
            update: { is_destroyed: data.is_destroyed === 1 },
            create: { entityId: entity.id, is_destroyed: data.is_destroyed === 1 }
          });
        } else if (type === 'Race') {
          await prisma.race.upsert({
            where: { entityId: entity.id },
            update: { is_extinct: data.is_extinct === 1 },
            create: { entityId: entity.id, is_extinct: data.is_extinct === 1 }
          });
        } else if (type === 'Family') {
          await prisma.family.upsert({
            where: { entityId: entity.id },
            update: { is_extinct: data.is_extinct === 1 },
            create: { entityId: entity.id, is_extinct: data.is_extinct === 1 }
          });
        } else if (type === 'Organisation') {
          await prisma.organisation.upsert({
            where: { entityId: entity.id },
            update: { is_defunct: data.is_defunct === 1 },
            create: { entityId: entity.id, is_defunct: data.is_defunct === 1 }
          });
        } else if (type === 'Note') {
          await prisma.note.upsert({
            where: { entityId: entity.id },
            update: { type: data.type || "General" },
            create: { entityId: entity.id, type: data.type || "General" }
          });
        }
      } 
      
      else if (pass === 2) {
        if (entity.parentId) {
          await prisma.entity.update({
            where: { id: entity.id },
            data: { parentId: entity.parentId }
          }).catch(() => {});
        }
      }

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