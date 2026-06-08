"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type RunScanResponse =
  | { ok: true; scanId: string }
  | { ok: false; error: string };

export function RunScanButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/scans", { method: "POST" });
      const data = (await response.json()) as RunScanResponse;

      if (!response.ok || !data.ok) {
        setError(data.ok === false ? data.error : "Failed to run scan");
        return;
      }

      router.push(`/scans/${data.scanId}`);
      router.refresh();
    } catch {
      setError("Network error while starting scan");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className="inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "Starting scan…" : "Run Scan"}
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
