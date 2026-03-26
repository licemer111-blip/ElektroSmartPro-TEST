import { createBrowserClient } from "@supabase/ssr";
import { toast } from "sonner";
import { createRetryFetch } from "@/lib/fetch-with-retry";

const retryFetch = createRetryFetch(() => {
  toast.warning("Problemy z połączeniem. Próbuję odświeżyć dane...", {
    id: "supabase-connection-retry",
    duration: 5_000,
  });
});

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { fetch: retryFetch } }
  );
}
