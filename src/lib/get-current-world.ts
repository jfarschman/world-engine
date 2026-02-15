import { headers } from 'next/headers';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from './prisma';

// Define a type for our "World with Permissions"
export type WorldWithPermissions = {
  id: number;
  name: string;
  slug: string;
  domain: string | null;
  // The crucial new bit:
  myRole: 'ADMIN' | 'DM' | 'PLAYER' | 'GUEST'; 
};

export async function getCurrentWorld(): Promise<WorldWithPermissions> {
  const headersList = await headers();
  const host = headersList.get('host') || ''; 
  const domain = host.split(':')[0]; 

  // 1. Get the authenticated user (if any)
  const session = await getServerSession(authOptions);
  
  // 2. Find the world (Same logic as before)
  let world = await prisma.world.findFirst({
    where: {
      OR: [
        { domain: domain },             
        { slug: domain.split('.')[0] }  
      ]
    }
  });

  // Fallback if no world found
  if (!world) {
    world = { id: 1, name: 'Little Shoppe of Curiosities', slug: 'lsoc', domain: null } as any; // Cast for simplified fallback
  }

  // 3. Determine Role
  let myRole: 'ADMIN' | 'DM' | 'PLAYER' | 'GUEST' = 'GUEST';

  if (session?.user?.id && world) {
    // Check the membership table
    const membership = await prisma.worldMembership.findUnique({
      where: {
        userId_worldId: {
          userId: session.user.id,
          worldId: world!.id
        }
      }
    });

    if (membership) {
      // Cast the string from DB to our specific types if needed
      myRole = membership.role as 'ADMIN' | 'DM' | 'PLAYER';
    }
  }

  return {
    ...world!,
    myRole
  };
}