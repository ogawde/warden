export function isAuthorized(
  authorizationHeader: string | undefined,
  workerSecret: string | undefined
): boolean {
  if (!workerSecret) {
    return process.env.NODE_ENV !== "production";
  }

  if (!authorizationHeader?.startsWith("Bearer ")) {
    return false;
  }

  const token = authorizationHeader.slice("Bearer ".length).trim();
  return token === workerSecret;
}
