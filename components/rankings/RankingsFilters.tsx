"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const PERIODS = [
  { value: "this_year", label: "This Year" },
  { value: "last_year", label: "Last Year" },
  { value: "last_2_years", label: "Last 2 Years" },
  { value: "last_3_years", label: "Last 3 Years" },
  { value: "all_time", label: "All Time" },
];

const TOP_N = [
  { value: "10", label: "Top 10" },
  { value: "25", label: "Top 25" },
  { value: "50", label: "Top 50" },
  { value: "", label: "All" },
];

export default function RankingsFilters({ sports }: { sports: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const update = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  const period = searchParams.get("period") ?? "this_year";
  const topN = searchParams.get("topN") ?? "25";

  return (
    <div className="bg-white rounded-2xl border border-purple-100 p-4 space-y-4">
      {/* Period pills */}
      <div>
        <p className="text-xs font-medium text-text-grey uppercase tracking-wide mb-2">Time Period</p>
        <div className="flex flex-wrap gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => update("period", p.value)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
                period === p.value
                  ? "bg-brand text-white border-brand"
                  : "bg-brand-bg text-text-grey border-purple-200 hover:border-brand"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Row 2: Sport, Gender, Active, Top N */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={searchParams.get("sport") ?? ""}
          onChange={(e) => update("sport", e.target.value)}
          className="px-3 py-2 text-sm rounded-xl border border-purple-200 bg-brand-bg focus:outline-none focus:ring-2 focus:ring-brand text-text-dark"
        >
          <option value="">All Sports</option>
          {sports.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <select
          value={searchParams.get("gender") ?? ""}
          onChange={(e) => update("gender", e.target.value)}
          className="px-3 py-2 text-sm rounded-xl border border-purple-200 bg-brand-bg focus:outline-none focus:ring-2 focus:ring-brand text-text-dark"
        >
          <option value="">All Genders</option>
          <option value="M">Male</option>
          <option value="F">Female</option>
        </select>

        <label className="flex items-center gap-2 text-sm text-text-grey cursor-pointer select-none">
          <input
            type="checkbox"
            defaultChecked={searchParams.get("all") !== "1"}
            onChange={(e) => update("all", e.target.checked ? "" : "1")}
            className="w-4 h-4 rounded accent-brand"
          />
          Active players only
        </label>

        <div className="ml-auto flex items-center gap-2">
          <p className="text-xs text-text-grey font-medium">Show:</p>
          {TOP_N.map((n) => (
            <button
              key={n.value}
              onClick={() => update("topN", n.value)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
                topN === n.value || (!topN && n.value === "")
                  ? "bg-brand text-white border-brand"
                  : "bg-brand-bg text-text-grey border-purple-200 hover:border-brand"
              }`}
            >
              {n.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
