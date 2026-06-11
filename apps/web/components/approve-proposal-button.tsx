"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CheckCircle2Icon,
  ExternalLinkIcon,
  Loader2Icon
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

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
    <div className="space-y-3">
      <Button
        type="button"
        size="sm"
        onClick={handleClick}
        disabled={disabled || isLoading}
      >
        {isLoading ? (
          <>
            <Loader2Icon className="animate-spin" />
            Creating issue…
          </>
        ) : (
          "Approve & Create Issue"
        )}
      </Button>

      {issueUrl ? (
        <Alert>
          <CheckCircle2Icon />
          <AlertDescription>
            Issue created.{" "}
            <a
              href={issueUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium underline underline-offset-4"
            >
              Open in GitLab
              <ExternalLinkIcon className="size-3" />
            </a>
          </AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
