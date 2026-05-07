"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { RankingRow } from "@/app/actions/rankings";

function TrendArrow({ trend }: { trend: "up" | "down" | "flat" }) {
  if (trend === "up") return (
    <span className="flex items-center gap-0.5 text-brand-teal text-xs font-medium">
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
      </svg>
      Up
    </span>
  );
  if (trend === "down") return (
    <span className="flex items-center gap-0.5 text-brand-pink text-xs font-medium">
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
      </svg>
      Down
    </span>
  );
  return <span className="text-text-grey text-xs">—</span>;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-brand-lavender flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-bold text-white">{rank}</span>
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-medium text-text-grey">{rank}</span>
    </div>
  );
}

interface Props {
  rows: RankingRow[];
  searchParams: string;
}

export default function RankingsTable({ rows, searchParams }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 4) next.add(id);
      return next;
    });
  }

  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-purple-100 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-brand-bg flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-text-dark font-semibold">No ranking data</p>
        <p className="text-text-grey text-sm mt-1">No results found for the selected filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Compare bar */}
      {selected.size >= 2 && (
        <div className="flex items-center justify-between bg-brand/10 border border-brand/20 rounded-2xl px-4 py-3">
          <p className="text-sm font-medium text-brand-dark">
            {selected.size} players selected for comparison
          </p>
          <div className="flex gap-2">
            <button onClick={() => setSelected(new Set())} className="px-3 py-1.5 text-sm text-text-grey hover:text-brand-dark transition-colors">
              Clear
            </button>
            <button
              onClick={() => router.push(`/rankings/compare?ids=${Array.from(selected).join(",")}`)}
              className="px-4 py-1.5 bg-brand hover:bg-brand-dark text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Compare Selected →
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-purple-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-purple-100">
              <th className="py-3 px-4 w-10" />
              <th className="text-left py-3 px-4 text-text-grey font-medium">Rank</th>
              <th className="text-left py-3 px-4 text-text-grey font-medium">Player</th>
              <th className="text-left py-3 px-4 text-text-grey font-medium">Branch</th>
              <th className="text-left py-3 px-4 text-text-grey font-medium">Events</th>
              <th className="text-right py-3 px-4 text-text-grey font-medium">Total Marks</th>
              <th className="text-left py-3 px-4 text-text-grey font-medium">Trend</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.playerId} className={`border-b border-purple-50 transition-colors ${selected.has(row.playerId) ? "bg-brand/5" : "hover:bg-brand-bg/50"}`}>
                <td className="py-3 px-4">
                  <input
                    type="checkbox"
                    checked={selected.has(row.playerId)}
                    onChange={() => toggle(row.playerId)}
                    disabled={!selected.has(row.playerId) && selected.size >= 4}
                    className="w-4 h-4 rounded accent-brand"
                  />
                </td>
                <td className="py-3 px-4">
                  <RankBadge rank={row.rank} />
                </td>
                <td className="py-3 px-4">
                  <Link href={`/players/${row.playerId}`} className="font-medium text-text-dark hover:text-brand transition-colors">
                    {row.playerName}
                  </Link>
                  <p className="text-xs text-text-grey mt-0.5">
                    {row.sport.split(",")[0]}
                    {row.gender === "M" ? " · Male" : " · Female"}
                  </p>
                </td>
                <td className="py-3 px-4 text-text-dark">{row.branch}</td>
                <td className="py-3 px-4 text-text-grey">{row.eventCount}</td>
                <td className="py-3 px-4 text-right">
                  <span className="text-lg font-bold text-brand">{row.totalMarks}</span>
                </td>
                <td className="py-3 px-4">
                  <TrendArrow trend={row.trend} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-text-grey px-4 py-3">{rows.length} player{rows.length !== 1 ? "s" : ""} ranked</p>
      </div>
    </div>
  );
}
