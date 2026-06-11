import { getValidGitLabAccessToken } from "@warden/auth";
import {
  getDefaultGitLabPatAuth,
  type GitLabAuth
} from "@warden/gitlab-mcp";
import { getSessionUser } from "@/lib/auth/get-session-user";

export async function resolveActingUserGitLabAuth(): Promise<GitLabAuth> {
  const user = await getSessionUser();

  if (!user) {
    return getDefaultGitLabPatAuth();
  }

  const accessToken = await getValidGitLabAccessToken(user);

  return {
    type: "oauth",
    accessToken
  };
}
