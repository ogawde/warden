import { requireSession } from "@/lib/auth/get-session-user";
import { approveProposedAction } from "@/lib/services/approve-proposed-action";
import { ResourceNotFoundError } from "@/lib/services/resource-not-found-error";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const { id } = await context.params;
    const result = await approveProposedAction(id);

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    const message =
      error instanceof Error ? error.message : "Failed to approve proposal";

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
