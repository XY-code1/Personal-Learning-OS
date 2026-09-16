import { LandingPage } from "@/features/marketing/landing-page";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabasePublicEnv } from "@/lib/supabase/config";

export default async function Home() {
  let startHref = "/register";

  if (hasSupabasePublicEnv()) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) startHref = "/workspace/dashboard";
    } catch {
      // Keep the public landing page available when Supabase is not reachable.
    }
  }

  return <LandingPage startHref={startHref} />;
}
