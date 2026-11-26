"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  IconLoader2,
  IconEye,
  IconEyeOff,
  IconAlertCircle,
  IconLock,
  IconMail,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { authService } from "@/services/auth.service";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    if (isAuthenticated) {
      const token = authService.getAccessToken();
      if (token) {
        document.cookie = `paperless_access_token=${token}; path=/; max-age=86400; SameSite=Lax`;
      }
      const rawFrom = searchParams.get("from");
      const target = rawFrom && rawFrom.startsWith("/") ? rawFrom : "/dashboard";
      window.location.href = target;
    }
  }, [isAuthenticated, searchParams]);

  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [rememberMe, setRememberMe] = React.useState(true);
  const [showPassword, setShowPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [errors, setErrors] = React.useState<{ identifier?: string; password?: string }>({});

  const validate = () => {
    const errs: { identifier?: string; password?: string } = {};
    if (!identifier.trim()) {
      errs.identifier = "Email address or mobile number is required.";
    }
    if (!password) {
      errs.password = "Password is required.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  if (mounted && isAuthenticated) {
    const rawFrom = searchParams.get("from");
    const target = rawFrom && rawFrom.startsWith("/") ? rawFrom : "/dashboard";

    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-in fade-in-50 text-center">
        <IconLoader2 className="size-8 animate-spin text-primary" />
        <div>
          <p className="text-sm font-semibold text-foreground">Already signed in</p>
          <p className="text-xs text-muted-foreground mt-0.5">Redirecting to your dashboard...</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
          <Button
            size="sm"
            onClick={() => {
              const token = authService.getAccessToken();
              if (token) {
                document.cookie = `paperless_access_token=${token}; path=/; max-age=86400; SameSite=Lax`;
              }
              window.location.href = target;
            }}
            className="w-full sm:w-auto"
          >
            Click here to Continue
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              authService.clearAuth();
              window.location.href = "/login";
            }}
            className="w-full sm:w-auto text-xs"
          >
            Sign Out / Switch Account
          </Button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await login({
        identifier: identifier.trim(),
        password,
        remember_me: rememberMe,
      });

      toast.success("Welcome back!", {
        description: `Signed in as ${res.user.full_name}${
          res.user.is_superadmin ? " (Super Admin)" : ""
        }`,
      });

      // Redirect to main business OS dashboard
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Invalid credentials. Please verify and try again.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your email or phone to access your business workspace.
        </p>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
          <IconAlertCircle className="size-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Identifier Field */}
        <div className="space-y-1.5">
          <Label htmlFor="identifier">
            Email or Phone Number <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <IconMail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              id="identifier"
              type="text"
              autoComplete="username"
              placeholder="e.g. superadmin@gmail.com or 03001234567"
              className={cn("pl-9", errors.identifier && "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive")}
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                if (errors.identifier) setErrors((prev) => ({ ...prev, identifier: undefined }));
              }}
              disabled={isSubmitting}
            />
          </div>
          {errors.identifier && (
            <p className="text-xs text-destructive font-medium mt-1 flex items-center gap-1 animate-in fade-in-50">
              <IconAlertCircle className="size-3.5 shrink-0" />
              <span>{errors.identifier}</span>
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">
              Password <span className="text-destructive">*</span>
            </Label>
            <Link
              href="/forgot-password"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <IconLock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              className={cn("pl-9 pr-9", errors.password && "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive")}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showPassword ? (
                <IconEyeOff className="size-4" />
              ) : (
                <IconEye className="size-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive font-medium mt-1 flex items-center gap-1 animate-in fade-in-50">
              <IconAlertCircle className="size-3.5 shrink-0" />
              <span>{errors.password}</span>
            </p>
          )}
        </div>

        {/* Remember me */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(!!checked)}
            />
            <Label htmlFor="remember" className="text-xs font-normal cursor-pointer">
              Remember me on this device
            </Label>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full font-medium"
          disabled={isSubmitting || isAuthLoading}
        >
          {isSubmitting ? (
            <>
              <IconLoader2 className="mr-2 size-4 animate-spin" />
              Signing in…
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        Don&apos;t have a business account yet?{" "}
        <Link
          href="/register"
          className="font-semibold text-primary hover:underline"
        >
          Register your business
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <IconLoader2 className="size-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground font-medium">Loading...</p>
        </div>
      }
    >
      <LoginForm />
    </React.Suspense>
  );
}
