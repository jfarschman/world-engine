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

// Helper to produce safe, readable filenames for individual Markdown exports
function sanitizeFilename(name: string, fallbackId: number): string {
  const cleaned = name
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "") // Strip filesystem-unsafe characters
    .replace(/\s+/g, "-")                  // Replace whitespace runs with single hyphens
    .replace(/-+/g, "-")                   // Collapse duplicate hyphens
    .replace(/^-|-$/g, "");                // Trim leading/trailing hyphens

  return cleaned || `journal-${fallbackId}`;
}

// Shared Prisma include shape for entities
const entityExportInclude = {
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
  relationshipsOut: { include: { target: true } },
  mentions: { include: { target: true } },
  posts: { orderBy: { createdAt: "asc" as const } },
};

// Formats a single entity (and its child posts) into Markdown
function formatEntityMarkdown(entity: any): string {
  let content = "";

  // --- HEADER ---
  content += `# ${entity.name}\n`;

  // --- METADATA BLOCK ---
  const metadata: string[] = [];

  if (entity.character) {
    if (entity.character.title) {
      metadata.push(`**Title:** ${entity.character.title}`);
    }
    if (entity.character.race?.entity?.name) {
      metadata.push(`**Race:** ${entity.character.race.entity.name}`);
    }

    const familyNames = entity.character.families
      .map((f: any) => f.family.entity.name)
      .join(", ");
    if (familyNames) {
      metadata.push(`**Family:** ${familyNames}`);
    }
  }

  // Relationships (e.g., "Sibling: Hoid")
  const rels = entity.relationshipsOut.map(
    (r: any) => `${r.type}: ${r.target.name}`
  );
  if (rels.length > 0) {
    metadata.push(`**Relationships:** ${rels.join(", ")}`);
  }

  // Mentions (Who is linked in the text?)
  const mentions = entity.mentions.map((m: any) => m.target.name);
  if (mentions.length > 0) {
    metadata.push(`**Mentions:** ${mentions.join(", ")}`);
  }

  if (metadata.length > 0) {
    content += metadata.join(" | ") + "\n";
  }

  content += `\n---\n\n`;

  // --- BODY ---
  content += `### Description\n`;
  content += `${toMarkdown(entity.entry)}\n\n`;

  // --- SUB-POSTS ---
  if (entity.posts && entity.posts.length > 0) {
    content += `### Updates & Notes\n`;
    for (const post of entity.posts) {
      content += `#### ${post.name}\n`;
      content += `${toMarkdown(post.entry)}\n\n`;
    }
  }

  return content;
}

export async function generateWorldExport(worldId: number) {
  const zip = new JSZip();

  // Categories that remain bundled into a single Markdown file each
  const categories = [
    { type: "Character", filename: "Characters.md" },
    { type: "Location", filename: "Locations.md" },
    { type: "Family", filename: "Families.md" },
    { type: "Organisation", filename: "Organisations.md" },
    { type: "Item", filename: "Items.md" },
    { type: "Note", filename: "Notes.md" },
    { type: "Race", filename: "Races.md" },
  ];

  for (const cat of categories) {
    const entities = await prisma.entity.findMany({
      where: {
        worldId: worldId,
        type: cat.type,
      },
      include: entityExportInclude,
      orderBy: { name: "asc" },
    });

    if (entities.length === 0) continue;

    const fileContent = entities
      .map(
        (entity) =>
          formatEntityMarkdown(entity) + `\n` + "=".repeat(40) + `\n\n`
      )
      .join("");

    zip.file(cat.filename, fileContent);
  }

  // Export each Journal entity as its own Markdown file inside Journals/
  const journals = await prisma.entity.findMany({
    where: {
      worldId: worldId,
      type: "Journal",
    },
    include: entityExportInclude,
    orderBy: { createdAt: "asc" },
  });

  const usedFilenames = new Set<string>();
  const padWidth = Math.max(2, String(journals.length).length);

  journals.forEach((journal, index) => {
    const prefix = String(index + 1).padStart(padWidth, "0");
    const slug = sanitizeFilename(journal.name, journal.id);
    let filename = `${prefix}-${slug}.md`;

    // Guard against duplicate journal names overwriting each other in the zip
    if (usedFilenames.has(filename)) {
      filename = `${prefix}-${slug}-${journal.id}.md`;
    }
    usedFilenames.add(filename);

    const journalContent = formatEntityMarkdown(journal);
    zip.file(`Journals/${filename}`, journalContent);
  });

  return zip.generateAsync({ type: "base64" });
}