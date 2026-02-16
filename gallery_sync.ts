// Run with: npx tsx gallery_sync.ts
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const GALLERY_DIR = path.join(process.cwd(), 'public', 'gallery');

async function main() {
  console.log("📂 Scanning Gallery Folder...");
  
  if (!fs.existsSync(GALLERY_DIR)) {
    console.error("❌ Gallery directory not found at:", GALLERY_DIR);
    return;
  }

  // 1. Map all physical files
  const files = fs.readdirSync(GALLERY_DIR);
  const fileMap = new Map<string, string>();

  files.forEach(file => {
    if (file.startsWith('.')) return;
    const lastDot = file.lastIndexOf('.');
    if (lastDot === -1) return;
    const uuid = file.substring(0, lastDot);
    const ext = file.substring(lastDot + 1);
    fileMap.set(uuid, ext);
  });

  console.log(`✅ Found ${fileMap.size} physical images.`);

  // 2. Get Entities for Worlds 2 & 3 ONLY
  console.log("🔍 Checking Database for broken links (Worlds 2 & 3 Only)...");
  
  const entities = await prisma.entity.findMany({
    where: {
      image_uuid: { not: null },
      worldId: { in: [2, 3] } // <--- SAFETY FILTER
    },
    select: {
      id: true,
      name: true,
      image_uuid: true,
      image_ext: true,
      worldId: true
    }
  });

  let fixed = 0;
  let missing = 0;

  for (const ent of entities) {
    const uuid = ent.image_uuid!;
    
    // Check if the file actually exists on disk
    if (fileMap.has(uuid)) {
      const physicalExt = fileMap.get(uuid);
      
      // If DB has wrong extension (or null), update it
      if (ent.image_ext !== physicalExt) {
        console.log(`🛠️ FIXING [W${ent.worldId}]: ${ent.name} (${uuid}) -> .${physicalExt}`);
        
        await prisma.entity.update({
          where: { id: ent.id },
          data: { image_ext: physicalExt }
        });
        fixed++;
      }
    } else {
      console.log(`⚠️ MISSING FILE [W${ent.worldId}]: ${ent.name} (UUID: ${uuid})`);
      missing++;
    }
  }

  console.log("\n=== SYNC REPORT ===");
  console.log(`Checked: ${entities.length} entities (Worlds 2 & 3)`);
  console.log(`Fixed:   ${fixed} extensions`);
  console.log(`Missing: ${missing} files (Images not in gallery folder)`);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
