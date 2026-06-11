export async function register() {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  const required = ["DATABASE_URL", "WORKER_SECRET"] as const;

  for (const name of required) {
    if (!process.env[name]?.trim()) {
      throw new Error(`${name} is required in production`);
    }
  }
}
