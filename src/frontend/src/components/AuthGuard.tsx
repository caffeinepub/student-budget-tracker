import { Button } from "@/components/ui/button";
import { BookOpen, Loader2, Shield, TrendingUp, Wallet } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { login, loginStatus, identity, isInitializing, isLoginError } =
    useInternetIdentity();

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center sidebar-gradient">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-sidebar-primary" />
          <p className="text-sidebar-foreground/70 font-body text-sm">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (!identity) {
    return (
      <div className="min-h-screen sidebar-gradient flex items-center justify-center p-4">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-0 rounded-2xl overflow-hidden shadow-2xl">
          {/* Left Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="p-10 flex flex-col justify-between"
            style={{ background: "oklch(0.17 0.045 260)" }}
          >
            <div>
              <div className="flex items-center gap-3 mb-10">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "oklch(0.52 0.18 250 / 0.3)" }}
                >
                  <TrendingUp className="h-5 w-5 text-sidebar-primary" />
                </div>
                <span className="font-display text-xl font-bold text-sidebar-foreground">
                  BudgetSmart
                </span>
              </div>

              <h1 className="font-display text-3xl font-bold text-white mb-4 leading-tight">
                Take control of your student finances
              </h1>
              <p className="text-sidebar-foreground/60 font-body text-sm leading-relaxed">
                Track every rupee, stay within budget, and build healthy
                financial habits — all in one place.
              </p>
            </div>

            <div className="space-y-4 mt-8">
              {[
                { icon: BookOpen, text: "Track expenses by category" },
                { icon: Shield, text: "Smart budget alerts & insights" },
                { icon: Wallet, text: "Split bills with roommates" },
              ].map(({ icon: Icon, text }, i) => (
                <motion.div
                  key={text}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "oklch(0.52 0.18 250 / 0.2)" }}
                  >
                    <Icon className="h-4 w-4 text-sidebar-primary" />
                  </div>
                  <span className="text-sidebar-foreground/70 text-sm font-body">
                    {text}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-card p-10 flex flex-col justify-center"
          >
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">
              Welcome back
            </h2>
            <p className="text-muted-foreground text-sm mb-8 font-body">
              Sign in securely with your Internet Identity to access your
              financial dashboard.
            </p>

            <div className="space-y-4">
              <Button
                onClick={() => login()}
                disabled={loginStatus === "logging-in"}
                size="lg"
                className="w-full font-body font-semibold"
              >
                {loginStatus === "logging-in" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Sign in securely
                  </>
                )}
              </Button>

              {isLoginError && (
                <p className="text-destructive text-sm text-center font-body">
                  Sign in failed. Please try again.
                </p>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground font-body text-center">
                Your data is stored securely on the Internet Computer
                blockchain. No passwords needed.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
