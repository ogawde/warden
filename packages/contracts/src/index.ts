export const APP_NAME = "Warden";

export const FINDING_CATEGORIES = [
  "MISSING_TESTS",
  "MAINTAINABILITY",
  "TECHNICAL_DEBT",
  "RISKY_CHANGE",
  "CI_CD"
] as const;

export type FindingCategory = (typeof FINDING_CATEGORIES)[number];

export type ScanStatus =
  | "QUEUED"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type ProposedActionStatus =
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "EXECUTING"
  | "EXECUTED"
  | "FAILED";
