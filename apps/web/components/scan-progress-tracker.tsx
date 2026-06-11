"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useScanLoading } from "@/components/scan-loading-provider";

type ScanStatusResponse =
  | { ok: true; status: string }
  | { ok: false; error: string };

type ScanProgressTrackerProps = {
  scanId: string;
  initialStatus: string;
};

const IN_PROGRESS_STATUSES = new Set(["QUEUED", "RUNNING"]);
const TERMINAL_STATUSES = new Set(["COMPLETED", "FAILED"]);
const POLL_INTERVAL_MS = 2000;

function isInProgress(status: string) {
  return IN_PROGRESS_STATUSES.has(status);
}

function isTerminal(status: string) {
  return TERMINAL_STATUSES.has(status);
}

export function ScanProgressTracker({
  scanId,
  initialStatus
}: ScanProgressTrackerProps) {
  const router = useRouter();
  const { startScanLoading, stopScanLoading } = useScanLoading();
  const isPollingRef = useRef(false);

  useEffect(() => {
    if (!isInProgress(initialStatus)) {
      stopScanLoading();
      return;
    }

    startScanLoading();

    if (isPollingRef.current) {
      return;
    }

    isPollingRef.current = true;
    let isCancelled = false;

    async function pollScanStatus() {
      while (!isCancelled) {
        try {
          const response = await fetch(`/api/scans/${scanId}`);
          const data = (await response.json()) as ScanStatusResponse;

          if (!response.ok || !data.ok) {
            break;
          }

          if (isTerminal(data.status)) {
            stopScanLoading();
            router.refresh();
            break;
          }
        } catch {
          break;
        }

        await new Promise((resolve) => {
          setTimeout(resolve, POLL_INTERVAL_MS);
        });
      }

      isPollingRef.current = false;
    }

    void pollScanStatus();

    return () => {
      isCancelled = true;
      isPollingRef.current = false;
    };
  }, [scanId, initialStatus, router, startScanLoading, stopScanLoading]);

  return null;
}
