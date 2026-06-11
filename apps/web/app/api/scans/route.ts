import { requireSession } from "@/lib/auth/get-session-user";
import { runScan } from "@/lib/services/run-scan";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    await requireSession();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const result = await runScan();

    return NextResponse.json({
      ok: true,
      scanId: result.scanId
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to run scan";

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
