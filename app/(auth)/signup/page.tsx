"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CldUploadWidget } from "next-cloudinary";
import { useCompanyLogo } from "@/components/company-logo-provider";
import { useAuth } from "@/components/auth/AuthContext";
import { signup } from "../actions";

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { logoUrl, setLogoUrl } = useCompanyLogo();
  const { refreshUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{
    loginId: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    // Attach the Cloudinary logo URL (not from a form field)
    if (logoUrl) {
      formData.set("logoUrl", logoUrl);
    }

    const result = await signup(formData);

    setLoading(false);

    if (!result.success) {
      setError(result.error ?? "Signup failed.");
      return;
    }

    // Show the generated Login ID before redirecting
    setSuccessInfo({ loginId: result.loginId! });

    // Fetch full user data to populate AuthContext + localStorage
    await refreshUser();

    // Redirect after a short delay so user can see their Login ID
    setTimeout(() => {
      router.push("/admin/dashboard");
    }, 4000);
  }

  if (successInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-[520px] bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-8 text-on-surface text-center space-y-5">
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-full bg-green-500/15 flex items-center justify-center">
              <svg
                className="w-7 h-7 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          <h2 className="text-xl font-semibold">Account Created!</h2>

          <div className="bg-surface-container-low rounded-lg p-4 border border-outline-variant">
            <p className="text-sm text-on-surface-variant mb-1">
              Your Login ID is:
            </p>
            <p className="text-2xl font-bold tracking-wider text-on-surface font-mono">
              {successInfo.loginId}
            </p>
          </div>

          <p className="text-sm text-on-surface-variant">
            Please save this Login ID. You&apos;ll need it to sign in.
            <br />
            Redirecting to dashboard...
          </p>

          <div className="flex justify-center">
            <Loader2 className="animate-spin text-on-surface-variant" size={20} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-[650px] bg-p rounded-xl border border-outline-variant shadow-sm p-6 sm:p-8 text-on-surface">
        <div className="flex justify-center mb-8">
          {logoUrl ? (
            <img src={logoUrl} alt="Company Logo" className="h-12 object-contain" />
          ) : (
            <div className="w-48 h-12 bg-surface-container-low text-on-surface-variant font-semibold border border-dashed border-outline rounded-md flex items-center justify-center">
              App/Web Logo
            </div>
          )}
        </div>

        <form className="space-y-6 w-full" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-md px-4 py-2.5 text-sm font-medium">
              {error}
            </div>
          )}

          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-[180px_minmax(0,1fr)_40px] sm:items-center sm:gap-4 font-medium">
            <label htmlFor="companyName" className="text-left sm:text-right text-on-surface-variant whitespace-nowrap">
              Company Name :-
            </label>
            <Input id="companyName" name="companyName" type="text" required />
            <div className="flex sm:justify-end">
              <CldUploadWidget
                uploadPreset="ml_default"
                onSuccess={(result: any) => {
                  setLogoUrl(result?.info?.secure_url ?? null);
                }}
              >
                {({ open }) => (
                  <button
                    type="button"
                    onClick={() => open()}
                    className="cursor-pointer bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant border border-outline-variant p-2 rounded-md transition-colors flex items-center justify-center"
                  >
                    <Upload size={18} />
                    <span className="ml-2 sm:hidden text-sm">Upload</span>
                  </button>
                )}
              </CldUploadWidget>
            </div>
          </div>

          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-[180px_minmax(0,1fr)_40px] sm:items-center sm:gap-4 font-medium">
            <label htmlFor="name" className="text-left sm:text-right text-on-surface-variant whitespace-nowrap">
              Name :-
            </label>
            <Input id="name" name="name" type="text" required />
            <div className="hidden sm:block" />
          </div>

          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-[180px_minmax(0,1fr)_40px] sm:items-center sm:gap-4 font-medium">
            <label htmlFor="email" className="text-left sm:text-right text-on-surface-variant whitespace-nowrap">
              Email :-
            </label>
            <Input id="email" name="email" type="email" suppressHydrationWarning required />
            <div className="hidden sm:block" />
          </div>

          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-[180px_minmax(0,1fr)_40px] sm:items-center sm:gap-4 font-medium">
            <label htmlFor="phone" className="text-left sm:text-right text-on-surface-variant whitespace-nowrap">
              Phone :-
            </label>
            <Input id="phone" name="phone" type="tel" />
            <div className="hidden sm:block" />
          </div>

          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-[180px_minmax(0,1fr)_40px] sm:items-center sm:gap-4 font-medium">
            <label htmlFor="password" className="text-left sm:text-right text-on-surface-variant whitespace-nowrap">
              Password :-
            </label>
            <Input id="password" name="password" type={showPassword ? "text" : "password"} required />
            <button
              type="button"
              className="bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant rounded p-1.5 text-on-surface-variant transition-colors flex items-center justify-center h-10 w-10"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-[180px_minmax(0,1fr)_40px] sm:items-center sm:gap-4 font-medium">
            <label htmlFor="confirmPassword" className="text-left sm:text-right text-on-surface-variant whitespace-nowrap">
              Confirm Password :-
            </label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              required
            />
            <button
              type="button"
              className="bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant rounded p-1.5 text-on-surface-variant transition-colors flex items-center justify-center h-10 w-10"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="pt-8 flex flex-col items-center gap-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full max-w-[340px] bg-on-surface hover:bg-inverse-surface text-on-primary py-5 text-base font-semibold rounded-md transition-colors disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={18} />
                  Creating Account...
                </span>
              ) : (
                "Sign Up"
              )}
            </Button>

            <p className="text-sm text-on-surface-variant mt-2">
              Already have an account?{" "}
              <Link href="/login" className="text-on-surface hover:text-on-surface-variant hover:underline font-semibold">
                Sign In
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
