"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { globalSearch, type SearchResult } from "@/app/actions/search";

interface Props {
  userName: string;
}

export default function Topbar({ userName }: Props) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);

  // Search state
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Close user dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Close search dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const runSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setSearchOpen(false);
      return;
    }
    setSearching(true);
    try {
      const res = await globalSearch(q);
      setResults(res);
      setSearchOpen(true);
      setActiveIndex(-1);
    } finally {
      setSearching(false);
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(val), 300);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!searchOpen || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      const target = results[activeIndex];
      if (target) navigate(target.href);
    } else if (e.key === "Escape") {
      setSearchOpen(false);
      inputRef.current?.blur();
    }
  }

  function navigate(href: string) {
    setQuery("");
    setResults([]);
    setSearchOpen(false);
    router.push(href);
  }

  function clearSearch() {
    setQuery("");
    setResults([]);
    setSearchOpen(false);
    inputRef.current?.focus();
  }

  return (
    <header className="fixed top-0 left-60 right-0 h-16 bg-white border-b border-purple-100 flex items-center justify-between px-6 z-20">

      {/* Search */}
      <div className="relative w-80" ref={searchRef}>
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-grey pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (results.length > 0) setSearchOpen(true); }}
          placeholder="Search players, events…"
          className="w-full pl-9 pr-8 py-2 text-sm bg-brand-bg rounded-xl border border-transparent focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand text-text-dark placeholder-text-grey"
        />

        {/* Spinner / clear */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {searching ? (
            <svg className="w-3.5 h-3.5 text-brand animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : query ? (
            <button onClick={clearSearch} className="text-text-grey hover:text-text-dark transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : null}
        </div>

        {/* Results dropdown */}
        {searchOpen && (
          <div className="absolute top-full mt-2 left-0 w-full bg-white rounded-2xl border border-purple-100 shadow-lg shadow-purple-100/50 overflow-hidden z-50">
            {results.length === 0 ? (
              <p className="text-sm text-text-grey text-center py-4">No results for &quot;{query}&quot;</p>
            ) : (
              <div>
                {/* Group: Players */}
                {results.filter((r) => r.type === "player").length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-text-grey uppercase tracking-wide px-4 pt-3 pb-1">Players</p>
                    {results.filter((r) => r.type === "player").map((r, i) => {
                      const idx = results.indexOf(r);
                      return (
                        <button
                          key={r.id}
                          onClick={() => navigate(r.href)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${activeIndex === idx ? "bg-brand/10" : "hover:bg-brand-bg"}`}
                        >
                          <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-white">{r.title.split(" ").map((n) => n[0]).slice(0, 2).join("")}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-text-dark truncate">{r.title}</p>
                            <p className="text-xs text-text-grey truncate">{r.subtitle}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Group: Events */}
                {results.filter((r) => r.type === "event").length > 0 && (
                  <div className={results.filter((r) => r.type === "player").length > 0 ? "border-t border-purple-50" : ""}>
                    <p className="text-xs font-semibold text-text-grey uppercase tracking-wide px-4 pt-3 pb-1">Events</p>
                    {results.filter((r) => r.type === "event").map((r) => {
                      const idx = results.indexOf(r);
                      return (
                        <button
                          key={r.id}
                          onClick={() => navigate(r.href)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${activeIndex === idx ? "bg-brand/10" : "hover:bg-brand-bg"}`}
                        >
                          <div className="w-7 h-7 rounded-lg bg-brand-bg border border-purple-200 flex items-center justify-center shrink-0">
                            <svg className="w-3.5 h-3.5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-text-dark truncate">{r.title}</p>
                            <p className="text-xs text-text-grey">{r.subtitle}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="px-4 py-2 border-t border-purple-50">
                  <p className="text-xs text-text-grey">↑↓ navigate · Enter to open · Esc to close</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* User dropdown */}
      <div className="relative" ref={userRef}>
        <button
          onClick={() => setDropdownOpen((v) => !v)}
          className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-brand-bg transition-colors"
        >
          <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center shrink-0">
            <span className="text-sm font-semibold text-white">{initials}</span>
          </div>
          <span className="hidden sm:block text-sm font-medium text-text-dark">{userName}</span>
          <svg className={`hidden sm:block w-4 h-4 text-text-grey transition-transform ${dropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl border border-purple-100 shadow-lg shadow-purple-100/50 overflow-hidden">
            <div className="px-4 py-3 border-b border-purple-50">
              <p className="text-sm font-semibold text-text-dark truncate">{userName}</p>
              <p className="text-xs text-text-grey mt-0.5">Logged in</p>
            </div>
            <div className="p-1.5">
              <Link href="/settings?tab=account" onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm text-text-dark hover:bg-brand-bg hover:text-brand transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Change Password
              </Link>
              <button onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
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
