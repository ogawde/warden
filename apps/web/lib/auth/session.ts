import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { loadRootEnv } from "@/lib/load-root-env";

/** Sealed session cookie name (httpOnly). */
export const WARDEN_SESSION_COOKIE_NAME = "warden_session";

/** Default session lifetime: 14 days (iron-session default). */
export const WARDEN_SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;

/**
 * Payload stored in the encrypted session cookie.
 * Both fields are set on login (Commit 8).
 */
export type WardenSessionData = {
  userId?: string;
  createdAt?: string;
};

function getSessionPassword(): string {
  loadRootEnv();

  const password = process.env.SESSION_SECRET?.trim();
  if (!password) {
    throw new Error("SESSION_SECRET is not set");
  }

  if (password.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters long");
  }

  return password;
}

function isSecureCookieEnvironment(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * iron-session options for Warden.
 * - production: Secure cookies (HTTPS only)
 * - local dev: Secure false so http://localhost works
 */
export function getSessionOptions(): SessionOptions {
  return {
    password: getSessionPassword(),
    cookieName: WARDEN_SESSION_COOKIE_NAME,
    ttl: WARDEN_SESSION_TTL_SECONDS,
    cookieOptions: {
      httpOnly: true,
      secure: isSecureCookieEnvironment(),
      sameSite: "lax",
      path: "/"
    }
  };
}

/** Open the sealed session from Next.js App Router cookies. */
export async function getWardenSession() {
  const cookieStore = await cookies();
  return getIronSession<WardenSessionData>(cookieStore, getSessionOptions());
}
