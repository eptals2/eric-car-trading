import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { checkLoginRateLimit } from "@/lib/rate-limit.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Car } from "lucide-react";

export const Route = createFileRoute("/auth")({ component: AuthPage });

const COOLDOWN_KEY = "loginCooldownUntil";

function getRemainingSeconds() {
  const until = Number(localStorage.getItem(COOLDOWN_KEY) ?? "0");
  return Math.max(0, Math.ceil((until - Date.now()) / 1000));
}

function setCooldown(seconds: number) {
  localStorage.setItem(COOLDOWN_KEY, String(Date.now() + seconds * 1000));
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(getRemainingSeconds());

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => {
      const remaining = getRemainingSeconds();
      setCountdown(remaining);
      if (remaining <= 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [countdown]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (countdown > 0) return;

    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email"));
    const password = String(fd.get("password"));
    setLoading(true);

    if (mode === "login") {
      try {
        const rl = await checkLoginRateLimit();
        console.log("[rate-limit] result:", rl);
        if (!rl.allowed) {
          const secs = rl.retryAfterSec ?? 60;
          setCooldown(secs);
          setCountdown(secs);
          setLoading(false);
          toast.error(`Too many login attempts. Try again in ${rl.retryAfterSec ?? 60}s.`);
          return;
        }
      } catch (err) {
        console.error("rate limit check failed", err);
        setLoading(false);
        toast.error("Login temporarily unavailable. Please try again.");
        return;
      }
    }

    let error: { message: string } | null = null;
    if (mode === "login") {
      const res = await supabase.auth.signInWithPassword({ email, password });
      // res.error is null when successful
      error = (res as any).error ?? null;
    } else {
      // Sign up is disabled — instruct admin contact
      error = { message: "Ask the administrator for access" };
      // If you later enable sign-up, replace the above with the signUp call:
      // const res = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/admin` } });
      // error = (res as any).error ?? null;
    }

    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success(mode === "login" ? "Signed in" : "Ask the administrator for access");
    navigate({ to: "/admin" });
  }

  const isBlocked = countdown > 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4" style={{ background: "var(--gradient-hero)" }}>
      <div className="w-full max-w-md rounded-xl bg-card p-8 shadow-[var(--shadow-glow)]">
        <Link to="/" className="flex items-center gap-2 mb-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Car className="h-5 w-5" />
          </div>
          <span className="font-display text-xl">ERIC CAR TRADING</span>
        </Link>
        <h1 className="font-display text-3xl mb-1">{mode === "login" ? "Admin Login" : "Create Account"}</h1>
        <p className="text-sm text-muted-foreground mb-6">Manage your car listings and inquiries.</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required minLength={6} autoComplete={mode === "login" ? "current-password" : "new-password"} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading 
            ? "Please wait..." 
            : isBlocked 
            ? `Try again in ${countdown}s` 
            : mode === "login" 
            ? "Sign In" 
            : "Sign Up"}
          </Button>
        </form>

        <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-primary">
          {mode === "login" ? "Need an account? Sign up" : "Have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
