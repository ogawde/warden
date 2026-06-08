"use client";

import { useState } from "react";

type CreateIssueResponse =
  | { ok: true; webUrl: string; gitlabIssueIid: number }
  | { ok: false; error: string };

export function CreateTestIssueButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issueUrl, setIssueUrl] = useState<string | null>(null);

  async function handleClick() {
    setIsLoading(true);
    setError(null);
    setIssueUrl(null);

    try {
      const response = await fetch("/api/test/create-issue", {
        method: "POST"
      });
      const data = (await response.json()) as CreateIssueResponse;

      if (!response.ok || !data.ok) {
        setError(
          data.ok === false ? data.error : "Failed to create GitLab issue"
        );
        return;
      }

      setIssueUrl(data.webUrl);
    } catch {
      setError("Network error while creating issue");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className="inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "Creating issue…" : "Create Test Issue"}
      </button>

      {issueUrl ? (
        <p className="text-sm text-green-700">
          Issue created successfully.{" "}
          <a
            href={issueUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline"
          >
            Open in GitLab
          </a>
        </p>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
