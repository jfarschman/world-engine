import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest } from "next/server";

const handler = NextAuth(authOptions);

const dynamicHandler = async (req: NextRequest, ctx: any) => {
  const host = req.headers.get("host");
  const forwardedProto = req.headers.get("x-forwarded-proto");

  // 1. Trust Nginx First (Prod), then fall back to localhost check (Dev)
  let protocol = forwardedProto || (host?.includes("localhost") ? "http" : "https");

  // 2. Explicitly force HTTPS in production if missing
  if (process.env.NODE_ENV === "production") {
    protocol = "https";
  }

  if (host) {
    process.env.NEXTAUTH_URL = `${protocol}://${host}`;
  }

  return handler(req, ctx);
};

export { dynamicHandler as GET, dynamicHandler as POST };
