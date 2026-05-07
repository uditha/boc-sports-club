import { Suspense } from "react";
import Link from "next/link";
import { getPlayers } from "@/app/actions/players";
import PlayerSlideOver from "@/components/players/PlayerSlideOver";
import PlayerFilters from "@/components/players/PlayerFilters";
import { requireUser, getSessionSportFilter } from "@/lib/auth-helpers";
import { getActiveSportNames } from "@/app/actions/sports";

interface PageProps {
  searchParams: Promise<{ q?: string; sport?: string; inactive?: string }>;
}

function InitialsAvatar({ name }: { name: string }) {
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-bold text-white">{initials}</span>
    </div>
  );
}

function SportsPills({ sport }: { sport: string }) {
  const sports = sport.split(",").map((s) => s.trim()).filter(Boolean);
  return (
    <div className="flex flex-wrap gap-1">
      {sports.map((s) => (
        <span key={s} className="px-2 py-0.5 rounded-full bg-brand-bg text-brand-dark text-xs font-medium border border-purple-200">
          {s}
        </span>
      ))}
    </div>
  );
}

async function PlayersTable({
  searchParams,
  allowedSports,
}: {
  searchParams: { q?: string; sport?: string; inactive?: string };
  allowedSports: string[] | null;
}) {
  const players = await getPlayers({
    search: searchParams.q,
    sport: allowedSports ? undefined : searchParams.sport,
    allowedSports: allowedSports ?? undefined,
    includeInactive: searchParams.inactive === "1",
  });

  if (players.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-2xl bg-brand-bg flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <p className="text-text-dark font-semibold">No players found</p>
        <p className="text-text-grey text-sm mt-1">Try adjusting your search or add a new player.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-purple-100">
            <th className="text-left py-3 px-4 text-text-grey font-medium">Player</th>
            <th className="text-left py-3 px-4 text-text-grey font-medium">Employee ID</th>
            <th className="text-left py-3 px-4 text-text-grey font-medium">Branch</th>
            <th className="text-left py-3 px-4 text-text-grey font-medium">Sports</th>
            <th className="text-left py-3 px-4 text-text-grey font-medium">Gender</th>
            <th className="text-left py-3 px-4 text-text-grey font-medium">Joined</th>
            <th className="text-left py-3 px-4 text-text-grey font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player) => (
            <tr key={player.id} className="border-b border-purple-50 hover:bg-brand-bg/50 transition-colors">
              <td className="py-3 px-4">
                <Link href={`/players/${player.id}`} className="flex items-center gap-3 group">
                  {player.photoUrl ? (
                    <img src={player.photoUrl} alt={player.fullName} className="w-9 h-9 rounded-xl object-cover" />
                  ) : (
                    <InitialsAvatar name={player.fullName} />
                  )}
                  <span className="font-medium text-text-dark group-hover:text-brand transition-colors">{player.fullName}</span>
                </Link>
              </td>
              <td className="py-3 px-4 text-text-grey font-mono text-xs">{player.employeeId}</td>
              <td className="py-3 px-4 text-text-dark">{player.branch}</td>
              <td className="py-3 px-4"><SportsPills sport={player.sport} /></td>
              <td className="py-3 px-4 text-text-grey">{player.gender === "M" ? "Male" : "Female"}</td>
              <td className="py-3 px-4 text-text-grey">{player.joinedYear ?? "—"}</td>
              <td className="py-3 px-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  player.active ? "bg-teal-50 text-brand-teal" : "bg-gray-100 text-text-grey"
                }`}>
                  {player.active ? "Active" : "Inactive"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-text-grey px-4 py-3">{players.length} player{players.length !== 1 ? "s" : ""}</p>
    </div>
  );
}

export default async function PlayersPage({ searchParams }: PageProps) {
  const session = await requireUser();
  const [params, allSportNames, sportFilter] = await Promise.all([
    searchParams,
    getActiveSportNames(),
    getSessionSportFilter(session),
  ]);

  // For sport_admin: restrict sport picker and query to their assigned sports
  const visibleSports = sportFilter ? allSportNames.filter(s => sportFilter.includes(s)) : allSportNames;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Players</h1>
          <p className="text-text-grey mt-0.5">
            {sportFilter
              ? `Athletes in: ${sportFilter.join(", ")}`
              : "Manage all registered athletes"}
          </p>
        </div>
        <PlayerSlideOver
          sports={visibleSports}
          trigger={
            <button className="flex items-center gap-2 px-4 py-2.5 bg-brand hover:bg-brand-dark text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Player
            </button>
          }
        />
      </div>

      <Suspense>
        <PlayerFilters sports={visibleSports} />
      </Suspense>

      <div className="bg-white rounded-2xl border border-purple-100 overflow-hidden">
        <Suspense fallback={<div className="py-16 text-center text-text-grey text-sm">Loading players…</div>}>
          <PlayersTable searchParams={params} allowedSports={sportFilter} />
        </Suspense>
      </div>
    </div>
  );
}
