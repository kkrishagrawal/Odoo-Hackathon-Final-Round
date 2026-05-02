"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { useCompanyLogo } from "@/components/company-logo-provider";

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const payslipRef = useRef<HTMLDivElement>(null);
  const { logoUrl } = useCompanyLogo();

  useEffect(() => {
    // Hero Animations
    const heroCtx = gsap.context(() => {
      gsap.fromTo(
        ".hero-text",
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, stagger: 0.2, ease: "power3.out" }
      );
      gsap.fromTo(
        ".hero-image",
        { y: 100, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 1.2, delay: 0.4, ease: "power3.out" }
      );
      gsap.fromTo(
        ".hero-float",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, delay: 1, stagger: 0.2, ease: "elastic.out(1, 0.7)" }
      );
    }, heroRef);

    // Features Animations
    const featuresCtx = gsap.context(() => {
      gsap.fromTo(
        ".feature-card",
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: featuresRef.current,
            start: "top 80%",
          },
        }
      );
    }, featuresRef);

    // Payslip Animations
    const payslipCtx = gsap.context(() => {
      gsap.fromTo(
        ".payslip-card",
        { x: -50, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: payslipRef.current,
            start: "top 70%",
          },
        }
      );
      gsap.fromTo(
        ".payslip-text",
        { x: 50, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: payslipRef.current,
            start: "top 70%",
          },
        }
      );
    }, payslipRef);

    return () => {
      heroCtx.revert();
      featuresCtx.revert();
      payslipCtx.revert();
    };
  }, []);

  return (
    <div className="bg-background-custom text-on-background font-body-md min-h-screen flex flex-col">
      {/* TopNavBar */}
      <nav className="bg-white/90 dark:bg-slate-950/90 backdrop-blur-md sticky top-0 w-full z-50 border-b border-purple-50 dark:border-slate-800 shadow-[0_8px_30px_rgb(113,75,103,0.04)]">
        <div className="flex justify-between items-center h-20 max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center gap-md">
            <Link className="text-2xl font-black tracking-tight text-[#714B67] dark:text-white font-h1 antialiased" href="/">
              {logoUrl ? (
                <img src={logoUrl} alt="Company Logo" className="h-8 w-auto object-contain" />
              ) : (
                "EmPay"
              )}
            </Link>
          </div>
          <div className="hidden md:flex items-center gap-lg font-h1 antialiased">
            <Link className="text-[#714B67] dark:text-white font-bold border-b-2 border-[#714B67] pb-1 hover:bg-purple-50 dark:hover:bg-slate-900 rounded-lg transition-all duration-200 px-3 py-2" href="#">
              Features
            </Link>
            <Link className="text-slate-600 dark:text-slate-400 font-medium hover:text-[#714B67] hover:bg-purple-50 dark:hover:bg-slate-900 rounded-lg transition-all duration-200 px-3 py-2" href="#">
              Solutions
            </Link>
            <Link className="text-slate-600 dark:text-slate-400 font-medium hover:text-[#714B67] hover:bg-purple-50 dark:hover:bg-slate-900 rounded-lg transition-all duration-200 px-3 py-2" href="#">
              Pricing
            </Link>
          </div>
          <div className="flex items-center gap-sm font-h1 antialiased">
            <Link href="/login">
              <button className="hidden md:block text-[#714B67] dark:text-[#a17a97] font-medium hover:bg-purple-50 dark:hover:bg-slate-900 rounded-lg transition-all duration-200 px-4 py-2 active:scale-95 transform transition-transform duration-150">
                Login
              </button>
            </Link>
            <Link href="/login">
              <button className="bg-[#714B67] text-white font-medium rounded-lg px-5 py-2.5 hover:bg-[#5A3C53] transition-all duration-200 active:scale-95 transform transition-transform duration-150">
                Get Started
              </button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        {/* Hero Section */}
        <section ref={heroRef} className="max-w-7xl mx-auto px-6 lg:px-12 pt-xl pb-xl flex flex-col items-center text-center">
          <h1 className="hero-text font-h1 text-h1 text-on-background max-w-4xl mb-md">
            <span className="font-display-handwritten text-display-handwritten marker-underline">Humanizing HR</span>, one click at a time.
          </h1>
          <p className="hero-text font-body-lg text-body-lg text-on-surface-variant max-w-2xl mb-lg">
            EmPay simplifies HR & Payroll operations for smarter, more empathetic workplaces. Spend less time on spreadsheets and more time with your people.
          </p>
          <div className="hero-text flex flex-col sm:flex-row gap-md items-center justify-center w-full">
            <button className="w-full sm:w-auto bg-primary-container text-white font-label-md text-label-md py-3 px-8 rounded-full shadow-[0_8px_16px_rgba(113,75,103,0.15)] hover:bg-[#5A3C53] transition-colors active:scale-95 flex items-center justify-center gap-2">
              Get Started for Free
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
            <button className="w-full sm:w-auto bg-surface-container-lowest text-primary-container border border-outline-variant font-label-md text-label-md py-3 px-8 rounded-full hover:bg-surface-container-low transition-colors active:scale-95 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">play_circle</span>
              Watch Demo
            </button>
          </div>

          {/* Hero Illustration */}
          <div className="mt-xl w-full max-w-5xl relative hero-image">
            <div className="bg-surface-container-lowest rounded-xl shadow-[0_20px_60px_rgba(113,75,103,0.08)] border border-outline-variant/30 overflow-hidden relative">
              {/* Using standard img to avoid Next.js Image host config issues or styling differences */}
              <img
                alt="Dashboard Preview"
                className="w-full h-auto object-cover opacity-90"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBtQ7gm8KqvaKOsCq8udXC7Udds1XtGBbQS1L0k-Q-msfXhBLGISxNbolZZpUAlUtvXe0z4uJS-wFypuJOHGcYXBt1UC88eiuOfOBiXtFzNG8X9EDwwIckOBLSZ5rLY-fWspPbpwlDBqb9CVsX5qWTA68SQnMZWxuwkdqh-6dlXsphxofvQ-OMDnnC560vF4_8KJK5_6i2JNBGeIYQScCLhlVSh8eiPv7YQRv3i9ajM1Irc7Y-7tZznnykNoNgfFFACViU4M-usygol"
              />
              
              {/* Decorative Floating Elements */}
              <div className="hero-float absolute top-1/4 -left-8 bg-surface-container-lowest p-sm rounded-lg shadow-[0_8px_30px_rgba(113,75,103,0.12)] border border-outline-variant/20 hidden md:flex items-center gap-sm transform -rotate-3">
                <div className="w-8 h-8 rounded-full bg-[#F2A93B]/20 flex items-center justify-center text-[#F2A93B]">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                </div>
                <div>
                  <p className="font-label-md text-caption text-on-surface">Payrun Approved</p>
                  <p className="font-caption text-[10px] text-on-surface-variant">Just now</p>
                </div>
              </div>

              {/* Hand-drawn arrow SVG */}
              <svg className="hero-float absolute top-1/3 -right-12 hidden lg:block w-24 h-24 text-[#F2A93B]" fill="none" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 90 Q 40 50 90 20" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
                <path d="M70 15 L 95 15 L 85 40" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                <text fill="currentColor" fontFamily="cursive" fontSize="14" x="10" y="95">Automated Payruns</text>
              </svg>
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section ref={featuresRef} className="max-w-7xl mx-auto px-6 lg:px-12 py-xl">
          <div className="text-center mb-lg">
            <h2 className="font-h2 text-h2 text-on-background mb-sm">Everything you need, nothing you don't.</h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mx-auto">
              Thoughtfully designed modules that adapt to your team's workflow.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
            {/* Feature 1: User Mgmt */}
            <div className="feature-card bg-surface-container-lowest p-lg rounded-xl shadow-[0_8px_30px_rgba(113,75,103,0.04)] border border-outline-variant/30 flex flex-col items-start hover:shadow-[0_12px_40px_rgba(113,75,103,0.08)] transition-shadow duration-300">
              <div className="w-12 h-12 rounded-full bg-primary-container/10 flex items-center justify-center text-primary-container mb-md">
                <span className="material-symbols-outlined">group</span>
              </div>
              <h3 className="font-h3 text-h3 text-on-surface mb-xs">User & Role Management</h3>
              <p className="font-body-md text-body-md text-on-surface-variant flex-grow">Secure and flexible access controls for every level of your organization.</p>
            </div>

            {/* Feature 2: Attendance */}
            <div className="feature-card bg-surface-container-lowest p-lg rounded-xl shadow-[0_8px_30px_rgba(113,75,103,0.04)] border border-outline-variant/30 flex flex-col items-start hover:shadow-[0_12px_40px_rgba(113,75,103,0.08)] transition-shadow duration-300">
              <div className="w-12 h-12 rounded-full bg-secondary-container/20 flex items-center justify-center text-on-secondary-container mb-md">
                <span className="material-symbols-outlined">calendar_month</span>
              </div>
              <h3 className="font-h3 text-h3 text-on-surface mb-xs">Attendance & Leave</h3>
              <p className="font-body-md text-body-md text-on-surface-variant flex-grow">Apply for time-off in seconds. Managers approve with a single tap.</p>
            </div>

            {/* Feature 3: Payroll */}
            <div className="feature-card bg-surface-container-lowest p-lg rounded-xl shadow-[0_8px_30px_rgba(113,75,103,0.04)] border border-outline-variant/30 flex flex-col items-start hover:shadow-[0_12px_40px_rgba(113,75,103,0.08)] transition-shadow duration-300 md:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 rounded-full bg-[#F2A93B]/20 flex items-center justify-center text-[#b37a24] mb-md">
                <span className="material-symbols-outlined">payments</span>
              </div>
              <h3 className="font-h3 text-h3 text-on-surface mb-xs">Payroll Management</h3>
              <p className="font-body-md text-body-md text-on-surface-variant flex-grow">Automated payruns, compliant tax deductions, and instant payslips.</p>
            </div>

            {/* Feature 4: Analytics */}
            <div className="feature-card bg-surface-container-lowest p-lg rounded-xl shadow-[0_8px_30px_rgba(113,75,103,0.04)] border border-outline-variant/30 flex flex-col sm:flex-row items-center gap-lg hover:shadow-[0_12px_40px_rgba(113,75,103,0.08)] transition-shadow duration-300 md:col-span-3">
              <div className="flex-1">
                <div className="w-12 h-12 rounded-full bg-tertiary-container/20 flex items-center justify-center text-on-tertiary-container mb-md">
                  <span className="material-symbols-outlined">analytics</span>
                </div>
                <h3 className="font-h3 text-h3 text-on-surface mb-xs">Dashboard & Analytics</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Data-driven workforce decisions. Understand trends in attendance, turnover, and payroll costs at a glance.
                </p>
              </div>
              <div className="flex-1 w-full bg-surface-container-low rounded-lg h-40 border border-outline-variant/20 flex items-center justify-center relative overflow-hidden">
                <div className="w-3/4 h-24 flex items-end gap-2 opacity-50">
                  <div className="w-1/5 bg-primary-container h-1/3 rounded-t-sm" />
                  <div className="w-1/5 bg-primary-container h-2/3 rounded-t-sm" />
                  <div className="w-1/5 bg-secondary-container h-1/2 rounded-t-sm" />
                  <div className="w-1/5 bg-primary-container h-full rounded-t-sm" />
                  <div className="w-1/5 bg-[#F2A93B] h-4/5 rounded-t-sm" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Visual Highlight Section (Payslip) */}
        <section ref={payslipRef} className="bg-surface-container-low py-xl border-y border-outline-variant/20 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col md:flex-row items-center gap-xl">
            <div className="payslip-card flex-1 w-full relative">
              {/* Glassmorphism Payslip Card */}
              <div className="bg-surface-container-lowest/80 backdrop-blur-xl p-lg rounded-xl shadow-[0_20px_40px_rgba(113,75,103,0.08)] border border-outline-variant/40 relative z-10">
                <div className="flex justify-between items-start mb-md pb-sm border-b border-outline-variant/30">
                  <div>
                    <h4 className="font-label-md text-label-md text-on-surface">Payslip</h4>
                    <p className="font-caption text-caption text-on-surface-variant">October 2024</p>
                  </div>
                  <span className="material-symbols-outlined text-outline">download</span>
                </div>
                <div className="space-y-sm mb-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-body-md text-body-md text-on-surface-variant">Basic Salary</span>
                    <span className="font-body-md text-body-md text-on-surface font-medium">$4,500.00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-body-md text-body-md text-on-surface-variant">Provident Fund (PF)</span>
                    <span className="font-body-md text-body-md text-error">-$225.00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-body-md text-body-md text-on-surface-variant">Professional Tax</span>
                    <span className="font-body-md text-body-md text-error">-$50.00</span>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-sm border-t border-outline-variant/30 relative">
                  <span className="font-label-md text-label-md text-on-surface">Net Pay</span>
                  <span className="font-h3 text-h3 text-primary-container">$4,225.00</span>
                  
                  {/* Verified Scribble */}
                  <div className="absolute -right-6 -bottom-6 transform rotate-12 text-[#2EB3E6]">
                    <svg fill="none" height="60" viewBox="0 0 100 100" width="60" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 50 L 40 70 L 80 30" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="6" />
                      <circle cx="50" cy="50" fill="none" r="45" stroke="currentColor" strokeDasharray="8 4" strokeWidth="2" />
                      <text fill="currentColor" fontFamily="cursive" fontSize="12" x="35" y="85">Verified</text>
                    </svg>
                  </div>
                </div>
              </div>
              {/* Decorative background blob */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary-container/10 rounded-full blur-3xl -z-10" />
            </div>

            <div className="payslip-text flex-1">
              <h2 className="font-h2 text-h2 text-on-background mb-sm">Transparent, instant payslips.</h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant mb-md">
                Give your team clarity over their earnings. Our automated payslip generation breaks down complex deductions into easy-to-understand statements.
              </p>
              <ul className="space-y-sm mb-lg">
                <li className="flex items-center gap-xs font-body-md text-body-md text-on-surface">
                  <span className="material-symbols-outlined text-primary-container text-sm">check</span>
                  1-Click Download & Email
                </li>
                <li className="flex items-center gap-xs font-body-md text-body-md text-on-surface">
                  <span className="material-symbols-outlined text-primary-container text-sm">check</span>
                  Auto-calculates local taxes
                </li>
                <li className="flex items-center gap-xs font-body-md text-body-md text-on-surface">
                  <span className="material-symbols-outlined text-primary-container text-sm">check</span>
                  Mobile-friendly view
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-stone-50 dark:bg-slate-950 w-full py-16 px-6 lg:px-12 border-t border-purple-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 font-h1 text-sm">
          <div className="col-span-1 md:col-span-2">
            <span className="text-xl font-bold text-[#714B67] dark:text-white mb-4 block">EmPay</span>
            <p className="text-slate-500 dark:text-slate-400 font-body-md mt-sm">© 2024 EmPay HRMS. Humanizing HR, one click at a time.</p>
          </div>
          <div className="col-span-1 flex flex-col gap-sm">
            <Link className="text-slate-500 dark:text-slate-400 hover:text-[#714B67] hover:underline decoration-[#714B67] decoration-2 underline-offset-4 transition-all duration-300 py-1" href="#">Privacy Policy</Link>
            <Link className="text-slate-500 dark:text-slate-400 hover:text-[#714B67] hover:underline decoration-[#714B67] decoration-2 underline-offset-4 transition-all duration-300 py-1" href="#">Terms of Service</Link>
          </div>
          <div className="col-span-1 flex flex-col gap-sm">
            <Link className="text-slate-500 dark:text-slate-400 hover:text-[#714B67] hover:underline decoration-[#714B67] decoration-2 underline-offset-4 transition-all duration-300 py-1" href="#">Contact Us</Link>
            <Link className="text-slate-500 dark:text-slate-400 hover:text-[#714B67] hover:underline decoration-[#714B67] decoration-2 underline-offset-4 transition-all duration-300 py-1" href="#">Careers</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
