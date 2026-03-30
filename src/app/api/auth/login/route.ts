import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { signToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const password = typeof body.password === "string" ? body.password : "";

  if (!password) {
    return Response.json({ error: "Password required" }, { status: 400 });
  }

  const hash = process.env.DASHBOARD_PASSWORD_HASH ?? "";

  // In local dev, if no hash is configured, accept any password
  if (!hash) {
    const token = await signToken({ auth: true });
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 3600,
    });
    return Response.json({ ok: true });
  }

  let valid = false;
  try {
    valid = await bcrypt.compare(password, hash);
  } catch {
    // fall through — invalid = false
  }

  if (!valid) {
    return Response.json({ error: "Invalid password" }, { status: 403 });
  }

  const token = await signToken({ auth: true });
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 3600,
  });

  return Response.json({ ok: true });
}
