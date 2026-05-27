import { createServerFn } from "@tanstack/react-start";
import { getRequestIP, getRequestHeader } from "@tanstack/react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const LIMIT = 5;
const WINDOW_MS = 60_000;

export const checkLoginRateLimit = createServerFn({ method: "POST" }).handler(
  async () => {
    const ip =
      getRequestHeader("cf-connecting-ip") ||
      getRequestHeader("x-real-ip") ||
      getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ||
      getRequestIP({ xForwardedFor: true }) ||
      "unknown";
    console.log("[rate-limit] checking ip:", ip);

    const since = new Date(Date.now() - WINDOW_MS).toISOString();

    const { count, error: countErr } = await supabaseAdmin
      .from("login_attempts")
      .select("*", { count: "exact", head: true })
      .eq("ip", ip)
      .gte("attempted_at", since);

    if (countErr) {
      console.error("rate limit count error", countErr);
      return { allowed: true, remaining: LIMIT };
    }

    if ((count ?? 0) >= LIMIT) {
      return { allowed: false, remaining: 0, retryAfterSec: 60 };
    }

    const { error: insertErr } = await supabaseAdmin
      .from("login_attempts")
      .insert({ ip });
    if (insertErr) console.error("rate limit insert error", insertErr);

    // Best-effort cleanup of old rows for this IP.
    void supabaseAdmin
      .from("login_attempts")
      .delete()
      .eq("ip", ip)
      .lt("attempted_at", since);

    return { allowed: true, remaining: LIMIT - ((count ?? 0) + 1) };
  },
);
