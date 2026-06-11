import { getSessionUser } from "@/lib/auth/get-session-user";
import { getWardenSession } from "@/lib/auth/session";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

async function logoutAction() {
  "use server";

  const session = await getWardenSession();
  session.destroy();
  redirect("/");
}

export default async function LandingPage() {
  const user = await getSessionUser();

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
        Warden
      </p>

      <div className="mt-3 flex items-center gap-3">
        {user ? (
          <>
            <span className="text-sm text-slate-600">
              Signed in as {user.gitlabUsername ?? user.name ?? user.email}
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Log out
              </button>
            </form>
          </>
        ) : (
          <Link
            href="/api/auth/gitlab/start"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Sign in with GitLab
          </Link>
        )}
      </div>

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
