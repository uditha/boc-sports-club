"use client";

import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";

interface Props {
  userName: string;
}

export default function Topbar({ userName }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-60 right-0 h-16 bg-white border-b border-purple-100 flex items-center justify-between px-6 z-20">
      {/* Search */}
      <div className="relative w-80">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-grey"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search players, events…"
          className="w-full pl-9 pr-4 py-2 text-sm bg-brand-bg rounded-xl border border-transparent focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand text-text-dark placeholder-text-grey"
        />
      </div>

      {/* User dropdown */}
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-brand-bg transition-colors"
        >
          <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center shrink-0">
            <span className="text-sm font-semibold text-white">{initials}</span>
          </div>
          <span className="hidden sm:block text-sm font-medium text-text-dark">{userName}</span>
          <svg
            className={`hidden sm:block w-4 h-4 text-text-grey transition-transform ${open ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl border border-purple-100 shadow-lg shadow-purple-100/50 overflow-hidden">
            <div className="px-4 py-3 border-b border-purple-50">
              <p className="text-sm font-semibold text-text-dark truncate">{userName}</p>
              <p className="text-xs text-text-grey mt-0.5">Logged in</p>
            </div>
            <div className="p-1.5">
              <Link
                href="/settings?tab=account"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm text-text-dark hover:bg-brand-bg hover:text-brand transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Change Password
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
