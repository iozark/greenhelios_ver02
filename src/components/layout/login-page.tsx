"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Leaf, Loader2, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LocaleSwitcher } from "@/components/locale-switcher";

function mapAuthError(
  raw: string | undefined,
  t: (key: "invalidCredentials" | "requiredFields" | "accountDisabled") => string
): string {
  if (!raw) return "";
  if (raw.includes("Invalid email or password")) return t("invalidCredentials");
  if (raw.includes("Email and password are required"))
    return t("requiredFields");
  if (raw.includes("disabled")) return t("accountDisabled");
  return raw;
}

export function LoginPage() {
  const t = useTranslations("login");
  const tCommon = useTranslations("common");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(mapAuthError(result.error, t));
      }
    } catch {
      setError(tCommon("unexpectedError"));
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError("");
    setLoading(true);
    setEmail("admin@greenhelios.local");
    setPassword("admin123");
    try {
      const result = await signIn("credentials", {
        email: "admin@greenhelios.local",
        password: "admin123",
        redirect: false,
      });
      if (result?.error) {
        setError(mapAuthError(result.error, t));
      }
    } catch {
      setError(tCommon("unexpectedError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0">
        {/* Subtle gradient blobs */}
        <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-primary/3 blur-3xl" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="absolute right-3 top-3 z-20 sm:right-6 sm:top-6">
        <LocaleSwitcher variant="ghost" />
      </div>

      {/* Login card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 0.5,
          ease: [0.21, 0.47, 0.32, 0.98],
        }}
        className="relative z-10 w-full max-w-md px-4"
      >
        <Card className="border-border/50 shadow-xl shadow-primary/5">
          <CardHeader className="items-center pb-2 text-center">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="mb-4 flex flex-col items-center gap-3"
            >
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25">
                <Leaf className="size-7 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold tracking-tight">
                  GreenHelios
                </CardTitle>
                <CardDescription className="mt-1">{t("subtitle")}</CardDescription>
              </div>
            </motion.div>
          </CardHeader>

          <CardContent>
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              className="space-y-4"
            >
              {/* Error message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
                >
                  {error}
                </motion.div>
              )}

              {/* Email field */}
              <div className="space-y-2">
                <Label htmlFor="email">{t("email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="h-11"
                />
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <Label htmlFor="password">{t("password")}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("passwordPlaceholder")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Sign in button */}
              <Button
                type="submit"
                className="h-11 w-full bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    {tCommon("signingIn")}
                  </>
                ) : (
                  t("signIn")
                )}
              </Button>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    {tCommon("or")}
                  </span>
                </div>
              </div>

              {/* Demo login button */}
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full border-primary/20 text-primary hover:bg-primary/5 hover:text-primary"
                onClick={handleDemoLogin}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    {tCommon("loading")}
                  </>
                ) : (
                  t("demoSignIn")
                )}
              </Button>

              {/* Footer text */}
              <p className="pt-2 text-center text-xs text-muted-foreground">
                {t("demoHint")}
              </p>
            </motion.form>
          </CardContent>
        </Card>

        {/* Bottom brand */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="mt-6 text-center text-xs text-muted-foreground"
        >
          {tCommon("footerCopyright", {
            year: String(new Date().getFullYear()),
          })}
        </motion.p>
      </motion.div>
    </div>
  );
}

export default LoginPage;
