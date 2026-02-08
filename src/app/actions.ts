'use server';

import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

// --- HELPER: Save Image to Disk ---
async function saveImage(formData: FormData): Promise<{ uuid: string | null; ext: string | null }> {
  const imageFile = formData.get('image_file') as File;

  if (!imageFile || imageFile.size === 0 || imageFile.name === 'undefined') {
    return { uuid: null, ext: null };
  }

  try {
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const uuid = randomUUID();
    const ext = imageFile.name.split('.').pop() || 'jpg';
    
    const uploadDir = path.join(process.cwd(), 'public', 'gallery');
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, `${uuid}.${ext}`);
    await writeFile(filePath, buffer);

    return { uuid, ext };
  } catch (error) {
    console.error("Image upload failed:", error);
    return { uuid: null, ext: null };
  }
}

// --- CREATE ENTITY ---
export async function createEntity(formData: FormData) {
  'use server';

  const name = formData.get('name') as string;
  const type = formData.get('type') as string;
  const entry = formData.get('entry') as string;
  const is_private = formData.get('is_private') === 'on';
  
  const focal_x = parseInt(formData.get('focal_x') as string) || 50;
  const focal_y = parseInt(formData.get('focal_y') as string) || 50;
  
  const parseId = (key: string) => {
    const val = formData.get(key);
    return val ? parseInt(val as string) : undefined;
  };

  const parentId = parseId('location_id') || parseId('parent_location_id');
  const { uuid: image_uuid, ext: image_ext } = await saveImage(formData);

  const entityData: any = {
    name,
    type,
    entry,
    parentId, 
    focal_x,
    focal_y,
    is_private,
    ...(image_uuid && { image_uuid, image_ext }),
  };

  if (type === 'Character') {
    const raceId = parseId('race_id');
    const familyId = parseId('family_id');
    const orgId = parseId('organisation_id');

    entityData.character = {
      create: {
        title: formData.get('title') as string,
        age: formData.get('age') as string,
        role: formData.get('role') as string || 'NPC', // <--- NEW FIELD
        is_dead: formData.get('is_dead') === 'on',
        race: raceId ? { connect: { entityId: raceId } } : undefined,
        families: familyId ? { create: { family: { connect: { entityId: familyId } } } } : undefined,
        organisations: orgId ? { create: { organisation: { connect: { entityId: orgId } } } } : undefined,
      },
    };
  }

  if (type === 'Location') {
    entityData.location = {
      create: {
        is_destroyed: formData.get('is_destroyed') === 'on',
      },
    };
  }

  if (type === 'Organisation') {
    entityData.organisation = {
      create: {
        is_defunct: formData.get('is_defunct') === 'on',
      },
    };
  }

  if (type === 'Family') {
    entityData.family = { create: { is_extinct: formData.get('is_extinct') === 'on' } };
  }

  if (type === 'Race') {
    entityData.race = { create: { is_extinct: formData.get('is_extinct') === 'on' } };
  }

  if (type === 'Note') {
    entityData.note = { create: { type: formData.get('note_type') as string } };
  }

  const newEntity = await prisma.entity.create({
    data: entityData,
  });

  revalidatePath('/');
  redirect(`/entity/${newEntity.id}`);
}

// --- UPDATE ENTITY ---
export async function updateEntity(formData: FormData) {
  const id = parseInt(formData.get('id') as string);
  const name = formData.get('name') as string;
  const type = formData.get('type') as string;
  const entry = formData.get('entry') as string;

  const focal_x = parseInt(formData.get('focal_x') as string);
  const focal_y = parseInt(formData.get('focal_y') as string);
  const is_featured = formData.get('is_featured') === 'on';
  const is_private = formData.get('is_private') === 'on';

  if (!id || !name) throw new Error('Missing required fields');

  const { uuid: new_uuid, ext: new_ext } = await saveImage(formData);

  const updateData: any = {
    name,
    type,
    entry,
    is_featured,
    is_private,
  };

  if (!isNaN(focal_x)) updateData.focal_x = focal_x;
  if (!isNaN(focal_y)) updateData.focal_y = focal_y;

  if (new_uuid) {
    updateData.image_uuid = new_uuid;
    updateData.image_ext = new_ext;
  }

  const parseId = (key: string) => {
    const val = formData.get(key);
    return val ? parseInt(val as string) : null; 
  };

  if (type === 'Character') {
    const raceId = parseId('race_id');
    const familyId = parseId('family_id');
    const orgId = parseId('organisation_id');

    updateData.character = {
      upsert: {
        create: {
          title: formData.get('title') as string,
          age: formData.get('age') as string,
          role: formData.get('role') as string || 'NPC', // <--- NEW FIELD
          is_dead: formData.get('is_dead') === 'on',
          race: raceId ? { connect: { entityId: raceId } } : undefined,
          families: familyId ? { create: { family: { connect: { entityId: familyId } } } } : undefined,
          organisations: orgId ? { create: { organisation: { connect: { entityId: orgId } } } } : undefined,
        },
        update: {
          title: formData.get('title') as string,
          age: formData.get('age') as string,
          role: formData.get('role') as string || 'NPC', // <--- NEW FIELD
          is_dead: formData.get('is_dead') === 'on',
          race: raceId ? { connect: { entityId: raceId } } : { disconnect: true },
          families: familyId 
             ? { deleteMany: {}, create: { family: { connect: { entityId: familyId } } } } 
             : { deleteMany: {} },
          organisations: orgId 
             ? { deleteMany: {}, create: { organisation: { connect: { entityId: orgId } } } } 
             : { deleteMany: {} }
        }
      }
    };
  }

  if (type === 'Location') {
    const parentId = parseId('parent_location_id');
    updateData.location = {
      upsert: {
        create: { is_destroyed: formData.get('is_destroyed') === 'on' },
        update: { is_destroyed: formData.get('is_destroyed') === 'on' }
      }
    };
    if (parentId) updateData.parentId = parentId;
  }

  if (type === 'Organisation') {
    updateData.organisation = {
      upsert: {
        create: { is_defunct: formData.get('is_defunct') === 'on' },
        update: { is_defunct: formData.get('is_defunct') === 'on' }
      }
    };
  }

  if (type === 'Family') {
    updateData.family = {
      upsert: {
        create: { is_extinct: formData.get('is_extinct') === 'on' },
        update: { is_extinct: formData.get('is_extinct') === 'on' }
      }
    };
  }

  if (type === 'Race') {
    updateData.race = {
      upsert: {
        create: { is_extinct: formData.get('is_extinct') === 'on' },
        update: { is_extinct: formData.get('is_extinct') === 'on' }
      }
    };
  }

  await prisma.entity.update({
    where: { id },
    data: updateData,
  });

  revalidatePath('/'); 
  revalidatePath(`/entity/${id}`);
}

export async function deleteEntity(id: number) {
  const cookieStore = await cookies();
  if (!cookieStore.has('lore_session')) throw new Error('Unauthorized');
  try {
    await prisma.post.deleteMany({ where: { entityId: id } });
    await prisma.entity.delete({ where: { id } });
  } catch (error: any) {
    if (error.message === 'NEXT_REDIRECT') throw error;
    console.error(error);
  }
  revalidatePath('/');
  redirect('/');
}

// --- POST ACTIONS ---

export async function createPost(formData: FormData) {
  const entityId = parseInt(formData.get('entity_id') as string);
  const name = formData.get('name') as string;
  const entry = formData.get('entry') as string;
  const is_private = formData.get('is_private') === 'on';

  await prisma.post.create({ 
    data: { name, entry, entityId, position: 0, is_private } 
  });
  
  revalidatePath('/');
  revalidatePath(`/entity/${entityId}`);
}

export async function updatePost(formData: FormData) {
  const cookieStore = await cookies();
  if (!cookieStore.has('lore_session')) throw new Error('Unauthorized');

  const id = parseInt(formData.get('id') as string);
  const name = formData.get('name') as string;
  const entry = formData.get('entry') as string;
  const entityId = parseInt(formData.get('entity_id') as string);
  const is_private = formData.get('is_private') === 'on';

  await prisma.post.update({
    where: { id },
    data: { name, entry, is_private },
  });

  revalidatePath('/');
  revalidatePath(`/entity/${entityId}`);
}

export async function deletePost(id: number) {
  const cookieStore = await cookies();
  if (!cookieStore.has('lore_session')) throw new Error('Unauthorized');
  
  const post = await prisma.post.findUnique({ where: { id } });
  
  await prisma.post.delete({ where: { id } });
  
  revalidatePath('/');
  if (post) revalidatePath(`/entity/${post.entityId}`);
}

export async function login(formData: FormData) {
  const password = formData.get('password') as string;
  if (password === process.env.DM_PASSWORD) {
    const cookieStore = await cookies();
    cookieStore.set('lore_session', 'authenticated', {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 60*60*24*30, path: '/'
    });
    return { success: true };
  } else {
    return { error: 'Incorrect password.' };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('lore_session');
  redirect('/');
}

export async function toggleFeatured(id: number) {
  const cookieStore = await cookies();
  if (!cookieStore.has('lore_session')) throw new Error('Unauthorized');
  const entity = await prisma.entity.findUnique({ where: { id } });
  if (!entity) return;
  await prisma.entity.update({
    where: { id },
    data: { is_featured: !entity.is_featured }
  });
  revalidatePath('/'); 
  revalidatePath(`/entity/${id}`);
}