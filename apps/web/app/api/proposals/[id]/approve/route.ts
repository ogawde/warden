import { approveProposedAction } from "@/lib/services/approve-proposed-action";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const result = await approveProposedAction(id);

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to approve proposal";

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
