"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRightIcon,
  BotIcon,
  CheckCircle2Icon,
  GitBranchIcon,
  ScanSearchIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserCheckIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

type LandingPageProps = {
  user: {
    gitlabUsername: string | null;
    name: string | null;
    email: string;
  } | null;
};

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const }
};

const steps = [
  {
    icon: GitBranchIcon,
    title: "Connect GitLab",
    description: "Sign in and select the repository you want Warden to watch."
  },
  {
    icon: ScanSearchIcon,
    title: "Run a scan",
    description:
      "Static analysis, GitLab MCP context, and Gemini reasoning run in one pass."
  },
  {
    icon: SparklesIcon,
    title: "Review findings",
    description:
      "Prioritized issues with severity scores and file-level evidence — not vague AI prose."
  },
  {
    icon: UserCheckIcon,
    title: "Approve proposals",
    description:
      "You stay in control. Warden proposes fixes; nothing writes to GitLab without you."
  },
  {
    icon: CheckCircle2Icon,
    title: "Issue created",
    description:
      "Approve once and Warden creates a real GitLab issue via the REST API."
  }
];

const findingCategories = [
  {
    name: "Missing Tests",
    code: "MISSING_TESTS",
    description: "Surfaces files without corresponding test coverage."
  },
  {
    name: "Maintainability",
    code: "MAINTAINABILITY",
    description: "Flags oversized files and structural complexity risks."
  },
  {
    name: "Technical Debt",
    code: "TECHNICAL_DEBT",
    description: "Tracks TODOs, FIXMEs, and debt that never becomes tickets."
  },
  {
    name: "Risky Changes",
    code: "RISKY_CHANGE",
    description: "Detects direct commits and changes that bypass review."
  },
  {
    name: "CI / CD",
    code: "CI_CD",
    description: "Monitors pipeline health and broken automation patterns."
  }
];

const pillars = [
  {
    icon: ShieldCheckIcon,
    title: "Human-in-the-loop",
    description:
      "The agent observes and reasons. A separate executor creates issues only after you approve."
  },
  {
    icon: BotIcon,
    title: "Agent Builder + Gemini",
    description:
      "Google Cloud Agent Builder runs structured reasoning over your repository context."
  },
  {
    icon: GitBranchIcon,
    title: "GitLab MCP integration",
    description:
      "Merge requests, pipelines, and commits are gathered through the GitLab MCP server."
  }
];

export function LandingPage({ user }: LandingPageProps) {
  const ctaHref = user ? "/repos" : "/api/auth/gitlab/start";
  const ctaLabel = user ? "Open Repository Dashboard" : "Sign in with GitLab";

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative px-6 pb-20 pt-12 md:pb-28 md:pt-16">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-warden-mint/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-warden-sea/10 blur-3xl" />
        </div>

        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl font-bold tracking-[0.35em] text-foreground md:text-5xl"
          >
            WARDEN
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-2"
          >
            <Badge className="border-warden-mint/40 bg-warden-mint/25 text-foreground">
              Rapid Agent Hackathon
            </Badge>
            <Badge variant="outline" className="border-primary/30 text-primary">
              GitLab Track
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.22 }}
            className="mt-8 max-w-3xl text-4xl font-semibold tracking-tight text-foreground md:text-6xl md:leading-[1.1]"
          >
            Your AI engineering manager for GitLab
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.3 }}
            className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg"
          >
            Warden watches your repository, surfaces concrete risks with evidence,
            and proposes fixes — but never mutates your project without your
            approval. Built for the{" "}
            <a
              href="https://rapid-agent.devpost.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline underline-offset-4 hover:text-warden-dark"
            >
              Rapid Agent hackathon
            </a>
            .
          </motion.p>

          {user ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.38 }}
              className="mt-4 text-sm text-muted-foreground"
            >
              Signed in as{" "}
              <span className="font-medium text-foreground">
                {user.gitlabUsername ?? user.name ?? user.email}
              </span>
            </motion.p>
          ) : null}

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.42 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <Button size="lg" className="shadow-button" render={<Link href={ctaHref} />}>
              {ctaLabel}
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="mt-14 flex items-center justify-center gap-8"
          >
            <Image
              src="/logos/gitlab.png"
              alt="GitLab"
              width={64}
              height={64}
              className="h-14 w-14 object-contain opacity-90"
            />
            <span className="text-xl font-light text-primary/50">×</span>
            <Image
              src="/logos/google-cloud.png"
              alt="Google Cloud"
              width={64}
              height={64}
              className="h-14 w-14 object-contain opacity-90"
            />
          </motion.div>
        </div>
      </section>

      {/* Problem statement */}
      <section className="border-y border-border/60 bg-warden-dark px-6 py-16 text-warden-cream">
        <motion.div {...fadeUp} className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-warden-mint">
            The problem
          </p>
          <h2 className="mt-4 text-2xl font-semibold leading-snug md:text-3xl">
            Repos accumulate debt. Nobody files the issues.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-warden-cream/80">
            Missing tests, oversized files, TODOs that never become tickets, broken
            pipelines, commits that land on main without review — someone is supposed
            to notice. Warden does.
          </p>
        </motion.div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20 md:py-24">
        <motion.div {...fadeUp} className="mx-auto max-w-5xl text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">
            How it works
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Observe → Reason → Propose → Approve → Execute
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            A human-in-the-loop command bus where the agent watches and reasons,
            and only a deterministic executor creates GitLab issues after you click
            Approve.
          </p>
        </motion.div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
            >
              <Card className="h-full border-border/70 bg-card/90">
                <CardHeader className="items-center text-center">
                  <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-warden-mint/25">
                    <step.icon className="size-5 text-warden-sea" />
                  </div>
                  <CardTitle className="text-sm">{step.title}</CardTitle>
                  <CardDescription className="text-xs leading-relaxed">
                    {step.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Finding categories */}
      <section className="bg-warden-mint/10 px-6 py-20 md:py-24">
        <motion.div {...fadeUp} className="mx-auto max-w-5xl text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">
            What Warden detects
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Five focused finding categories
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Each finding includes severity, a priority score, and evidence
            references so results are auditable — not vague AI prose.
          </p>
        </motion.div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {findingCategories.map((category, index) => (
            <motion.div
              key={category.code}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.06 }}
              className={index === 4 ? "sm:col-span-2 lg:col-span-1" : undefined}
            >
              <Card className="h-full">
                <CardHeader>
                  <Badge
                    variant="outline"
                    className="w-fit border-primary/30 bg-primary/5 font-mono text-xs text-primary"
                  >
                    {category.code}
                  </Badge>
                  <CardTitle className="text-base">{category.name}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pillars */}
      <section className="px-6 py-20 md:py-24">
        <motion.div {...fadeUp} className="mx-auto max-w-5xl text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">
            Built different
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Trust by design
          </h2>
        </motion.div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-3">
          {pillars.map((pillar, index) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.1 }}
            >
              <Card className="h-full border-primary/20 bg-gradient-to-b from-card to-warden-mint/5">
                <CardHeader>
                  <div className="mb-2 flex size-11 items-center justify-center rounded-xl bg-warden-sea/15">
                    <pillar.icon className="size-5 text-warden-sea" />
                  </div>
                  <CardTitle className="text-lg">{pillar.title}</CardTitle>
                  <CardDescription className="leading-relaxed">
                    {pillar.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Architecture snapshot */}
      <section className="border-t border-border/60 bg-card/50 px-6 py-20">
        <motion.div {...fadeUp} className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-sm font-medium uppercase tracking-widest text-primary">
              Architecture
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              Built for real scans, not chat demos
            </h2>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              {
                title: "Web on Vercel",
                body: "OAuth login, repo selection, scan enqueue, and proposal approval UI."
              },
              {
                title: "Worker on Cloud Run",
                body: "Checkout, static analysis, GitLab MCP context, and Agent Builder reasoning."
              },
              {
                title: "Neon Postgres",
                body: "Users, repos, scans, findings, proposals, and a full activity audit trail."
              }
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-medium text-foreground">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {item.body}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-20 md:py-24">
        <motion.div
          {...fadeUp}
          className="mx-auto max-w-3xl rounded-2xl border border-primary/20 bg-gradient-to-br from-warden-sea to-warden-dark px-8 py-14 text-center text-warden-cream shadow-card-hover"
        >
          <p className="text-2xl font-bold tracking-[0.3em] text-warden-cream">
            WARDEN
          </p>
          <h2 className="mt-6 text-3xl font-semibold tracking-tight">
            Start watching your repository
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-warden-cream/80">
            Connect GitLab, run your first scan, and approve a proposal to create
            a real issue — in minutes.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button
              size="lg"
              className="bg-warden-cream text-warden-dark shadow-button hover:bg-warden-cream/90"
              render={<Link href={ctaHref} />}
            >
              {ctaLabel}
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          </div>
        </motion.div>
      </section>

      <footer className="border-t border-border/60 px-6 py-8 text-center text-sm text-muted-foreground">
        <p>
          Warden — autonomous engineering oversight for GitLab repositories.
        </p>
        <p className="mt-1">
          <a
            href="https://warden.curr.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-4 hover:text-warden-dark"
          >
            warden.curr.xyz
          </a>
        </p>
      </footer>
    </div>
  );
}
