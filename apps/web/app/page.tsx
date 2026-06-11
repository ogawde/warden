import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function LandingPage() {
  return (
    <main className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-muted via-background to-background" />

      <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-5xl flex-col justify-center px-6 py-16 md:py-24">
        <Badge variant="secondary" className="w-fit">
          Rapid Agent Hackathon
        </Badge>

        <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-foreground md:text-5xl md:leading-tight">
          Autonomous engineering oversight for your repository
        </h1>

        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
          This project is a part of a live hackathon submission for the{" "}
          <a
            href="https://rapid-agent.devpost.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
          >
            Rapid Agent hackathon
          </a>
          .
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Button size="lg" render={<Link href="/repo" />}>
            Open Repository Dashboard
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            render={<Link href="/api/auth/gitlab/start" />}
          >
            Sign in with GitLab
          </Button>
        </div>

        <Separator className="my-10 max-w-xl" />

        <div className="flex items-center justify-start gap-6">
          <Image
            src="/logos/gitlab.png"
            alt="GitLab"
            width={80}
            height={80}
            className="h-16 w-16 object-contain md:h-20 md:w-20"
          />
          <span className="text-2xl font-light text-muted-foreground">+</span>
          <Image
            src="/logos/google-cloud.png"
            alt="Google Cloud"
            width={80}
            height={80}
            className="h-16 w-16 object-contain md:h-20 md:w-20"
          />
        </div>
      </div>
    </main>
  );
}
