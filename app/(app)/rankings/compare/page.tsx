import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { players } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { getPlayerStats, getPlayerHistory } from "@/app/actions/player-stats";
import { requireUser } from "@/lib/auth-helpers";
import MarksBarChart from "@/components/players/MarksBarChart";

interface PageProps {
  searchParams: Promise<{ ids?: string }>;
}

const CARD_COLORS = [
  "from-brand to-brand-lavender",
  "from-brand-teal to-brand-blue",
  "from-brand-blue to-brand-lavender",
  "from-brand-pink to-rose-500",
];

export default async function ComparePage({ searchParams }: PageProps) {
  await requireUser();
  const { ids } = await searchParams;

  if (!ids) notFound();

  const playerIds = ids.split(",").slice(0, 4).filter(Boolean);
  if (playerIds.length < 2) notFound();

  const db = getDb();
  const playerList = await db.select().from(players).where(inArray(players.id, playerIds));

  const statsAll = await Promise.all(playerIds.map((id) => getPlayerStats(id)));

  const orderedPlayers = playerIds.map((id) => playerList.find((p) => p.id === id)).filter(Boolean) as typeof playerList;
  const orderedStats = playerIds.map((id, i) => statsAll[i]);

  const METRICS = [
    { label: "Lifetime Marks", key: "totalMarks" as const },
    { label: "Marks This Year", key: "marksThisYear" as const },
    { label: "Total Events", key: "totalEvents" as const },
    { label: "1st Places", key: "firstPlaces" as const },
    { label: "2nd Places", key: "secondPlaces" as const },
    { label: "3rd Places", key: "thirdPlaces" as const },
    { label: "Best Athlete", key: "bestAthleteCount" as const },
    { label: "Meet Records", key: "meetRecordCount" as const },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <Link href="/rankings" className="inline-flex items-center gap-1.5 text-sm text-text-grey hover:text-brand transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Rankings
        </Link>
        <h1 className="text-2xl font-bold text-text-dark">Player Comparison</h1>
      </div>

      {/* Player header cards */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${orderedPlayers.length}, 1fr)` }}>
        {orderedPlayers.map((player, i) => {
          const initials = player.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
          return (
            <div key={player.id} className={`bg-gradient-to-br ${CARD_COLORS[i]} rounded-2xl p-5 text-white`}>
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                {player.photoUrl ? (
                  <img src={player.photoUrl} alt={player.fullName} className="w-12 h-12 rounded-xl object-cover" />
                ) : (
                  <span className="text-lg font-bold">{initials}</span>
                )}
              </div>
              <Link href={`/players/${player.id}`} className="font-bold text-base hover:underline">{player.fullName}</Link>
              <p className="text-sm opacity-80 mt-0.5">{player.branch}</p>
              <p className="text-xs opacity-70 mt-1">{player.sport.split(",")[0]}</p>
            </div>
          );
        })}
      </div>

      {/* Stats comparison table */}
      <div className="bg-white rounded-2xl border border-purple-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-purple-100">
          <h2 className="font-semibold text-text-dark">Statistics Comparison</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-purple-100">
              <th className="text-left py-3 px-5 text-text-grey font-medium w-40">Metric</th>
              {orderedPlayers.map((p, i) => (
                <th key={p.id} className="text-center py-3 px-4 font-semibold text-text-dark">{p.fullName.split(" ")[0]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {METRICS.map((metric, mi) => {
              const values = orderedStats.map((s) => s[metric.key]);
              const max = Math.max(...values);
              return (
                <tr key={metric.key} className={`border-b border-purple-50 ${mi % 2 === 0 ? "" : "bg-brand-bg/30"}`}>
                  <td className="py-3 px-5 text-text-grey">{metric.label}</td>
                  {values.map((v, i) => (
                    <td key={i} className="py-3 px-4 text-center">
                      <span className={`text-base font-bold ${v === max && max > 0 ? "text-brand" : "text-text-dark"}`}>
                        {v}
                        {v === max && max > 0 && values.filter((x) => x === max).length === 1 && (
                          <span className="ml-1 text-xs">🏆</span>
                        )}
                      </span>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Year-by-year charts */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${orderedPlayers.length}, 1fr)` }}>
        {orderedPlayers.map((player, i) => (
          <div key={player.id} className="bg-white rounded-2xl border border-purple-100 p-4">
            <h3 className="text-sm font-semibold text-text-dark mb-3">{player.fullName.split(" ")[0]} — Marks/Year</h3>
            <MarksBarChart data={orderedStats[i].marksPerYear} />
          </div>
        ))}
      </div>
    </div>
  );
}
