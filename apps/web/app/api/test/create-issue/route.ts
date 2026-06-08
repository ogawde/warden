import { createTestIssue } from "@/lib/services/create-test-issue";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const result = await createTestIssue();

    return NextResponse.json({
      ok: true,
      webUrl: result.webUrl,
      gitlabIssueIid: result.gitlabIssueIid,
      issueCreationId: result.issueCreationId
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create GitLab issue";

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
