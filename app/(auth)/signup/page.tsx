"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CldUploadWidget } from "next-cloudinary";
import { useCompanyLogo } from "@/components/company-logo-provider";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { logoUrl, setLogoUrl } = useCompanyLogo();

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

        <form className="space-y-6 w-full" onSubmit={(e) => e.preventDefault()}>
          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-[150px_minmax(0,1fr)_40px] sm:items-center sm:gap-4 font-medium">
            <label htmlFor="companyName" className="text-left sm:text-right text-on-surface-variant">
              Company Name :-
            </label>
            <Input id="companyName" type="text" />
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

          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-[150px_minmax(0,1fr)_40px] sm:items-center sm:gap-4 font-medium">
            <label htmlFor="name" className="text-left sm:text-right text-on-surface-variant">
              Name :-
            </label>
            <Input id="name" type="text" />
            <div className="hidden sm:block" />
          </div>

          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-[150px_minmax(0,1fr)_40px] sm:items-center sm:gap-4 font-medium">
            <label htmlFor="email" className="text-left sm:text-right text-on-surface-variant">
              Email :-
            </label>
            <Input id="email" type="email" suppressHydrationWarning />
            <div className="hidden sm:block" />
          </div>

          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-[150px_minmax(0,1fr)_40px] sm:items-center sm:gap-4 font-medium">
            <label htmlFor="phone" className="text-left sm:text-right text-on-surface-variant">
              Phone :-
            </label>
            <Input id="phone" type="tel" />
            <div className="hidden sm:block" />
          </div>

          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-[150px_minmax(0,1fr)_40px] sm:items-center sm:gap-4 font-medium">
            <label htmlFor="password" className="text-left sm:text-right text-on-surface-variant">
              Password :-
            </label>
            <Input id="password" type={showPassword ? "text" : "password"} />
            <button
              type="button"
              className="bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant rounded p-1.5 text-on-surface-variant transition-colors flex items-center justify-center h-10 w-10"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-[150px_minmax(0,1fr)_40px] sm:items-center sm:gap-4 font-medium">
            <label htmlFor="confirmPassword" className="text-left sm:text-right text-on-surface-variant">
              Confirm Password :-
            </label>
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
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
              className="w-full max-w-[340px] bg-on-surface hover:bg-inverse-surface text-on-primary py-5 text-base font-semibold rounded-md transition-colors"
            >
              Sign Up
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
