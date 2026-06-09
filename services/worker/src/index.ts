import http from "node:http";
import { executeScanJob } from "@warden/scan";
import { isAuthorized } from "./auth";
import { handleDebugDb } from "./debug-db";
import { loadWorkerEnv } from "./load-env";

loadWorkerEnv();

const port = Number.parseInt(process.env.PORT ?? "8080", 10);
const workerSecret = process.env.WORKER_SECRET;

type RunScanBody = {
  scanId?: string;
  repositoryId?: string;
};

function readJsonBody(request: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

function sendJson(
  response: http.ServerResponse,
  statusCode: number,
  body: Record<string, unknown>
) {
  response.writeHead(statusCode, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
}

async function handleRunScan(
  request: http.IncomingMessage,
  response: http.ServerResponse
) {
  if (!isAuthorized(request.headers.authorization, workerSecret)) {
    sendJson(response, 401, { ok: false, error: "Unauthorized" });
    return;
  }

  let body: RunScanBody;

  try {
    body = (await readJsonBody(request)) as RunScanBody;
  } catch {
    sendJson(response, 400, { ok: false, error: "Invalid JSON body" });
    return;
  }

  if (!body.scanId || !body.repositoryId) {
    sendJson(response, 400, {
      ok: false,
      error: "scanId and repositoryId are required"
    });
    return;
  }

  const { scanId, repositoryId } = body;

  // TODO REMOVE AFTER DEBUGGING — await scan so response includes result
  try {
    const result = await executeScanJob({ scanId, repositoryId });
    sendJson(response, 200, { ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scan job failed";
    console.error(`[worker] scan ${scanId} failed:`, message);
    sendJson(response, 500, { ok: false, error: message });
  }
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host}`);

  if (request.method === "GET" && url.pathname === "/health") {
    sendJson(response, 200, { ok: true, service: "warden-worker" });
    return;
  }

  // TODO REMOVE AFTER DEBUGGING
  if (request.method === "GET" && url.pathname === "/debug-db") {
    await handleDebugDb(response);
    return;
  }

  if (request.method === "POST" && url.pathname === "/run-scan") {
    await handleRunScan(request, response);
    return;
  }

  sendJson(response, 404, { ok: false, error: "Not found" });
});

server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `[worker] port ${port} is already in use. Stop the other process (e.g. lsof -i :${port}) or set PORT.`
    );
    process.exit(1);
  }
  throw error;
});

function shutdown(signal: string) {
  console.log(`[worker] ${signal} received, shutting down`);
  server.close(() => process.exit(0));
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

server.listen(port, () => {
  console.log(`[worker] listening on http://localhost:${port}`);
});
