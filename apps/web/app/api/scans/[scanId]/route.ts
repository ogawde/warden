import { requireSession } from "@/lib/auth/get-session-user";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ scanId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireSession();
    const { scanId } = await context.params;

    const scan = await prisma.scan.findFirst({
      where: {
        id: scanId,
        repository: {
          userId: user.id
        }
      },
      select: {
        status: true
      }
    });

    if (!scan) {
      return NextResponse.json(
        { ok: false, error: "Scan not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      status: scan.status
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Authentication required" },
      { status: 401 }
    );
  }
}
