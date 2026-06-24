import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

// /api/automations/push is a machine-to-machine ingest endpoint authenticated by
// SCHEDULER_SECRET in its own handler (not the JWT cookie) — it must bypass the
// cookie-redirect middleware or every bot push 307s to /login and fails.
const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/logout", "/api/automations/push"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = request.cookies.get("mc_token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const secret = new TextEncoder().encode(jwtSecret);
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
