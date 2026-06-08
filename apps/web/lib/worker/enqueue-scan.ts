import { loadRootEnv } from "@/lib/load-root-env";

export type EnqueueScanResult = {
  accepted: boolean;
};

export async function enqueueScanJob(
  scanId: string,
  repositoryId: string
): Promise<EnqueueScanResult> {
  loadRootEnv();

  const workerUrl = (process.env.WORKER_URL ?? "http://localhost:8080").replace(
    /\/$/,
    ""
  );
  const workerSecret = process.env.WORKER_SECRET;

  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  if (workerSecret) {
    headers.Authorization = `Bearer ${workerSecret}`;
  }

  const response = await fetch(`${workerUrl}/run-scan`, {
    method: "POST",
    headers,
    body: JSON.stringify({ scanId, repositoryId })
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(
      body?.error ?? `Worker returned ${response.status} ${response.statusText}`
    );
  }

  return { accepted: true };
}
