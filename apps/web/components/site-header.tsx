import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheckIcon } from "lucide-react";
import { getSessionUser } from "@/lib/auth/get-session-user";
import { getWardenSession } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

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
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-6">
        <div className="flex min-w-0 items-center gap-5">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold tracking-tight transition-opacity hover:opacity-80"
          >
            <ShieldCheckIcon className="size-4 shrink-0 text-primary" />
            Warden
          </Link>

          {user ? (
            <nav className="hidden items-center gap-1 sm:flex">
              <Button variant="ghost" size="sm" render={<Link href="/repo" />}>
                Dashboard
              </Button>
              <Button variant="ghost" size="sm" render={<Link href="/repos" />}>
                Repositories
              </Button>
            </nav>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {user ? (
            <>
              {displayName ? (
                <>
                  <span className="hidden max-w-[12rem] truncate text-sm text-muted-foreground sm:inline">
                    {displayName}
                  </span>
                  <Separator orientation="vertical" className="hidden h-4 sm:block" />
                </>
              ) : null}
              <form action={logoutAction}>
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
