import { createServerFn } from "@tanstack/react-start";
import { getRequestIP, getRequestHeader } from "@tanstack/react-start/server";
import { supabase } from "@/integrations/supabase/client";

const LIMIT = 3;
const WINDOW_MS = 60_000;

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSec?: number;
};

export const checkLoginRateLimit = createServerFn({ method: "POST" }).handler(
  async () => {
    const ip =
      getRequestHeader("cf-connecting-ip") ||
      getRequestHeader("x-real-ip") ||
      getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ||
      getRequestIP({ xForwardedFor: true }) ||
      "unknown";
    console.log("[rate-limit] checking ip:", ip);

    const { data, error } = await supabase.rpc("check_login_rate_limit", {
      _ip: ip,
      _limit: LIMIT,
      _window_seconds: Math.floor(WINDOW_MS / 1000),
    });

    if (error) {
      console.error("rate limit rpc error", error);
      return { allowed: true, remaining: LIMIT };
    }

    return data as RateLimitResult;
  },
);
