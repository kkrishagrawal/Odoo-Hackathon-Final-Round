"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { resetPassword } from "@/app/actions/security";
import { toast } from "sonner";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-md text-center border border-red-200">
        <p className="font-semibold mb-2">Invalid Reset Link</p>
        <p className="text-sm">The password reset link is missing or invalid.</p>
        <Button variant="outline" onClick={() => router.push("/login")} className="mt-4 w-full border-red-200 text-red-600 hover:bg-red-100">
          Go to Login
        </Button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-on-surface">Password Reset Successful!</h2>
        <p className="text-on-surface-variant">Your password has been changed.</p>
        <Button onClick={() => router.push("/login")} className="mt-6 w-full py-5 text-base font-semibold">
          Return to Login
        </Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.set("token", token);
    formData.set("newPassword", newPassword);
    formData.set("confirmPassword", confirmPassword);

    try {
      const result = await resetPassword(formData);
      if (result.success) {
        setSuccess(true);
        toast.success("Password reset successfully.");
      } else {
        toast.error(result.error || "Failed to reset password.");
      }
    } catch (err) {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-on-surface mb-2">Create New Password</h1>
        <p className="text-on-surface-variant text-sm">Please enter your new password below.</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider">New Password <span className="text-red-500">*</span></label>
        <div className="relative">
          <Input 
            type={showPassword ? "text" : "password"} 
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="pr-10 w-full px-3 py-2.5 text-sm border border-outline-variant rounded-lg focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container bg-surface-container-lowest text-on-surface transition-colors"
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider">Confirm Password <span className="text-red-500">*</span></label>
        <div className="relative">
          <Input 
            type={showConfirmPassword ? "text" : "password"} 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="pr-10 w-full px-3 py-2.5 text-sm border border-outline-variant rounded-lg focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container bg-surface-container-lowest text-on-surface transition-colors"
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full py-5 text-base font-semibold bg-on-surface hover:bg-inverse-surface text-on-primary">
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="animate-spin" size={18} />
            Saving...
          </span>
        ) : (
          "Save New Password"
        )}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <div className="w-full max-w-[450px] bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-8 text-on-surface">
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" size={24} /></div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
