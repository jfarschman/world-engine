import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  
  // Define the path to the physical file in public/gallery
  const filePath = path.join(process.cwd(), 'public', 'gallery', filename);

  try {
    // 1. Try to read the file from disk (bypassing Next.js static cache)
    const fileBuffer = await fs.readFile(filePath);
    
    // 2. Determine content type based on extension
    const ext = path.extname(filename).toLowerCase().replace('.', '');
    const mimeTypes: Record<string, string> = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml'
    };
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    // 3. Return the image data
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });

  } catch (error) {
    return new NextResponse('Image not found', { status: 404 });
  }
}
