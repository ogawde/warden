import {
  exchangeCodeForTokens,
  fetchGitLabUser
} from "@/lib/auth/gitlab-oauth";
import {
  clearOAuthStateCookie,
  oauthStatesMatch,
  readOAuthStateCookie
} from "@/lib/auth/oauth-state";
import { openWardenSession } from "@/lib/auth/session";
import { upsertOAuthUser } from "@/lib/auth/upsert-oauth-user";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

function loginErrorRedirect(request: Request, code: string): NextResponse {
  return NextResponse.redirect(new URL(`/login?error=${code}`, request.url));
}

function redirectToLanding(request: Request): NextResponse {
  return NextResponse.redirect(new URL("/", request.url));
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const session = await openWardenSession(cookieStore);

  const cookieState = await readOAuthStateCookie();
  await clearOAuthStateCookie();

  const { searchParams } = new URL(request.url);
  const gitlabError = searchParams.get("error");

  if (gitlabError) {
    const errorCode =
      gitlabError === "access_denied" ? "access_denied" : "oauth_error";
    return loginErrorRedirect(request, errorCode);
  }

  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    return loginErrorRedirect(request, "invalid_callback");
  }

  if (!cookieState || !oauthStatesMatch(state, cookieState)) {
    if (session.userId) {
      return redirectToLanding(request);
    }

    return loginErrorRedirect(request, "invalid_state");
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const profile = await fetchGitLabUser(tokens.accessToken);
    const user = await upsertOAuthUser(profile, tokens);

    session.userId = user.id;
    session.createdAt = new Date().toISOString();
    await session.save();

    return redirectToLanding(request);
  } catch (error) {
    if (session.userId) {
      return redirectToLanding(request);
    }

    console.error(
      "GitLab OAuth callback failed:",
      error instanceof Error ? error.message : "unknown error"
    );

    return loginErrorRedirect(request, "oauth_failed");
  }
}
