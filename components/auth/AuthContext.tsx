"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Mirrors the Prisma user shape (without password)
export interface AuthUser {
  id: string; // Login ID
  name: string;
  email: string;
  personalEmail: string | null;
  phone: string | null;
  role: "ADMIN" | "HR_OFFICER" | "PAYROLL_OFFICER" | "EMPLOYEE";
  profilePicUrl: string | null;
  status: string;
  companyId: string;
  department: string | null;
  jobPosition: string | null;
  location: string | null;
  managerId: string | null;
  joiningYear: number | null;
  dateOfJoining: string | null;
  dateOfBirth: string | null;
  residingAddress: string | null;
  nationality: string | null;
  gender: string | null;
  maritalStatus: string | null;
  about: string | null;
  whatILove: string | null;
  interests: string | null;
  createdAt: string;
  updatedAt: string;
  company: {
    id: string;
    name: string;
    logoUrl: string | null;
    loginPrefix: string;
    createdAt: string;
    updatedAt: string;
  };
  bankDetails: {
    id: string;
    accountNumber: string;
    bankName: string;
    ifscCode: string;
    panNumber: string;
    uanNumber: string | null;
    employeeCode: string | null;
  } | null;
  skills: { id: string; name: string }[];
  certifications: { id: string; name: string; issuer: string | null; year: number | null }[];
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  setUser: (user: AuthUser | null) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "empay_user";

function getRolePath(role: string): string {
  switch (role) {
    case "ADMIN": return "admin";
    case "HR_OFFICER": return "hr";
    case "PAYROLL_OFFICER": return "payroll";
    case "EMPLOYEE": return "employee";
    default: return "";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const setUser = useCallback((u: AuthUser | null) => {
    setUserState(u);
    if (u) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(u));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
        }
      }
    } catch {
      // silent fail
    }
  }, [setUser]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // silent
    }
    setUser(null);
    toast.info("Logged out successfully.");
    router.push("/login");
  }, [setUser, router]);

  // On mount: try localStorage first, then validate with server
  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AuthUser;
        setUserState(parsed);
      } catch {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    }

    // Validate with server in background
    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Not authenticated");
      })
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => {
        // If server says no session, but we had localStorage, clear it
        // We keep the user for offline/refresh tolerance during hackathon
      })
      .finally(() => setLoading(false));
  }, [setUser]);

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// ─── Role-based route protection ────────────────────────────────────────────

/** Maps a route segment (e.g. "admin") to the required Prisma role */
const ROLE_ROUTE_MAP: Record<string, AuthUser["role"]> = {
  admin: "ADMIN",
  hr: "HR_OFFICER",
  payroll: "PAYROLL_OFFICER",
  employee: "EMPLOYEE",
};

interface RoleGuardProps {
  /** The route segment this guard protects, e.g. "admin" */
  segment: keyof typeof ROLE_ROUTE_MAP;
  children: ReactNode;
}

/**
 * Client component that wraps role-specific layouts.
 * - While auth is loading → shows a subtle loading skeleton.
 * - If user is not logged in → redirects to /login.
 * - If user's role doesn't match the route segment → redirects to their own dashboard + shows error toast.
 * - Otherwise → renders children normally.
 */
export function RoleGuard({ segment, children }: RoleGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (loading) return; // wait for auth to resolve

    if (!user) {
      // Not logged in at all → send to login
      router.replace("/login");
      return;
    }

    const requiredRole = ROLE_ROUTE_MAP[segment];
    if (user.role !== requiredRole) {
      // Logged in but wrong role → redirect to their own dashboard
      const correctPath = getRolePath(user.role);
      toast.error("Access denied. You don't have permission to view that page.");
      router.replace(`/${correctPath}/dashboard`);
      return;
    }

    // All good
    setAuthorized(true);
  }, [user, loading, segment, router]);

  // While auth is resolving, show a loading skeleton
  if (loading || !authorized) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-outline-variant border-t-primary-container rounded-full animate-spin" />
          <p className="text-sm text-on-surface-variant font-medium animate-pulse">
            Verifying access...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export { getRolePath };
