'use server';

import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

// --- CREATE ENTITY ---
export async function createEntity(formData: FormData) {
  'use server'; // Ensure this is marked as a server action

  const name = formData.get('name') as string;
  const type = formData.get('type') as string;
  const entry = formData.get('entry') as string;
  const image_filename = formData.get('image_filename') as string;
  
  // Parse IDs safely (handle empty strings)
  const parseId = (key: string) => {
    const val = formData.get(key);
    return val ? parseInt(val as string) : undefined;
  };

  // 1. Prepare base Entity data
  // We map 'location_id' from the form to 'parentId' on the Entity
  const parentId = parseId('location_id') || parseId('parent_location_id');

  const entityData: any = {
    name,
    type,
    entry, // This now contains your HTML from the editor
    parentId, // <-- This places the entity inside the location
    image_uuid: image_filename ? image_filename.split('.')[0] : null,
    image_ext: image_filename ? image_filename.split('.')[1] : null,
  };

  // 2. Prepare Sub-Table data based on Type
  if (type === 'Character') {
    entityData.character = {
      create: {
        title: formData.get('title') as string,
        age: formData.get('age') as string,
        // Map form 'race_id' -> schema 'raceId'
        raceId: parseId('race_id'), 
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
        // Organisations might not have a "location" in your schema 
        // other than being nested in one via parentId above.
      },
    };
  }

  if (type === 'Family') {
    entityData.family = {
      create: {
        is_extinct: formData.get('is_extinct') === 'on',
      },
    };
  }

  if (type === 'Race') {
    entityData.race = {
      create: {
        is_extinct: formData.get('is_extinct') === 'on',
      },
    };
  }

  if (type === 'Note') {
    entityData.note = {
      create: {
        type: formData.get('note_type') as string,
      },
    };
  }

  // 3. Database Call
  const newEntity = await prisma.entity.create({
    data: entityData,
  });

  // 4. Redirect to the new page
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
    data: { name, entry, entityId, position: 0 }
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

export async function updateEntity(formData: FormData) {
  const id = parseInt(formData.get('id') as string);
  const name = formData.get('name') as string;
  const type = formData.get('type') as string;
  const entry = formData.get('entry') as string;
  
  // Basic validation
  if (!id || !name) {
    throw new Error('Missing required fields');
  }

  await prisma.entity.update({
    where: { id },
    data: {
      name,
      type,
      entry,
    },
  });

  revalidatePath(`/entity/${id}`);
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