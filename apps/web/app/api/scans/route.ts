import { runScan } from "@/lib/services/run-scan";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const result = await runScan();

    return NextResponse.json({
      ok: true,
      scanId: result.scanId,
      status: result.status
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to run scan";

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
