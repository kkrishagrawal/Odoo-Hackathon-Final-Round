"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAttendance } from "@/components/attendance/AttendanceContext";
import { useAuth, getRolePath } from "@/components/auth/AuthContext";

function TopBarContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isCheckedIn, isPaused, checkInTime, elapsedTime, handleCheckIn, handleCheckOut, handlePause, handleUnpause } = useAttendance();
  const { user, logout } = useAuth();

  const [showStatusPopup, setShowStatusPopup] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState(searchParams?.get("q") || "");

  // Update URL on search change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!searchParams) return;
      
      const params = new URLSearchParams(searchParams.toString());
      if (searchTerm) {
        params.set("q", searchTerm);
      } else {
        params.delete("q");
      }
      
      if (params.toString() !== searchParams.toString()) {
        router.push(`${pathname}?${params.toString()}`);
      }
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm, pathname, router, searchParams]);

  const onCheckIn = () => {
    handleCheckIn();
    setShowStatusPopup(false);
  };

  const onCheckOut = () => {
    handleCheckOut();
    setShowStatusPopup(false);
  };

  const onPause = () => {
    handlePause();
  };

  const onUnpause = () => {
    handleUnpause();
  };

  const handleLogout = async () => {
    setShowProfilePopup(false);
    await logout();
  };

  // Determine profile route based on the current role path
  const rolePath = pathname?.split('/')[1] || "employee";
  const profileLink = `/${rolePath}/profile`;

  // User initials for avatar
  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "??";

  return (
    <div className="h-20 border-b border-outline-variant/20 bg-surface-container-lowest flex items-center justify-between px-8 shrink-0 z-40 relative">
      {/* Search */}
      <div className="flex-1 max-w-2xl relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search employees, roles..." 
          className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant/30 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent text-body-md text-on-surface"
        />
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-6">
        {/* Status indicator / Check In-Out */}
        <div className="relative">
          <button 
            onClick={() => {
              setShowStatusPopup(!showStatusPopup);
              setShowProfilePopup(false);
            }}
            className={`w-5 h-5 rounded-full shadow-sm border-2 border-white transition-colors flex items-center justify-center ${
              isCheckedIn ? (isPaused ? 'bg-yellow-500 animate-pulse' : 'bg-green-500') : 'bg-red-500'
            }`}
          />
          
          {showStatusPopup && (
            <div className="absolute top-10 right-0 w-72 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-[0_8px_30px_rgba(113,75,103,0.12)] p-4 z-50">
              {!isCheckedIn ? (
                <button 
                  onClick={onCheckIn}
                  className="w-full flex items-center justify-between bg-primary-container text-white px-4 py-3 rounded-lg font-label-md hover:bg-[#5A3C53] transition-colors"
                >
                  Check IN <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="text-center bg-surface-container-low p-3 rounded-lg border border-outline-variant/20">
                    <p className="text-caption text-outline mb-1">Since {checkInTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className={`font-h3 font-bold tracking-wider ${isPaused ? 'text-yellow-600' : 'text-primary-container'}`}>{elapsedTime}</p>
                    {isPaused && <p className="text-xs text-yellow-600 font-medium mt-1">⏸ PAUSED</p>}
                  </div>
                  
                  {/* Pause / Resume button */}
                  {isPaused ? (
                    <button 
                      onClick={onUnpause}
                      className="w-full flex items-center justify-between bg-green-500 text-white px-4 py-3 rounded-lg font-label-md hover:bg-green-600 transition-colors"
                    >
                      Resume <span className="material-symbols-outlined text-sm">play_arrow</span>
                    </button>
                  ) : (
                    <button 
                      onClick={onPause}
                      className="w-full flex items-center justify-between bg-yellow-500 text-white px-4 py-3 rounded-lg font-label-md hover:bg-yellow-600 transition-colors"
                    >
                      Pause <span className="material-symbols-outlined text-sm">pause</span>
                    </button>
                  )}

                  <button 
                    onClick={onCheckOut}
                    className="w-full flex items-center justify-between bg-error text-white px-4 py-3 rounded-lg font-label-md hover:bg-error/90 transition-colors"
                  >
                    Check Out <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile Avatar */}
        <div className="relative">
          <button 
            onClick={() => {
              setShowProfilePopup(!showProfilePopup);
              setShowStatusPopup(false);
            }}
            className="w-10 h-10 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold overflow-hidden border border-outline-variant/30 hover:opacity-90 transition-opacity text-sm"
          >
            {user?.profilePicUrl ? (
              <img src={user.profilePicUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </button>

          {showProfilePopup && (
            <div className="absolute top-12 right-0 w-56 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-[0_8px_30px_rgba(113,75,103,0.12)] py-2 z-50">
              {/* User info header */}
              {user && (
                <div className="px-4 py-2.5 border-b border-outline-variant/20">
                  <p className="font-semibold text-on-surface text-sm truncate">{user.name}</p>
                  <p className="text-xs text-on-surface-variant truncate">{user.email}</p>
                  <p className="text-xs text-[#A463B0] font-medium mt-0.5">{user.role.replace("_", " ")}</p>
                </div>
              )}
              <Link 
                href={profileLink} 
                onClick={() => setShowProfilePopup(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-body-md text-on-surface hover:bg-surface-container-low transition-colors"
              >
                <span className="material-symbols-outlined text-outline">person</span>
                My Profile
              </Link>
              <hr className="my-1 border-outline-variant/20" />
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-body-md text-error hover:bg-error/10 transition-colors"
              >
                <span className="material-symbols-outlined">logout</span>
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TopBar() {
  return (
    <Suspense fallback={
      <div className="h-20 border-b border-outline-variant/20 bg-surface-container-lowest flex items-center justify-between px-8 shrink-0 z-40 relative">
        <div className="flex-1 max-w-2xl relative">
          <div className="w-full h-10 bg-surface-container-low rounded-full animate-pulse" />
        </div>
      </div>
    }>
      <TopBarContent />
    </Suspense>
  );
}
