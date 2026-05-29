import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type Tier = "standard" | "pro";

export function useTier() {
  const { user } = useAuth();
  const [tier, setTier] = useState<Tier>("standard");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) { setLoaded(true); return; }
    (async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("tier, status")
        .eq("user_id", user.id)
        .in("status", ["active", "trialing"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data?.tier === "pro") setTier("pro");
      setLoaded(true);
    })();
  }, [user]);

  return { tier, isPro: tier === "pro", loaded };
}
