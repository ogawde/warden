import { getGitLabAuthorizeUrl } from "@/lib/auth/gitlab-oauth";
import {
  createOAuthState,
  setOAuthStateCookie
} from "@/lib/auth/oauth-state";
import { NextResponse } from "next/server";

export async function GET() {
  const state = createOAuthState();
  await setOAuthStateCookie(state);

  return NextResponse.redirect(getGitLabAuthorizeUrl(state));
}
