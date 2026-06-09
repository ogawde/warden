import type http from "node:http";
import { prisma } from "@warden/db";

// TODO REMOVE AFTER DEBUGGING
export async function handleDebugDb(response: http.ServerResponse): Promise<void> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ ok: true }));
  } catch (error) {
    response.writeHead(500, { "Content-Type": "application/json" });
    response.end(
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : String(error)
      })
    );
  }
}
