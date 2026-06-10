import Link from "next/link";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-2xl font-semibold">Sign in</h1>

      {error ? (
        <p className="mt-4 text-sm text-red-700">
          Sign-in failed ({error}). Please try again.
        </p>
      ) : (
        <p className="mt-4 text-sm text-slate-600">
          Sign in with GitLab to continue.
        </p>
      )}

      <Link
        href="/api/auth/gitlab/start"
        className="mt-6 inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
      >
        Sign in with GitLab
      </Link>
    </main>
  );
}
