"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2Icon } from "lucide-react";
import { useScanLoading } from "@/components/scan-loading-provider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RunScanResponse =
  | { ok: true; scanId: string }
  | { ok: false; error: string };

export function RunScanButton() {
  const router = useRouter();
  const { startScanLoading, stopScanLoading } = useScanLoading();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setIsLoading(true);
    setError(null);
    startScanLoading();

    try {
      const response = await fetch("/api/scans", { method: "POST" });
      const data = (await response.json()) as RunScanResponse;

      if (!response.ok || !data.ok) {
        stopScanLoading();
        setError(data.ok === false ? data.error : "Failed to run scan");
        setIsLoading(false);
        return;
      }

      router.push(`/scans/${data.scanId}`);
    } catch {
      stopScanLoading();
      setError("Network error while starting scan");
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 py-10">
      <Button
        type="button"
        size="lg"
        onClick={handleClick}
        disabled={isLoading}
        className={cn(
          "h-12 min-w-[200px] px-10 text-base shadow-button",
          "hover:shadow-[0_8px_28px_-4px_rgb(66_132_117/0.55)]"
        )}
      >
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
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
