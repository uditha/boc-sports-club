import { requireUser } from "@/lib/auth-helpers";
import { getAnnualReportData } from "@/app/actions/reports";
import { EVENT_TYPE_LABELS, type EventType } from "@/lib/marks";
import AnnualReportExportButton from "@/components/reports/AnnualReportExportButton";

const TYPE_COLORS: Record<string, string> = {
  inter_province: "bg-brand/10 text-brand border-brand/20",
  nationalized: "bg-teal-50 text-teal-700 border-teal-200",
  coaching_camp: "bg-blue-50 text-blue-700 border-blue-200",
  local: "bg-purple-50 text-brand-lavender border-brand-lavender/30",
  international: "bg-pink-50 text-brand-pink border-pink-200",
};

const ACHIEVEMENT_LABELS = {
  best_athlete: { label: "Best Athlete", color: "bg-amber-100 text-amber-700" },
  meet_record: { label: "Meet Record", color: "bg-purple-100 text-brand-lavender" },
  both: { label: "Best Athlete + Record", color: "bg-teal-100 text-teal-700" },
};

interface Props {
  searchParams: Promise<{ year?: string }>;
}

export default async function ReportsPage({ searchParams }: Props) {
  await requireUser();

  const sp = await searchParams;
  const currentYear = new Date().getFullYear();
  const year = Number(sp.year ?? currentYear);

  // Available years: current year back to 2020
  const availableYears = Array.from({ length: currentYear - 2019 }, (_, i) => currentYear - i);

  const data = await getAnnualReportData(year);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Annual Reports</h1>
          <p className="text-text-grey mt-0.5">Generate and download the yearly performance report</p>
        </div>
        <AnnualReportExportButton data={data} />
      </div>

      {/* Year selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-text-grey">Year:</span>
        {availableYears.map(y => (
          <a
            key={y}
            href={`/reports?year=${y}`}
            className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-colors ${
              y === year
                ? "bg-brand text-white shadow-sm"
                : "bg-white border border-purple-100 text-text-grey hover:bg-brand-bg hover:text-brand-dark"
            }`}
          >
            {y}
          </a>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Events Held", value: data.totalEvents, icon: "📅", color: "from-brand to-brand-lavender" },
          { label: "Players Participated", value: data.uniquePlayers, icon: "👥", color: "from-brand-teal to-brand-blue" },
          { label: "Results Recorded", value: data.totalResults, icon: "📋", color: "from-brand-blue to-brand-lavender" },
          { label: "Total Marks", value: data.totalMarks, icon: "🏅", color: "from-amber-400 to-orange-500" },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className={`bg-gradient-to-br ${color} rounded-2xl p-5 text-white`}>
            <p className="text-2xl mb-1">{icon}</p>
            <p className="text-3xl font-bold">{value}</p>
            <p className="text-sm font-medium mt-0.5 opacity-90">{label}</p>
            <p className="text-xs opacity-70 mt-0.5">{year}</p>
          </div>
        ))}
      </div>

      {data.totalEvents === 0 ? (
        <div className="bg-white rounded-2xl border border-purple-100 p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-brand-bg flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="font-semibold text-text-dark">No data for {year}</p>
          <p className="text-sm text-text-grey mt-1">No events or results have been recorded for this year yet.</p>
        </div>
      ) : (
        <>
          {/* Top performers this year */}
          {data.topThisYear.length > 0 && (
            <div className="bg-white rounded-2xl border border-purple-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-purple-100">
                <h2 className="font-semibold text-text-dark">Top Performers — {year}</h2>
                <p className="text-xs text-text-grey mt-0.5">Ranked by total marks earned in {year}</p>
              </div>
              <div className="divide-y divide-purple-50">
                {data.topThisYear.map((player, i) => (
                  <div key={player.playerId} className="flex items-center gap-3 px-5 py-3 hover:bg-brand-bg/40 transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                      i < 3 ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white" : "bg-brand-bg text-text-grey"
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <a href={`/players/${player.playerId}`} className="text-sm font-semibold text-text-dark hover:text-brand transition-colors truncate block">
                        {player.playerName}
                      </a>
                      <p className="text-xs text-text-grey truncate">{player.branch}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-brand">{player.totalMarks} pts</p>
                      <p className="text-xs text-text-grey">{player.eventCount} events</p>
                    </div>
                    <div className="w-12 text-right shrink-0 text-xs font-medium">
                      {player.trend === "up" && <span className="text-brand-teal">↑ Up</span>}
                      {player.trend === "down" && <span className="text-brand-pink">↓ Down</span>}
                      {player.trend === "flat" && <span className="text-text-grey">—</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Events held */}
          <div className="bg-white rounded-2xl border border-purple-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-purple-100">
              <h2 className="font-semibold text-text-dark">Events Held in {year}</h2>
              <p className="text-xs text-text-grey mt-0.5">{data.yearEvents.length} event{data.yearEvents.length !== 1 ? "s" : ""} recorded</p>
            </div>
            {data.yearEvents.length === 0 ? (
              <div className="text-center py-8 text-text-grey text-sm">No events recorded for {year}</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-purple-50">
                    <th className="text-left py-3 px-5 text-text-grey font-medium">Event</th>
                    <th className="text-left py-3 px-4 text-text-grey font-medium">Type</th>
                    <th className="text-left py-3 px-4 text-text-grey font-medium hidden sm:table-cell">Date</th>
                    <th className="text-right py-3 px-5 text-text-grey font-medium">Results</th>
                  </tr>
                </thead>
                <tbody>
                  {data.yearEvents.map((event) => (
                    <tr key={event.id} className="border-b border-purple-50 last:border-0 hover:bg-brand-bg/40 transition-colors">
                      <td className="py-3 px-5">
                        <a href={`/events/${event.id}`} className="font-medium text-text-dark hover:text-brand transition-colors">
                          {event.name}
                        </a>
                        {event.location && <p className="text-xs text-text-grey mt-0.5">{event.location}</p>}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${TYPE_COLORS[event.type] ?? "bg-gray-100 text-text-grey border-gray-200"}`}>
                          {EVENT_TYPE_LABELS[event.type as EventType] ?? event.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-text-grey hidden sm:table-cell">
                        {new Date(event.eventDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="py-3 px-5 text-right">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-brand-bg text-brand text-xs font-bold">
                          {event.resultCount}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Achievements */}
          {data.achievements.length > 0 && (
            <div className="bg-white rounded-2xl border border-purple-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-purple-100">
                <h2 className="font-semibold text-text-dark">Special Achievements — {year}</h2>
                <p className="text-xs text-text-grey mt-0.5">{data.achievements.length} achievement{data.achievements.length !== 1 ? "s" : ""} recorded</p>
              </div>
              <div className="divide-y divide-purple-50">
                {data.achievements.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-brand-bg/40 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 text-base">
                      {a.type === "best_athlete" ? "🥇" : a.type === "meet_record" ? "⚡" : "🏆"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <a href={`/players/${a.playerId}`} className="text-sm font-semibold text-text-dark hover:text-brand transition-colors">
                        {a.playerName}
                      </a>
                      <p className="text-xs text-text-grey truncate mt-0.5">
                        {a.branch} · <a href={`/events/${a.eventId}`} className="hover:text-brand">{a.eventName}</a>
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${ACHIEVEMENT_LABELS[a.type].color}`}>
                      {ACHIEVEMENT_LABELS[a.type].label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
