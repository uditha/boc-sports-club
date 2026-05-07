import Link from "next/link";
import { requireUser, getMyAllowedSports } from "@/lib/auth-helpers";
import { getDashboardStats } from "@/app/actions/dashboard";
import { EVENT_TYPE_LABELS, type EventType } from "@/lib/marks";
import MonthlyMarksChart from "@/components/dashboard/MonthlyMarksChart";
import EventTypeDonut from "@/components/dashboard/EventTypeDonut";

const PLACE_LABELS: Record<string, string> = {
  "1": "1st",
  "2": "2nd",
  "3": "3rd",
  participated: "participated",
};

const PLACE_COLORS: Record<string, string> = {
  "1": "bg-amber-100 text-amber-700",
  "2": "bg-slate-100 text-slate-600",
  "3": "bg-orange-100 text-orange-700",
  participated: "bg-brand-bg text-brand",
};

function PlayerInitials({ name }: { name: string }) {
  const parts = name.trim().split(" ");
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
  return (
    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand to-brand-lavender flex items-center justify-center text-white text-xs font-bold shrink-0">
      {initials}
    </div>
  );
}

export default async function DashboardPage() {
  await requireUser();
  const sportFilter = await getMyAllowedSports();
  const stats = await getDashboardStats(sportFilter ?? undefined);

  const maxSportCount = Math.max(...stats.sportBreakdown.map(s => s.count), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-dark">Dashboard</h1>
        <p className="text-text-grey mt-0.5">BOC Sports Society — at a glance</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-brand to-brand-lavender rounded-2xl p-5 text-white">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold">{stats.activePlayers}</p>
          <p className="text-sm font-medium mt-0.5">Active Players</p>
          <p className="text-xs opacity-70 mt-0.5">{stats.totalPlayers} total registered</p>
        </div>

        <div className="bg-gradient-to-br from-brand-teal to-brand-blue rounded-2xl p-5 text-white">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-3xl font-bold">{stats.totalEvents}</p>
          <p className="text-sm font-medium mt-0.5">Total Events</p>
          <p className="text-xs opacity-70 mt-0.5">{stats.totalResults} results recorded</p>
        </div>

        <div className="bg-gradient-to-br from-brand-blue to-brand-lavender rounded-2xl p-5 text-white">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-3xl font-bold">{stats.totalMarks}</p>
          <p className="text-sm font-medium mt-0.5">Marks Awarded</p>
          <p className="text-xs opacity-70 mt-0.5">All time total</p>
        </div>

        {/* Top Performer card */}
        <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-5 text-white">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          {stats.topPerformer ? (
            <>
              <p className="text-xl font-bold leading-tight line-clamp-1">{stats.topPerformer.playerName}</p>
              <p className="text-sm font-medium mt-0.5">Top Performer</p>
              <p className="text-xs opacity-80 mt-0.5">{stats.topPerformer.totalMarks} marks lifetime</p>
            </>
          ) : (
            <>
              <p className="text-3xl font-bold">—</p>
              <p className="text-sm font-medium mt-0.5">Top Performer</p>
              <p className="text-xs opacity-70 mt-0.5">No results yet</p>
            </>
          )}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-purple-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-text-dark text-sm">Marks This Year</h2>
              <p className="text-xs text-text-grey mt-0.5">Monthly marks awarded — {new Date().getFullYear()}</p>
            </div>
          </div>
          <MonthlyMarksChart data={stats.monthlyMarks} />
        </div>

        <div className="bg-white rounded-2xl border border-purple-100 p-5">
          <div className="mb-1">
            <h2 className="font-semibold text-text-dark text-sm">Events by Type</h2>
            <p className="text-xs text-text-grey mt-0.5">All time breakdown</p>
          </div>
          <EventTypeDonut data={stats.eventTypeBreakdown} />
        </div>
      </div>

      {/* Top players + breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 5 leaderboards — Men & Women */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: "Men's Top 5", players: stats.topMalePlayers, rankingsHref: "/rankings?gender=M", badge: "♂", badgeClass: "bg-blue-50 text-blue-600" },
            { label: "Women's Top 5", players: stats.topFemalePlayers, rankingsHref: "/rankings?gender=F", badge: "♀", badgeClass: "bg-pink-50 text-pink-600" },
          ].map(({ label, players, rankingsHref, badge, badgeClass }) => (
            <div key={label} className="bg-white rounded-2xl border border-purple-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-purple-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeClass}`}>{badge}</span>
                  <h2 className="font-semibold text-text-dark text-sm">{label}</h2>
                </div>
                <Link href={rankingsHref} className="text-xs text-brand hover:text-brand-dark font-medium transition-colors">
                  More →
                </Link>
              </div>
              {players.length === 0 ? (
                <div className="text-center py-10 text-text-grey text-sm">No results yet</div>
              ) : (
                <div className="divide-y divide-purple-50">
                  {players.map((player, i) => (
                    <div key={player.playerId} className="flex items-center gap-3 px-4 py-3 hover:bg-brand-bg/40 transition-colors">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${i < 3 ? "bg-gradient-to-br from-brand to-brand-lavender text-white" : "bg-brand-bg text-text-grey"}`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/players/${player.playerId}`} className="text-sm font-semibold text-text-dark hover:text-brand transition-colors truncate block">
                          {player.playerName}
                        </Link>
                        <p className="text-xs text-text-grey truncate">{player.branch}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-brand">{player.totalMarks} pts</p>
                        <p className="text-xs text-text-grey">{player.eventCount} events</p>
                      </div>
                      <div className="w-4 text-center shrink-0">
                        {player.trend === "up" && <span className="text-brand-teal text-xs font-bold">↑</span>}
                        {player.trend === "down" && <span className="text-brand-pink text-xs font-bold">↓</span>}
                        {player.trend === "flat" && <span className="text-text-grey text-xs">—</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Breakdown panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-purple-100 p-5">
            <h3 className="text-sm font-semibold text-text-dark mb-4">Gender Split</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-text-grey">Male</span>
                  <span className="font-semibold text-text-dark">{stats.genderBreakdown.male}</span>
                </div>
                <div className="h-2 rounded-full bg-purple-50 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand to-brand-lavender"
                    style={{ width: `${stats.activePlayers > 0 ? (stats.genderBreakdown.male / stats.activePlayers) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-text-grey">Female</span>
                  <span className="font-semibold text-text-dark">{stats.genderBreakdown.female}</span>
                </div>
                <div className="h-2 rounded-full bg-purple-50 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-teal to-brand-blue"
                    style={{ width: `${stats.activePlayers > 0 ? (stats.genderBreakdown.female / stats.activePlayers) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-purple-100 p-5">
            <h3 className="text-sm font-semibold text-text-dark mb-4">Sports</h3>
            {stats.sportBreakdown.length === 0 ? (
              <p className="text-xs text-text-grey">No players registered</p>
            ) : (
              <div className="space-y-3">
                {stats.sportBreakdown.map(({ sport, count }) => (
                  <div key={sport}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-text-grey">{sport}</span>
                      <span className="font-semibold text-text-dark">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-purple-50 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand to-brand-lavender"
                        style={{ width: `${(count / maxSportCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Results feed */}
      <div className="bg-white rounded-2xl border border-purple-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-purple-100 flex items-center justify-between">
          <h2 className="font-semibold text-text-dark">Recent Results</h2>
          <Link href="/events" className="text-xs text-brand hover:text-brand-dark font-medium transition-colors">
            All Events →
          </Link>
        </div>
        {stats.recentResults.length === 0 ? (
          <div className="text-center py-10 text-text-grey text-sm">No results recorded yet</div>
        ) : (
          <div className="divide-y divide-purple-50">
            {stats.recentResults.map((r) => (
              <div key={`${r.playerId}-${r.eventId}`} className="flex items-center gap-3 px-5 py-3 hover:bg-brand-bg/40 transition-colors">
                <PlayerInitials name={r.playerName} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-dark">
                    <Link href={`/players/${r.playerId}`} className="font-semibold hover:text-brand transition-colors">
                      {r.playerName}
                    </Link>
                    <span className="text-text-grey"> {r.place === "participated" ? "participated in" : `placed ${PLACE_LABELS[r.place]} at`} </span>
                    <Link href={`/events/${r.eventId}`} className="font-medium hover:text-brand transition-colors">
                      {r.eventName}
                    </Link>
                  </p>
                  <p className="text-xs text-text-grey mt-0.5">
                    {new Date(r.eventDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PLACE_COLORS[r.place] ?? "bg-brand-bg text-brand"}`}>
                    {PLACE_LABELS[r.place]}
                  </span>
                  <span className="text-sm font-bold text-brand whitespace-nowrap">{r.marks} pts</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
