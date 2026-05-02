"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import Link from "next/link";
import { useCompanyLogo } from "@/components/company-logo-provider";
import Head from "next/head";

// We need to register plugins to avoid errors
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
}

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const rolesRef = useRef<HTMLDivElement>(null);
  const glossaryRef = useRef<HTMLDivElement>(null);
  const showcaseRef = useRef<HTMLDivElement>(null);
  const showcaseWrapperRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Smooth scrolling using GSAP ScrollToPlugin for nav links
    const links = document.querySelectorAll('nav a[href^="#"]');
    const handleSmoothScroll = function (this: HTMLAnchorElement, e: Event) {
      e.preventDefault();
      const targetId = this.getAttribute("href");
      if (targetId && targetId !== "#") {
        gsap.to(window, { duration: 1, scrollTo: targetId, ease: "power3.inOut" });
      }
    };
    links.forEach(link => {
      link.addEventListener("click", handleSmoothScroll);
    });

    // Hero Animations
    const heroCtx = gsap.context(() => {
      gsap.fromTo(
        ".hero-text",
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, stagger: 0.2, ease: "power3.out" }
      );
      gsap.fromTo(
        ".hero-blob",
        { opacity: 0, scale: 0.8 },
        { opacity: 0.2, scale: 1, duration: 2, delay: 0.5, ease: "power2.out" }
      );
      gsap.fromTo(
        ".hero-mockup",
        { y: 100, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, delay: 0.4, ease: "power3.out" }
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
          }
        }
      );
    }, featuresRef);

    // Roles Animations
    const rolesCtx = gsap.context(() => {
      gsap.fromTo(
        ".role-card",
        { x: -50, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: rolesRef.current,
            start: "top 75%",
          }
        }
      );
    }, rolesRef);

    // Glossary Animations
    const glossaryCtx = gsap.context(() => {
      gsap.fromTo(
        ".glossary-item",
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: glossaryRef.current,
            start: "top 80%",
          }
        }
      );
    }, glossaryRef);

    // Showcase Animations (Vertical Overlap Scroll)
    const showcaseCtx = gsap.context(() => {
      const panels = gsap.utils.toArray<HTMLElement>('.showcase-panel');
      if (panels.length === 0) return;

      gsap.set(panels, { opacity: 0, y: 50, zIndex: (i, target, targets) => targets.length - i });
      gsap.set(panels[0], { opacity: 1, y: 0 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: showcaseRef.current,
          pin: true,
          scrub: 1,
          start: "top top",
          end: () => "+=" + (window.innerHeight * panels.length * 1.5)
        }
      });

      panels.forEach((panel, i) => {
        if (i === 0) {
          tl.to({}, { duration: 0.5 }); // pause for the first panel
          return;
        }

        tl.to(panels[i - 1], { opacity: 0, y: -50, duration: 1 }, "transition" + i);
        tl.to(panel, { opacity: 1, y: 0, duration: 1 }, "transition" + i);
        tl.to({}, { duration: 0.5 }); // pause for user to read
      });
    }, showcaseRef);

    // Header Hide/Show Bubbly Animation
    const headerCtx = gsap.context(() => {
      let isHidden = false;
      ScrollTrigger.create({
        start: "top -100", // Start after scrolling 100px down
        end: 99999, // practically forever
        onUpdate: (self) => {
          if (self.direction === 1 && !isHidden) {
            // Scrolling down -> hide with bubbly shrink
            isHidden = true;
            gsap.to(headerRef.current, {
              y: -80,
              scale: 0.8,
              opacity: 0,
              duration: 0.4,
              ease: "back.in(2)",
            });
          } else if (self.direction === -1 && isHidden) {
            // Scrolling up -> show with bubbly bounce
            isHidden = false;
            gsap.to(headerRef.current, {
              y: 0,
              scale: 1,
              opacity: 1,
              duration: 0.8,
              ease: "elastic.out(1.2, 0.6)",
            });
          }
        }
      });
    }, headerRef);

    return () => {
      heroCtx.revert();
      featuresCtx.revert();
      rolesCtx.revert();
      glossaryCtx.revert();
      showcaseCtx.revert();
      headerCtx.revert();
      links.forEach(link => {
        link.removeEventListener("click", handleSmoothScroll);
      });
    };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Reenie+Beanie&display=swap');
        
        .font-outfit { font-family: 'Outfit', sans-serif; }
        .font-reenie { font-family: 'Reenie Beanie', cursive; }
        
        /* Persistent SVG Grain Overlay */
        .grain-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: 9999;
            opacity: 0.04;
            background-image: url('data:image/svg+xml;utf8,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noiseFilter)"/%3E%3C/svg%3E');
        }

        .rotate-minus-2 { transform: rotate(-2deg); }
      `}} />

      <div className="bg-[#F7F7F9] text-[#1F2937] font-outfit text-[18px] antialiased relative min-h-screen block scroll-smooth">
        <div className="grain-overlay"></div>

        {/* TopAppBar */}
        <header ref={headerRef} className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-1">
          <nav className="bg-white/70 dark:bg-stone-900/70 backdrop-blur-xl rounded-full mx-auto w-[92%] max-w-4xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] flex items-center justify-between px-8 py-3 border border-outline-variant/30">
            <Link className="text-2xl font-bold text-[#714B67] tracking-tight" href="/">Em<span className="text-[#7e7574]!">Pay</span></Link>
            <div className="flex items-center gap-4">
              <Link href="/login" className="bg-[#714B67] text-white px-6 py-2 rounded-full text-[14px] font-semibold hover:scale-105 hover:opacity-90 transition-all duration-300">
                Get Started
              </Link>
              <Link href="https://www.youtube.com/watch?v=QDia3e12czc" className="text-[#7e7574] hover:text-[#FF0000] transition-all duration-300 hover:scale-110" title="Watch Demo">
                <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 4-8 4z" />
                </svg>
              </Link>
              <Link href="https://github.com/kkrishagrawal/Odoo-Hackathon-Final-Round/" className="hover:scale-105 hover:opacity-90 transition-all duration-300">
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="currentColor" d="M12 .297c-6.628 0-12 5.373-12 12 0 5.252 3.429 9.778 8.205 11.385.6.111.828-.258.828-.577v-2.1c-3.335.734-4.037-1.646-4.037-1.646-.546-1.392-1.334-1.768-1.334-1.768-1.09-.744.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.223.694.825.576C20.566 22.045 24 17.522 24 12.297 24 5.373 18.628.297 12 .297z" />
                </svg>
              </Link>
            </div>
          </nav>
        </header>

        <main className="flex flex-col items-center w-full max-w-[1440px] mx-auto px-4 md:px-8">

          {/* Hero Section */}
          <section ref={heroRef} id="hero" className="w-full min-h-[921px] flex flex-col items-center justify-center pt-32 pb-32 relative overflow-hidden">
            {/* Blurred Blobs */}
            <div className="hero-blob absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#F2A93B] rounded-full blur-3xl mix-blend-multiply -z-10 animate-[pulse_8s_ease-in-out_infinite]"></div>
            <div className="hero-blob absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-[#2EB3E6] rounded-full blur-3xl mix-blend-multiply -z-10 animate-[pulse_10s_ease-in-out_infinite]"></div>

            <div className="text-center mt-36 max-w-4xl z-10 flex flex-col items-center gap-8">
              <h1 className="hero-text text-[80px] font-semibold leading-[1.0] tracking-[-0.03em] text-[#1F2937]">
                Simplifying HRMS <br />
                <span className="font-reenie text-[#F2A93B] transform inline-block rotate-minus-2 text-6xl mt-4">for Smarter Workplaces</span>
              </h1>
              <p className="hero-text text-[18px] leading-[1.6] text-[#1F2937]/70 max-w-2xl mx-auto">
                Empowering organizations to build a seamless, secure, and intuitive HR ecosystem that centralizes payroll, attendance, and role management.
              </p>
              <div className="hero-text flex flex-col sm:flex-row items-center justify-center gap-4 mt-4 w-full sm:w-auto">
                <Link href="/login" className="bg-[#714B67] text-white px-8 py-4 rounded-full text-[14px] font-semibold hover:scale-[1.02] transition-transform shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] w-full sm:w-auto text-center">
                  Start your journey
                </Link>
                <a href="#features" className="bg-white text-[#1F2937] border border-[#d1c3ca] px-8 py-4 rounded-full text-[14px] font-semibold hover:scale-[1.02] transition-transform w-full sm:w-auto text-center">
                  Explore features
                </a>
              </div>
            </div>

            {/* High Fidelity Mockup Container */}
            <div className="hero-mockup mt-64 w-full max-w-6xl rounded-[2rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] relative overflow-hidden border border-[#d1c3ca]/30">
              <img src="/employee-mobile.jpg" alt="EmPay Mobile Mockup" className="block md:hidden w-full h-auto object-cover" />
              <img src="/employeestatus.png" alt="EmPay Dashboard Mockup" className="hidden md:block w-full h-auto object-cover" />
              <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-[2rem]"></div>
            </div>
          </section>

          {/* Features Section */}
          <section ref={featuresRef} className="w-full py-24 flex flex-col items-center" id="features">
            <h2 className="text-[48px] font-medium tracking-tight text-[#1F2937] mb-16 text-center">Core Modules</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
              {/* Feature 1 */}
              <div className="feature-card bg-white p-10 rounded-2xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.05)] flex flex-col gap-6 border border-[#d1c3ca]/30 hover:shadow-[0_12px_40px_-4px_rgba(113,75,103,0.1)] transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-[#714B67]/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#714B67] text-3xl">manage_accounts</span>
                </div>
                <div>
                  <h3 className="text-2xl font-medium text-[#1F2937] mb-3">User &amp; Role Management</h3>
                  <p className="text-base text-[#1F2937]/70 leading-relaxed">Secure, role-based access control for Admins, Employees, HR, and Payroll Officers. Ensure the right people have the right access.</p>
                </div>
              </div>
              {/* Feature 2 */}
              <div className="feature-card bg-white p-10 rounded-2xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.05)] flex flex-col gap-6 border border-[#d1c3ca]/30 hover:shadow-[0_12px_40px_-4px_rgba(242,169,59,0.1)] transition-all duration-300 transform md:-translate-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[#F2A93B]/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#F2A93B] text-3xl">event_available</span>
                </div>
                <div>
                  <h3 className="text-2xl font-medium text-[#1F2937] mb-3">Attendance &amp; Leave</h3>
                  <p className="text-base text-[#1F2937]/70 leading-relaxed">Streamlined workflows for leave requests, automated attendance logging, and transparent tracking for both employees and managers.</p>
                </div>
              </div>
              {/* Feature 3 */}
              <div className="feature-card bg-white p-10 rounded-2xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.05)] flex flex-col gap-6 border border-[#d1c3ca]/30 hover:shadow-[0_12px_40px_-4px_rgba(46,179,230,0.1)] transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-[#2EB3E6]/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#2EB3E6] text-3xl">payments</span>
                </div>
                <div>
                  <h3 className="text-2xl font-medium text-[#1F2937] mb-3">Payroll &amp; Analytics</h3>
                  <p className="text-base text-[#1F2937]/70 leading-relaxed">Automated payruns, detailed payslips, accurate PF/Tax calculations, and comprehensive analytics for data-driven decisions.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Role Breakdown Section */}
          <section ref={rolesRef} className="w-full py-24 bg-[#714B67]/5 flex flex-col items-center rounded-3xl my-12" id="roles">
            <div className="max-w-6xl w-full px-8">
              <div className="text-center mb-16">
                <h2 className="text-[48px] font-medium text-[#1F2937] mb-4">Empowering Every Role</h2>
                <p className="text-lg text-[#1F2937]/70 max-w-2xl mx-auto">Tailored interfaces and permissions designed specifically for the unique needs of your team.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="role-card bg-white p-8 rounded-2xl border border-stone-200 flex gap-6 items-start">
                  <div className="p-4 bg-stone-100 rounded-xl text-[#714B67]">
                    <span className="material-symbols-outlined text-3xl">admin_panel_settings</span>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-2">System Admin</h4>
                    <p className="text-[#1F2937]/70 text-base">Full system oversight. Manages global settings, permissions, and ensures overall platform security and configuration.</p>
                  </div>
                </div>
                <div className="role-card bg-white p-8 rounded-2xl border border-stone-200 flex gap-6 items-start">
                  <div className="p-4 bg-stone-100 rounded-xl text-[#F2A93B]">
                    <span className="material-symbols-outlined text-3xl">groups</span>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-2">HR Manager</h4>
                    <p className="text-[#1F2937]/70 text-base">Handles employee lifecycle, leave approvals, policy enforcement, and general workforce management workflows.</p>
                  </div>
                </div>
                <div className="role-card bg-white p-8 rounded-2xl border border-stone-200 flex gap-6 items-start">
                  <div className="p-4 bg-stone-100 rounded-xl text-[#2EB3E6]">
                    <span className="material-symbols-outlined text-3xl">account_balance</span>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-2">Payroll Officer</h4>
                    <p className="text-[#1F2937]/70 text-base">Executes payruns, manages tax compliance, handles PF calculations, and generates financial reporting.</p>
                  </div>
                </div>
                <div className="role-card bg-white p-8 rounded-2xl border border-stone-200 flex gap-6 items-start">
                  <div className="p-4 bg-stone-100 rounded-xl text-stone-600">
                    <span className="material-symbols-outlined text-3xl">person</span>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-2">Employee</h4>
                    <p className="text-[#1F2937]/70 text-base">Self-service portal to view payslips, request leave, log attendance, and manage personal information.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Showcase Section */}
        <section ref={showcaseRef} className="w-full h-screen bg-[#1F2937] text-white flex items-center overflow-hidden relative" id="showcase">
          <div ref={showcaseWrapperRef} className="relative w-full h-full">
            {/* Panel 1 */}
            <div className="showcase-panel absolute inset-0 w-full h-full flex flex-col md:flex-row items-center justify-center">
              <div className="absolute top-12 left-8 md:top-14 md:left-20 max-w-2xl z-10">
                <h2 className="text-[48px] md:text-[64px] font-bold mb-4 leading-tight drop-shadow-lg">User Creation</h2>
                <p className="text-[18px] md:text-[20px] text-white/90 leading-relaxed drop-shadow-md">Seamlessly onboard new employees and define role-based access controls instantly with our intuitive admin interface.</p>
              </div>
              <div className="w-[90%] md:w-[65%] h-[65%] md:h-[70%] md:translate-x-48 md:translate-y-24">
                <img src="/usercreation.png" alt="User Creation" className="w-full h-full object-cover object-left-top rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-white/10" />
              </div>
            </div>
            
            {/* Panel 2 */}
            <div className="showcase-panel absolute inset-0 w-full h-full flex flex-col md:flex-row items-center justify-center">
              <div className="absolute top-12 left-8 md:top-14 md:left-20 max-w-2xl z-10">
                <h2 className="text-[48px] md:text-[64px] font-bold mb-4 leading-tight drop-shadow-lg">Attendance Tracking</h2>
                <p className="text-[18px] md:text-[20px] text-white/90 leading-relaxed drop-shadow-md">Monitor daily check-ins, active work hours, and overtime dynamically across your entire organization.</p>
              </div>
              <div className="w-[90%] md:w-[65%] h-[65%] md:h-[70%] md:translate-x-48 md:translate-y-24">
                <img src="/attendance.png" alt="Attendance Tracking" className="w-full h-full object-cover object-left-top rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-white/10" />
              </div>
            </div>
            
            {/* Panel 3 */}
            <div className="showcase-panel absolute inset-0 w-full h-full flex flex-col md:flex-row items-center justify-center">
              <div className="absolute top-12 left-8 md:top-14 md:left-20 max-w-2xl z-10">
                <h2 className="text-[48px] md:text-[64px] font-bold mb-4 leading-tight drop-shadow-lg">Time Off Management</h2>
                <p className="text-[18px] md:text-[20px] text-white/90 leading-relaxed drop-shadow-md">Handle leave requests efficiently with hierarchical approvals, real-time status updates, and balance tracking.</p>
              </div>
              <div className="w-[90%] md:w-[65%] h-[65%] md:h-[70%] md:translate-x-48 md:translate-y-24">
                <img src="/timeoff.png" alt="Time Off Management" className="w-full h-full object-cover object-left-top rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-white/10" />
              </div>
            </div>
            
            {/* Panel 4 */}
            <div className="showcase-panel absolute inset-0 w-full h-full flex flex-col md:flex-row items-center justify-center">
              <div className="absolute top-12 left-8 md:top-14 md:left-20 max-w-2xl z-10">
                <h2 className="text-[48px] md:text-[64px] font-bold mb-4 leading-tight drop-shadow-lg">Payroll Processing</h2>
                <p className="text-[18px] md:text-[20px] text-white/90 leading-relaxed drop-shadow-md">Automate salary, tax, and provident fund calculations seamlessly, turning payday into a one-click process.</p>
              </div>
              <div className="w-[90%] md:w-[65%] h-[65%] md:h-[70%] md:translate-x-48 md:translate-y-24">
                <img src="/payroll.png" alt="Payroll Processing" className="w-full h-full object-cover object-left-top rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-white/10" />
              </div>
            </div>

            {/* Panel 5 */}
            <div className="showcase-panel absolute inset-0 w-full h-full flex flex-col md:flex-row items-center justify-center">
              <div className="absolute top-12 left-8 md:top-14 md:left-20 max-w-2xl z-10">
                <h2 className="text-[48px] md:text-[64px] font-bold mb-4 leading-tight drop-shadow-lg">Employee Status</h2>
                <p className="text-[18px] md:text-[20px] text-white/90 leading-relaxed drop-shadow-md">Get a quick overview of employee stats and comprehensive profile details instantly through unified dashboards.</p>
              </div>
              <div className="w-[90%] md:w-[65%] h-[65%] md:h-[70%] md:translate-x-48 md:translate-y-24">
                <img src="/employeestatus.png" alt="Employee Status" className="w-full h-full object-cover object-left-top rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-white/10" />
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full bg-[#F7F7F9] pt-24 pb-12 border-t border-stone-200 flex flex-col items-center gap-6 px-8 text-center mt-auto z-10 relative">
          <div className="flex gap-6 mb-4">
            <a className="text-[12px] uppercase tracking-[0.1em] text-[#1F2937]/50 hover:text-[#714B67] transition-colors duration-200 font-semibold" href="#">Privacy Policy</a>
            <a className="text-[12px] uppercase tracking-[0.1em] text-[#1F2937]/50 hover:text-[#714B67] transition-colors duration-200 font-semibold" href="#">Terms of Service</a>
            <a className="text-[12px] uppercase tracking-[0.1em] text-[#1F2937]/50 hover:text-[#714B67] transition-colors duration-200 font-semibold" href="#">Support</a>
          </div>
          <p className="text-[12px] uppercase tracking-[0.1em] text-[#1F2937]/40 font-semibold">
            © 2024 EmPay. Smart HR for Modern Teams.
          </p>
        </footer>
      </div>
    </>
  );
}
