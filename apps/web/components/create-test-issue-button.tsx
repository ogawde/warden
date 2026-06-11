"use client";

import { useState } from "react";
import { CheckCircle2Icon, ExternalLinkIcon, Loader2Icon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

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
      <Button type="button" onClick={handleClick} disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2Icon className="animate-spin" />
            Creating issue…
          </>
        ) : (
          "Create Test Issue"
        )}
      </Button>

      {issueUrl ? (
        <Alert>
          <CheckCircle2Icon />
          <AlertDescription>
            Issue created successfully.{" "}
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
