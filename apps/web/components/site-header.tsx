import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { getSessionUser } from "@/lib/auth/get-session-user";
import { getWardenSession } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";

async function logoutAction() {
  "use server";

  const session = await getWardenSession();
  session.destroy();
  redirect("/");
}

export async function SiteHeader() {
  const user = await getSessionUser();
  const displayName =
    user?.gitlabUsername ?? user?.name ?? user?.email ?? null;

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 shadow-[0_1px_0_rgb(66_132_117/0.08)] backdrop-blur-md supports-[backdrop-filter]:bg-background/85">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-6">
        <div className="flex min-w-0 items-center gap-6">
          <Link href="/" className="flex shrink-0 items-center hover:opacity-80">
            <BrandLogo size="sm" />
          </Link>

          {user ? (
            <Link
              href="/repos"
              className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex sm:items-center sm:leading-none"
            >
              Repositories
            </Link>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {user ? (
            <>
              {displayName ? (
                <span className="hidden max-w-[12rem] truncate text-sm leading-none text-muted-foreground sm:inline">
                  {displayName}
                </span>
              ) : null}
              <form action={logoutAction} className="flex items-center">
                <Button type="submit" variant="outline" size="sm">
                  Log out
                </Button>
              </form>
            </>
          ) : (
            <Button size="sm" render={<Link href="/api/auth/gitlab/start" />}>
              Sign in with GitLab
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
