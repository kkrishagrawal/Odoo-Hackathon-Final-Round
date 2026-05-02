"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCompanyLogo } from "@/components/company-logo-provider";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { logoUrl } = useCompanyLogo();

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-[480px] bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-6 sm:p-8 text-on-surface">
        <div className="flex justify-center mb-8">
          {logoUrl ? (
            <img src={logoUrl} alt="Company Logo" className="h-12 object-contain" />
          ) : (
            <div className="w-48 h-12 bg-surface-container-low text-on-surface-variant font-semibold border border-dashed border-outline flex items-center justify-center rounded-md">
              App/Web Logo
            </div>
          )}
        </div>

        <form className="space-y-5 w-full" onSubmit={(e) => e.preventDefault()}>
          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-[150px_minmax(0,1fr)] sm:items-center sm:gap-4 font-medium">
            <label htmlFor="loginId" className="text-left sm:text-right text-on-surface-variant">
              Login Id/Email :-
            </label>
            <input
              id="loginId"
              type="text"
              suppressHydrationWarning
              className="w-full px-3 py-2 border border-outline-variant focus:border-on-surface focus:ring-1 focus:ring-outline focus:outline-none bg-surface-container-lowest rounded-md min-w-0"
            />
          </div>

          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-[150px_minmax(0,1fr)] sm:items-center sm:gap-4 font-medium">
            <label htmlFor="password" className="text-left sm:text-right text-on-surface-variant">
              Password :-
            </label>
            <div className="relative w-full">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="w-full px-3 py-2 border border-outline-variant focus:border-on-surface focus:ring-1 focus:ring-outline focus:outline-none bg-surface-container-lowest rounded-md min-w-0 pr-10"
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="pt-8 flex flex-col items-center gap-4">
            <Button
              className="w-full max-w-[280px] bg-on-surface hover:bg-inverse-surface text-on-primary py-5 text-base font-semibold uppercase rounded-md transition-colors"
            >
              SIGN IN
            </Button>
            
            <p className="text-sm text-on-surface-variant mt-2">
              Don't have an Account?{" "}
              <Link href="/signup" className="text-on-surface hover:text-on-surface-variant hover:underline font-semibold">
                Sign Up
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
