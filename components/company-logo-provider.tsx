"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "companyLogoUrl";

type CompanyLogoContextValue = {
  logoUrl: string | null;
  setLogoUrl: (url: string | null) => void;
};

const CompanyLogoContext = createContext<CompanyLogoContextValue | undefined>(
  undefined
);

function getStoredLogoUrl(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE_KEY);
}

export function CompanyLogoProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [logoUrl, setLogoUrlState] = useState<string | null>(null);

  useEffect(() => {
    const stored = getStoredLogoUrl();
    if (stored) {
      setLogoUrlState(stored);
    }
  }, []);

  const setLogoUrl = useCallback((url: string | null) => {
    setLogoUrlState(url);
    if (typeof window === "undefined") return;
    if (url) {
      window.localStorage.setItem(STORAGE_KEY, url);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const value = useMemo(
    () => ({ logoUrl, setLogoUrl }),
    [logoUrl, setLogoUrl]
  );

  return (
    <CompanyLogoContext.Provider value={value}>
      {children}
    </CompanyLogoContext.Provider>
  );
}

export function useCompanyLogo() {
  const context = useContext(CompanyLogoContext);
  if (!context) {
    throw new Error("useCompanyLogo must be used within CompanyLogoProvider");
  }
  return context;
}
