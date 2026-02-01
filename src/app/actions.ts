'use server';

import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

// --- CREATE ENTITY ---
export async function createEntity(formData: FormData) {
  const name = formData.get('name') as string;
  const type = formData.get('type') as string;
  const entry = formData.get('entry') as string;
  
  // Image handling
  const imageFilename = formData.get('image_filename') as string;
  let image_uuid = null;
  let image_ext = null;
  
  if (imageFilename && imageFilename.includes('.')) {
    const parts = imageFilename.split('.');
    image_ext = parts.pop();
    image_uuid = parts.join('.');
  }

  if (!name || !type) throw new Error('Name and Type are required');

  // ROBUST HELPER: Returns undefined if empty, or the number
  const getInt = (key: string) => {
    const val = formData.get(key);
    // If val is empty string or null, return undefined (so Prisma skips it)
    if (!val || val === '') return undefined;
    const parsed = parseInt(val as string);
    return isNaN(parsed) ? undefined : parsed;
  };

  // ROBUST HELPER: Returns undefined if empty string
  const getString = (key: string) => {
    const val = formData.get(key) as string;
    if (!val || val.trim() === '') return undefined;
    return val;
  };

  let data: any = {
    name,
    type,
    entry,
    image_uuid,
    image_ext,
  };

  switch (type) {
    case 'Character':
      data.character = {
        create: {
          title: getString('title'),
          age: getString('age'),
          sex: getString('sex'), // Now safe even if empty
          is_dead: formData.get('is_dead') === 'on',
          race_id: getInt('race_id'),       // Now safe
          location_id: getInt('location_id'), // Now safe
        }
      };
      break;
    case 'Location':
      data.location = {
        create: {
          parent_location_id: getInt('parent_location_id'),
          is_destroyed: formData.get('is_destroyed') === 'on',
        }
      };
      break;
    case 'Organisation':
      data.organisation = {
        create: {
          location_id: getInt('location_id'),
          is_defunct: formData.get('is_defunct') === 'on',
        }
      };
      break;
     case 'Note':
        data.note = {
          create: {
             type: formData.get('note_type') as string || 'General',
          }
        };
        break;
  }

  const newEntity = await prisma.entity.create({ data });

  revalidatePath('/');
  redirect(`/entity/${newEntity.id}`);
}

// --- DELETE ACTIONS ---
export async function deleteEntity(id: number) {
  const cookieStore = await cookies();
  if (!cookieStore.has('lore_session')) {
    throw new Error('Unauthorized');
  }

  try {
    // 1. Delete Posts first
    await prisma.post.deleteMany({ where: { entityId: id } });

    // 2. Delete the Entity
    await prisma.entity.delete({ where: { id } });
  
  } catch (error: any) {
    // IF the error is a redirect, let it pass through!
    if (error.message === 'NEXT_REDIRECT') {
      throw error;
    }

    console.error("Delete failed:", error);
    if (error.code === 'P2003') {
      return { error: "Cannot delete: This entity is linked to another record." };
    }
    return { error: "Database error occurred." };
  }

  // 3. REDIRECT MUST BE HERE (Outside the try/catch)
  redirect('/');
}

// --- POST & LOGIN ACTIONS (Keep these as they were) ---
export async function createPost(formData: FormData) {
  const entityId = parseInt(formData.get('entity_id') as string);
  const name = formData.get('name') as string;
  const entry = formData.get('entry') as string;
  const isPrivate = formData.get('is_private') === 'on';

  if (!name || isNaN(entityId)) throw new Error('Invalid Post Data');

  await prisma.post.create({
    data: { name, entry, isPrivate, entityId, position: 0 } // Fixed camelCase isPrivate
  });

  revalidatePath(`/entity/${entityId}`);
}

export async function deletePost(id: number) {
  const cookieStore = await cookies();
  if (!cookieStore.has('lore_session')) throw new Error('Unauthorized');

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return;

  await prisma.post.delete({ where: { id } });
  revalidatePath(`/entity/${post.entityId}`);
}

export async function login(formData: FormData) {
  const password = formData.get('password') as string;
  if (password === process.env.DM_PASSWORD) {
    const cookieStore = await cookies();
    cookieStore.set('lore_session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
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

  revalidatePath('/'); // Update Dashboard
  revalidatePath(`/entity/${id}`); // Update Button State
}