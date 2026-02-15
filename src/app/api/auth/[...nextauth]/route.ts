import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest } from "next/server";

// 1. Create the standard handler
const handler = NextAuth(authOptions);

// 2. Wrap it in a function that sets the URL dynamically
const dynamicHandler = async (req: NextRequest, ctx: any) => {
  // Trust the Host header (Nginx handles SSL termination, so we assume https in prod)
  const host = req.headers.get("host");
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";

  if (host) {
    // HACK: NextAuth v4 reads this env var to know its "canonical" URL.
    // By setting it per-request, we ensure the callback matches the user's domain.
    process.env.NEXTAUTH_URL = `${protocol}://${host}`;
  }

  return handler(req, ctx);
};

export { dynamicHandler as GET, dynamicHandler as POST };