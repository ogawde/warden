import { randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const WARDEN_OAUTH_STATE_COOKIE_NAME = "warden_oauth_state";
export const WARDEN_OAUTH_STATE_TTL_SECONDS = 60 * 10;
export const WARDEN_OAUTH_STATE_COOKIE_PATH = "/api/auth/gitlab";

export function createOAuthState(): string {
  return randomBytes(32).toString("base64url");
}

function isSecureCookieEnvironment(): boolean {
  return process.env.NODE_ENV === "production";
}

function getOAuthStateCookieOptions() {
  return {
    httpOnly: true,
    secure: isSecureCookieEnvironment(),
    sameSite: "lax" as const,
    path: WARDEN_OAUTH_STATE_COOKIE_PATH,
    maxAge: WARDEN_OAUTH_STATE_TTL_SECONDS
  };
}

export async function setOAuthStateCookie(state: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(
    WARDEN_OAUTH_STATE_COOKIE_NAME,
    state,
    getOAuthStateCookieOptions()
  );
}

export async function readOAuthStateCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(WARDEN_OAUTH_STATE_COOKIE_NAME)?.value ?? null;
}

export async function clearOAuthStateCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(WARDEN_OAUTH_STATE_COOKIE_NAME, "", {
    ...getOAuthStateCookieOptions(),
    maxAge: 0
  });
}

export function oauthStatesMatch(
  queryState: string,
  cookieState: string
): boolean {
  const queryBuffer = Buffer.from(queryState);
  const cookieBuffer = Buffer.from(cookieState);

  if (queryBuffer.length !== cookieBuffer.length) {
    return false;
  }

  return timingSafeEqual(queryBuffer, cookieBuffer);
}
