"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ApiResponse =
  | { ok: true; webUrl?: string }
  | { ok: false; error: string };

type ApproveProposalButtonProps = {
  proposalId: string;
  disabled?: boolean;
};

export function ApproveProposalButton({
  proposalId,
  disabled = false
}: ApproveProposalButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issueUrl, setIssueUrl] = useState<string | null>(null);

  async function handleClick() {
    setIsLoading(true);
    setError(null);
    setIssueUrl(null);

    try {
      const approveResponse = await fetch(
        `/api/proposals/${proposalId}/approve`,
        { method: "POST" }
      );
      const approveData = (await approveResponse.json()) as ApiResponse;

      if (!approveResponse.ok || !approveData.ok) {
        setError(
          approveData.ok === false
            ? approveData.error
            : "Failed to approve proposal"
        );
        return;
      }

      const executeResponse = await fetch(
        `/api/proposals/${proposalId}/execute`,
        { method: "POST" }
      );
      const executeData = (await executeResponse.json()) as ApiResponse & {
        webUrl?: string;
      };

      if (!executeResponse.ok || !executeData.ok) {
        setError(
          executeData.ok === false
            ? executeData.error
            : "Failed to create GitLab issue"
        );
        return;
      }

      if (executeData.webUrl) {
        setIssueUrl(executeData.webUrl);
      }

      router.refresh();
    } catch {
      setError("Network error during approval");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isLoading}
        className="inline-flex rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "Creating issue…" : "Approve & Create Issue"}
      </button>
      {issueUrl ? (
        <p className="text-sm text-green-700">
          Issue created.{" "}
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
