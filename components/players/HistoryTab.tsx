"use client";

import { useState } from "react";
import Link from "next/link";
import { EVENT_TYPE_LABELS, PLACE_LABELS, type EventType, type Place } from "@/lib/marks";
import type { PlayerHistoryRow } from "@/app/actions/player-stats";

const PLACE_STYLES: Record<string, string> = {
  "1": "bg-yellow-50 text-yellow-700 border-yellow-200",
  "2": "bg-gray-100 text-gray-600 border-gray-200",
  "3": "bg-amber-50 text-amber-600 border-amber-200",
  participated: "bg-brand-bg text-brand border-brand/20",
};

interface Props {
  history: PlayerHistoryRow[];
}

export default function HistoryTab({ history }: Props) {
  const years = Array.from(new Set(history.map((r) => r.eventYear))).sort((a, b) => b - a);
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);

  const filtered = selectedYear ? history.filter((r) => r.eventYear === selectedYear) : history;

  if (history.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-purple-100 py-16 text-center">
        <p className="text-text-dark font-semibold">No events recorded yet</p>
        <p className="text-text-grey text-sm mt-1">Results will appear here once this player is added to an event.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Year filter */}
      {years.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedYear(undefined)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${!selectedYear ? "bg-brand text-white border-brand" : "bg-white text-text-grey border-purple-200 hover:border-brand"}`}
          >
            All Years
          </button>
          {years.map((y) => (
            <button
              key={y}
              onClick={() => setSelectedYear(y)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${selectedYear === y ? "bg-brand text-white border-brand" : "bg-white text-text-grey border-purple-200 hover:border-brand"}`}
            >
              {y}
            </button>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-purple-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-purple-100">
              <th className="text-left py-3 px-4 text-text-grey font-medium">Event</th>
              <th className="text-left py-3 px-4 text-text-grey font-medium">Date</th>
              <th className="text-left py-3 px-4 text-text-grey font-medium">Place</th>
              <th className="text-left py-3 px-4 text-text-grey font-medium">Achievements</th>
              <th className="text-right py-3 px-4 text-text-grey font-medium">Marks</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.resultId} className="border-b border-purple-50 hover:bg-brand-bg/50 transition-colors">
                <td className="py-3 px-4">
                  <Link href={`/events/${r.eventId}`} className="hover:text-brand transition-colors">
                    <p className="font-medium text-text-dark">{r.eventName}</p>
                    <p className="text-xs text-text-grey">{EVENT_TYPE_LABELS[r.eventType as EventType]}</p>
                  </Link>
                </td>
                <td className="py-3 px-4 text-text-grey text-xs whitespace-nowrap">
                  {new Date(r.eventDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${PLACE_STYLES[r.place] ?? ""}`}>
                    {PLACE_LABELS[r.place as Place]}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-1.5 flex-wrap">
                    {r.bestAthlete && (
                      <span className="px-2 py-0.5 rounded-full bg-brand-teal/10 text-brand-teal text-xs font-medium border border-brand-teal/30">Best Athlete</span>
                    )}
                    {r.meetRecord && (
                      <span className="px-2 py-0.5 rounded-full bg-brand-pink/10 text-brand-pink text-xs font-medium border border-brand-pink/30">Meet Record</span>
                    )}
                    {!r.bestAthlete && !r.meetRecord && <span className="text-text-grey text-xs">—</span>}
                  </div>
                </td>
                <td className="py-3 px-4 text-right font-bold text-brand">{r.marksAwarded}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-text-grey px-4 py-3">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</p>
      </div>
    </div>
  );
}
