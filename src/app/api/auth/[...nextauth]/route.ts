import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest } from "next/server";

const handler = NextAuth(authOptions);

const dynamicHandler = async (req: NextRequest, ctx: any) => {
  // 1. Get the Host from the header (e.g. "lsoc.hitechsavvy.com")
  const host = req.headers.get("host");
  
  // 2. Determine Protocol
  // If we are on localhost, use http. Otherwise, FORCE https.
  // This avoids the app thinking it's "http" just because Nginx talks to it over http.
  const protocol = host?.includes("localhost") ? "http" : "https";

  if (host) {
    // 3. Set the dynamic URL for this request
    process.env.NEXTAUTH_URL = `${protocol}://${host}`;
  }

  return handler(req, ctx);
};

export { dynamicHandler as GET, dynamicHandler as POST };