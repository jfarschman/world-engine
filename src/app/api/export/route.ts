// app/api/export/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentWorld } from "@/lib/get-current-world";
import { generateWorldExport } from "@/lib/export-service";

export async function GET(req: NextRequest) {
  // 1. Auth & Context Check
  const world = await getCurrentWorld();
  
  // Security check: Ensure they have a valid role
  if (world.myRole === 'GUEST') {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // 2. Determine which World ID to export
  const { searchParams } = new URL(req.url);
  let targetWorldId = world.id;

  // Allow ADMINs to override via ?worldId=X
  if (world.myRole === 'ADMIN' && searchParams.get('worldId')) {
    targetWorldId = parseInt(searchParams.get('worldId')!);
  }

  try {
    console.log(`Starting export for World ID: ${targetWorldId}...`);
    
    const base64Zip = await generateWorldExport(targetWorldId);
    const fileBuffer = Buffer.from(base64Zip, 'base64');

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${world.slug}-export.zip"`,
      },
    });
  } catch (error) {
    console.error("Export failed:", error);
    return new NextResponse("Export failed", { status: 500 });
  }
}