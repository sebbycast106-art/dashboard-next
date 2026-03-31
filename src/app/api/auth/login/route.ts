import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { signToken, COOKIE_NAME } from "@/lib/auth";
import { LoginSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "invalid_input" }, { status: 400 });
  const { password } = parsed.data;

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
