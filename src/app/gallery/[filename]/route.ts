// src/app/gallery/[filename]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

const GALLERY_DIR = path.resolve(process.cwd(), 'public', 'gallery');

const MIME_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  // Strip directory components and resolve against GALLERY_DIR
  const safeName = path.basename(filename);
  const resolvedPath = path.resolve(GALLERY_DIR, safeName);

  if (safeName !== filename || !resolvedPath.startsWith(GALLERY_DIR + path.sep)) {
    return new NextResponse('Invalid filename', { status: 400 });
  }

  const ext = path.extname(safeName).toLowerCase().replace('.', '');
  const contentType = MIME_TYPES[ext];
  if (!contentType) {
    return new NextResponse('Unsupported file type', { status: 400 });
  }

  try {
    const fileBuffer = await fs.readFile(resolvedPath);
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new NextResponse('Image not found', { status: 404 });
  }
}