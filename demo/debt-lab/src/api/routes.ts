// TODO: add input validation
// FIXME: handle timeout edge case
export function registerRoutes() {
  return ["health", "payments"];
}

// HACK: temporary bypass for demo
export function legacyHandler() {
  return true;
}
