// lib/export-service.ts
import { prisma } from "@/lib/prisma";
import JSZip from "jszip";
import TurndownService from "turndown";

const turndownService = new TurndownService({
  headingStyle: "atx",
  bulletListMarker: "*",
});

// Helper to clean up HTML to Markdown
function toMarkdown(html: string | null) {
  if (!html) return "";
  return turndownService.turndown(html);
}

export async function generateWorldExport(worldId: number) {
  const zip = new JSZip();

  // We map the DB 'type' string to a friendly filename and the prisma include key
  const categories = [
    { type: "Character", filename: "Characters.md", model: "character" },
    { type: "Location", filename: "Locations.md", model: "location" },
    { type: "Family", filename: "Families.md", model: "family" },
    { type: "Organisation", filename: "Organisations.md", model: "organisation" },
    { type: "Item", filename: "Items.md", model: "item" },
    { type: "Note", filename: "Notes.md", model: "note" },
    { type: "Race", filename: "Races.md", model: "race" },
    { type: "Journal", filename: "Journals.md", model: "journal" },
  ];

  // Iterate over categories and fetch data
  for (const cat of categories) {
    const entities = await prisma.entity.findMany({
      where: {
        worldId: worldId,
        type: cat.type,
      },
      include: {
        // We include specific tables to get metadata (like Character title/race)
        character: {
          include: {
            race: { include: { entity: true } },
            families: { include: { family: { include: { entity: true } } } },
          },
        },
        location: true,
        family: true,
        organisation: true,
        race: true,
        
        // Include relationships and mentions for context
        relationshipsOut: { include: { target: true } },
        mentions: { include: { target: true } },
        
        // Include child posts (updates/logs)
        posts: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { name: 'asc' },
    });

    if (entities.length === 0) continue;

    let fileContent = "";

    for (const entity of entities) {
      // --- HEADER ---
      fileContent += `# ${entity.name}\n`;
      
      // --- METADATA BLOCK ---
      const metadata: string[] = [];

      // Character Specifics
      if (entity.character) {
        if (entity.character.title) metadata.push(`**Title:** ${entity.character.title}`);
        if (entity.character.race?.entity?.name) metadata.push(`**Race:** ${entity.character.race.entity.name}`);
        
        const familyNames = entity.character.families
          .map((f) => f.family.entity.name)
          .join(", ");
        if (familyNames) metadata.push(`**Family:** ${familyNames}`);
      }

      // Relationships (e.g., "Sibling: Hoid")
      const rels = entity.relationshipsOut.map((r) => `${r.type}: ${r.target.name}`);
      if (rels.length > 0) metadata.push(`**Relationships:** ${rels.join(", ")}`);

      // Mentions (Who is linked in the text?)
      const mentions = entity.mentions.map((m) => m.target.name);
      if (mentions.length > 0) metadata.push(`**Mentions:** ${mentions.join(", ")}`);

      // Render Metadata
      if (metadata.length > 0) {
        fileContent += metadata.join(" | ") + "\n";
      }

      fileContent += `\n---\n\n`; // Separator

      // --- BODY ---
      fileContent += `### Description\n`;
      fileContent += `${toMarkdown(entity.entry)}\n\n`;

      // --- SUB-POSTS ---
      if (entity.posts && entity.posts.length > 0) {
        fileContent += `### Updates & Notes\n`;
        for (const post of entity.posts) {
          fileContent += `#### ${post.name}\n`;
          fileContent += `${toMarkdown(post.entry)}\n\n`;
        }
      }

      fileContent += `\n` + "=".repeat(40) + `\n\n`; // Big divider between entities
    }

    // Add to zip
    zip.file(cat.filename, fileContent);
  }

  return zip.generateAsync({ type: "base64" });
}