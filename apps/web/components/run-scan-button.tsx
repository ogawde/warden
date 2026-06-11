"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2Icon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

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
    <div className="space-y-3">
      <Button type="button" onClick={handleClick} disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2Icon className="animate-spin" />
            Starting scan…
          </>
        ) : (
          "Run Scan"
        )}
      </Button>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
