import { getSessionUser } from "@/lib/auth/get-session-user";
import { LandingPage } from "@/components/landing-page";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getSessionUser();

  return <LandingPage user={user} />;
}
