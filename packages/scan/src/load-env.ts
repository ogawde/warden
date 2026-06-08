import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";

let loaded = false;

export function loadEnv(): void {
  if (loaded) {
    return;
  }

  const candidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "../.env"),
    path.resolve(process.cwd(), "../../.env"),
    path.resolve(process.cwd(), "../../../.env")
  ];

  for (const envPath of candidates) {
    if (fs.existsSync(envPath)) {
      config({ path: envPath, override: true });
      loaded = true;
      return;
    }
  }
}
