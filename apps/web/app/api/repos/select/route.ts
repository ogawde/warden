import { getValidGitLabAccessToken } from "@warden/auth";
import { requireSession } from "@/lib/auth/get-session-user";
import { listAccessibleGitLabProjects } from "@/lib/gitlab/list-projects";
import { selectUserRepository } from "@/lib/services/select-user-repository";
import { NextResponse } from "next/server";

function parseGitLabProjectIdFromJson(body: unknown): number | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const gitlabProjectId = (body as { gitlabProjectId?: unknown }).gitlabProjectId;

  if (
    typeof gitlabProjectId !== "number" ||
    !Number.isInteger(gitlabProjectId) ||
    gitlabProjectId <= 0
  ) {
    return null;
  }

  return gitlabProjectId;
}

function parseGitLabProjectIdFromFormData(formData: FormData): number | null {
  const raw = formData.get("gitlabProjectId");

  if (typeof raw !== "string") {
    return null;
  }

  const gitlabProjectId = Number.parseInt(raw, 10);

  if (Number.isNaN(gitlabProjectId) || gitlabProjectId <= 0) {
    return null;
  }

  return gitlabProjectId;
}

function isJsonRequest(request: Request): boolean {
  const contentType = request.headers.get("content-type") ?? "";
  return contentType.includes("application/json");
}

async function parseGitLabProjectId(
  request: Request
): Promise<number | null> {
  if (isJsonRequest(request)) {
    try {
      return parseGitLabProjectIdFromJson(await request.json());
    } catch {
      return null;
    }
  }

  try {
    return parseGitLabProjectIdFromFormData(await request.formData());
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const wantsJson = isJsonRequest(request);
  let user;

  try {
    user = await requireSession();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  const gitlabProjectId = await parseGitLabProjectId(request);

  if (gitlabProjectId === null) {
    return NextResponse.json(
      { ok: false, error: "Invalid gitlabProjectId" },
      { status: 400 }
    );
  }

  try {
    const accessToken = await getValidGitLabAccessToken(user);
    const projects = await listAccessibleGitLabProjects(accessToken);
    const project = projects.find((entry) => entry.id === gitlabProjectId);

    if (!project) {
      return NextResponse.json(
        { ok: false, error: "Repository not found" },
        { status: 404 }
      );
    }

    const repository = await selectUserRepository(user.id, project);

    if (!wantsJson) {
      return NextResponse.redirect(new URL("/repo", request.url));
    }

    return NextResponse.json({
      ok: true,
      repositoryId: repository.id
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Repository selection failed" },
      { status: 500 }
    );
  }
}
