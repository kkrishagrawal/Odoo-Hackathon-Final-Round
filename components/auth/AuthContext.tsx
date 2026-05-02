"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useRouter } from "next/navigation";

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

export { getRolePath };
