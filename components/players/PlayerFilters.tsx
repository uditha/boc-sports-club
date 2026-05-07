"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect } from "react";

export default function PlayerFilters({ sports }: { sports: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Controlled local state for the search box — debounced before pushing to URL
  const [searchValue, setSearchValue] = useState(searchParams.get("q") ?? "");

  // Keep local value in sync if the URL changes externally (e.g. back/forward)
  useEffect(() => {
    setSearchValue(searchParams.get("q") ?? "");
  }, [searchParams]);

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  // Debounce: only push search to URL 350ms after the user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      const current = searchParams.get("q") ?? "";
      if (searchValue !== current) {
        updateParam("q", searchValue);
      }
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Search */}
      <div className="relative flex-1 min-w-48">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-grey" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Search by name, ID, branch…"
          className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-purple-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand"
        />
        {searchValue && (
          <button
            onClick={() => setSearchValue("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-grey hover:text-text-dark"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Sport filter */}
      <select
        value={searchParams.get("sport") ?? ""}
        onChange={(e) => updateParam("sport", e.target.value)}
        className="px-3 py-2 text-sm rounded-xl border border-purple-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand text-text-dark"
      >
        <option value="">All Sports</option>
        {sports.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>

      {/* Include inactive */}
      <label className="flex items-center gap-2 text-sm text-text-grey cursor-pointer select-none">
        <input
          type="checkbox"
          checked={searchParams.get("inactive") === "1"}
          onChange={(e) => updateParam("inactive", e.target.checked ? "1" : "")}
          className="w-4 h-4 rounded accent-brand"
        />
        Include inactive
      </label>
    </div>
  );
}
