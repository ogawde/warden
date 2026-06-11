import {
  assertGitLabOAuthCredentialEnv,
  getValidGitLabAccessToken
} from "@warden/auth";
import type { User } from "@warden/db";
import type { GitLabOAuthAuth } from "@warden/gitlab-mcp";

type ScanWithTriggeringUser = {
  triggeredById: string | null;
  triggeredBy: User | null;
};

export async function resolveScanGitLabAuth(
  scan: ScanWithTriggeringUser
): Promise<GitLabOAuthAuth | undefined> {
  if (!scan.triggeredById) {
    return undefined;
  }

  if (!scan.triggeredBy) {
    throw new Error("Scan triggering user is missing");
  }

  assertGitLabOAuthCredentialEnv();

  const accessToken = await getValidGitLabAccessToken(scan.triggeredBy);

  return {
    type: "oauth",
    accessToken
  };
}
