import Image from "next/image";
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
        Warden
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
        Autonomous engineering oversight for your repository
      </h1>
      <p className="mt-5 max-w-2xl text-base text-slate-600 md:text-lg">
        This project is a part of a live hackathon submission for the{" "}
        <a
          href="https://rapid-agent.devpost.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-blue-400 underline underline-offset-2 transition hover:text-slate-700"
        >
          Rapid Agent hackathon
        </a>
        .
      </p>
      <div className="mt-6 flex items-center justify-center gap-6">
        <Image
          src="/logos/gitlab.png"
          alt="GitLab"
          width={80}
          height={80}
          className="h-40 w-40"
        />
        <span className="text-2xl font-medium text-slate-400">+</span>
        <Image
          src="/logos/google-cloud.png"
          alt="Google Cloud"
          width={80}
          height={80}
          className="h-40 w-40"
        />
      </div>
      <div className="mt-8">
        <Link
          href="/repo"
          className="inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          Open Repository Dashboard
        </Link>
      </div>
    </main>
  );
}
