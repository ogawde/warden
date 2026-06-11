import Link from "next/link";
import { AlertCircleIcon, ArrowLeftIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-md items-center px-6 py-12">
      <Card className="w-full">
        <CardHeader>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 w-fit"
            render={<Link href="/" />}
          >
            <ArrowLeftIcon data-icon="inline-start" />
            Back
          </Button>
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <CardDescription>
            Connect your GitLab account to access repositories and scans.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error ? (
            <Alert variant="destructive">
              <AlertCircleIcon />
              <AlertTitle>Sign-in failed</AlertTitle>
              <AlertDescription>
                Authentication failed ({error}). Please try again.
              </AlertDescription>
            </Alert>
          ) : null}

          <Button className="w-full" size="lg" render={<Link href="/api/auth/gitlab/start" />}>
            Sign in with GitLab
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
