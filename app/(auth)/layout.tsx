"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth, getRolePath } from "@/components/auth/AuthContext";

/**
 * Auth layout guard — prevents logged-in users from accessing /login, /signup, etc.
 * If a user with an active session visits these pages, they get sent to their dashboard.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loading) return;

    // Allow access to the reset-password page even if logged in
    if (pathname === "/reset-password") {
      setReady(true);
      return;
    }

    if (user) {
      // Already logged in → redirect to their dashboard
      const rolePath = getRolePath(user.role);
      router.replace(`/${rolePath}/dashboard`);
      return;
    }

    // Not logged in → allow access to auth pages
    setReady(true);
  }, [user, loading, router, pathname]);

  if (loading || !ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-outline-variant border-t-primary-container rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
