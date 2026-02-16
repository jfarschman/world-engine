import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  // 1. Connect NextAuth to your Prisma Database
  adapter: PrismaAdapter(prisma),
  
  // 2. Configure Google
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  // 3. Callback to handle session data
  callbacks: {
    async session({ session, user }) {
      // Attach the user's ID to the session so we can query memberships later
      if (session.user) {
        (session.user as any).id = user.id; 
      }
      return session;
    },
  },
};
