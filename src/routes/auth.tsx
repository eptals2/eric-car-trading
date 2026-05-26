import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { checkLoginRateLimit } from "@/lib/rate-limit.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Car } from "lucide-react";

export const Route = createFileRoute("/auth")({ component: AuthPage });

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email"));
    const password = String(fd.get("password"));
    setLoading(true);

    if (mode === "login") {
      const { checkLoginRateLimit } = await import("@/lib/rate-limit.functions");
      try {
        const rl = await checkLoginRateLimit();
        if (!rl.allowed) {
          setLoading(false);
          toast.error("Too many login attempts. Try again in a minute.");
          return;
        }
      } catch (err) {
        console.error("rate limit check failed", err);
      }
    }

    const { error } =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/admin` } });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success(mode === "login" ? "Signed in" : "Account created");
    navigate({ to: "/admin" });
  }


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
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Sign Up"}
          </Button>
        </form>

        <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-primary">
          {mode === "login" ? "Need an account? Sign up" : "Have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
