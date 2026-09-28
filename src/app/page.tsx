"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Zap, ShieldAlert, Lock, ArrowRight } from "lucide-react";
import { loginAction } from "@/app/actions/auth";

function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const searchParams = useSearchParams();
  const isUnauth = searchParams.get("reason") === "unauthenticated";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    const formData = new FormData();
    formData.append("identifier", identifier);
    formData.append("password", password);
    const res = await loginAction(formData);
    if (res.success && res.redirectTo) {
      window.location.href = res.redirectTo;
    } else {
      setIsLoading(false);
      setErrorMessage(res.error || "Login failed. Please check credentials.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 py-10 px-4 sm:px-6 relative overflow-hidden">

      {/* Ambient glow orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, oklch(0.65 0.25 275), transparent 70%)", animation: "float 6s ease-in-out infinite" }} />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full opacity-15 blur-3xl"
          style={{ background: "radial-gradient(circle, oklch(0.72 0.18 200), transparent 70%)", animation: "float 8s ease-in-out infinite", animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.04] blur-3xl"
          style={{ background: "radial-gradient(circle, oklch(0.65 0.25 275), transparent 60%)" }} />
      </div>

      {/* Logo area */}
      <div className="text-center mb-10 relative z-10 animate-in fade-in slide-in-from-top-5 duration-700">
        <div className="flex items-center justify-center mb-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl blur-xl opacity-60"
              style={{ background: "linear-gradient(135deg, oklch(0.58 0.26 278), oklch(0.65 0.20 200))" }} />
            <div className="relative p-4 rounded-2xl border border-white/10"
              style={{ background: "linear-gradient(135deg, oklch(0.25 0.12 275), oklch(0.20 0.10 265))" }}>
              <Zap className="h-7 w-7 text-white" strokeWidth={2.5} />
            </div>
          </div>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight shimmer-text">
          SoftTech Mess
        </h1>
        <p className="text-sm text-muted-foreground mt-2 font-medium">
          Monthly Mess Account Management System
        </p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md relative z-10 animate-in zoom-in-95 fade-in duration-500 delay-150">
        <div className="glass-card-elevated rounded-2xl overflow-hidden">
          {/* Card top accent line */}
          <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, oklch(0.65 0.25 275 / 60%), oklch(0.72 0.18 200 / 60%), transparent)" }} />

          <div className="p-7 sm:p-8">
            <h2 className="text-xl font-bold text-foreground mb-1">Welcome back</h2>
            <p className="text-sm text-muted-foreground mb-6">Sign in to your Mess Portal</p>

            {/* Alerts */}
            {isUnauth && (
              <div className="mb-5 p-3.5 rounded-xl text-sm font-medium flex items-center gap-2.5"
                style={{ background: "oklch(0.78 0.18 80 / 10%)", border: "1px solid oklch(0.78 0.18 80 / 20%)", color: "oklch(0.78 0.18 80)" }}>
                <Lock className="h-4 w-4 shrink-0" />
                You must be logged in to access that page.
              </div>
            )}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl text-sm font-medium flex items-center gap-2.5"
                style={{ background: "oklch(0.65 0.24 27 / 10%)", border: "1px solid oklch(0.65 0.24 27 / 20%)", color: "oklch(0.70 0.22 27)" }}>
                <ShieldAlert className="h-4 w-4 shrink-0" />
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="identifier" className="text-sm font-semibold text-foreground/80">
                  Email / Phone
                </Label>
                <Input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="your@email.com or 017XXXXXXXX"
                  required
                  autoComplete="username"
                  className="h-11 rounded-xl bg-white/5 border-white/10 focus:border-white/25 focus:ring-0 text-foreground placeholder:text-muted-foreground/40 transition-all duration-200"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-semibold text-foreground/80">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="h-11 rounded-xl bg-white/5 border-white/10 focus:border-white/25 focus:ring-0 text-foreground placeholder:text-muted-foreground/40 transition-all duration-200"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base font-bold btn-glow rounded-xl mt-2 gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <p className="text-xs text-center text-muted-foreground mt-5">
              Forgot your password? Contact your mess manager.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
