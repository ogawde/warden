import { loadEnv as loadScanEnv } from "@warden/scan";

export function loadWorkerEnv(): void {
  loadScanEnv();
}
