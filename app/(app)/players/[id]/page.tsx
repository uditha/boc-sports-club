import { notFound } from "next/navigation";
import Link from "next/link";
import { getDb } from "@/db";
import { players } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth-helpers";
import PlayerSlideOver from "@/components/players/PlayerSlideOver";
import { getActiveSportNames } from "@/app/actions/sports";
import ToggleActiveButton from "@/components/players/ToggleActiveButton";
import PlayerTabs from "@/components/players/PlayerTabs";
import HistoryTab from "@/components/players/HistoryTab";
import StatsTab from "@/components/players/StatsTab";
import { getPlayerHistory, getPlayerStats } from "@/app/actions/player-stats";

interface PageProps {
  params: Promise<{ id: string }>;
}

function InitialsAvatar({ name, size = "lg" }: { name: string; size?: "sm" | "lg" }) {
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const cls = size === "lg"
    ? "w-24 h-24 rounded-2xl text-3xl"
    : "w-14 h-14 rounded-xl text-xl";
  return (
    <div className={`${cls} bg-brand flex items-center justify-center flex-shrink-0`}>
      <span className="font-bold text-white">{initials}</span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <p className="text-xs text-text-grey uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm font-medium text-text-dark">{value ?? "—"}</p>
    </div>
  );
}

function ProfileTab({ player, sports }: { player: any; sports: string[] }) {
  return (
    <div className="bg-white rounded-2xl border border-purple-100 p-6">
      <div className="flex items-start gap-6">
        <div className="flex-shrink-0">
          {player.photoUrl ? (
            <img src={player.photoUrl} alt={player.fullName} className="w-24 h-24 rounded-2xl object-cover" />
          ) : (
            <InitialsAvatar name={player.fullName} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-text-dark">{player.fullName}</h1>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${player.active ? "bg-teal-50 text-brand-teal" : "bg-gray-100 text-text-grey"}`}>
              {player.active ? "Active" : "Inactive"}
            </span>
          </div>
          <p className="text-text-grey mt-1">{player.branch}</p>
          <div className="flex items-center gap-3 mt-4 flex-wrap">
            <PlayerSlideOver player={player} sports={sports} trigger={
              <button className="px-4 py-2 rounded-xl bg-brand hover:bg-brand-dark text-white text-sm font-semibold transition-colors cursor-pointer">
                Edit Player
              </button>
            } />
            <ToggleActiveButton id={player.id} active={player.active} />
            <Link href={`/players/${player.id}/print`} target="_blank" className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-purple-200 text-text-grey text-sm font-medium hover:bg-brand-bg transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Profile
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mt-8 pt-6 border-t border-purple-100">
        <InfoRow label="Employee ID" value={player.employeeId} />
        <InfoRow label="Gender" value={player.gender === "M" ? "Male" : "Female"} />
        <InfoRow label="Date of Birth" value={player.dateOfBirth} />
        <InfoRow label="Joined Year" value={player.joinedYear} />
        <div className="sm:col-span-2">
          <p className="text-xs text-text-grey uppercase tracking-wide mb-1.5">Sports</p>
          <div className="flex flex-wrap gap-1.5">
            {player.sport.split(",").map((s: string) => s.trim()).filter(Boolean).map((s: string) => (
              <span key={s} className="px-3 py-1 rounded-full bg-brand-bg text-brand-dark text-sm font-medium border border-purple-200">{s}</span>
            ))}
          </div>
        </div>
      </div>

      {player.notes && (
        <div className="mt-6 pt-6 border-t border-purple-100">
          <p className="text-xs text-text-grey uppercase tracking-wide mb-1">Notes</p>
          <p className="text-sm text-text-dark whitespace-pre-wrap">{player.notes}</p>
        </div>
      )}
    </div>
  );
}

export default async function PlayerDetailPage({ params }: PageProps) {
  await requireUser();
  const { id } = await params;
  const db = getDb();

  const [player, history, stats, sportNames] = await Promise.all([
    db.select().from(players).where(eq(players.id, id)).limit(1).then((r) => r[0]),
    getPlayerHistory(id),
    getPlayerStats(id),
    getActiveSportNames(),
  ]);

  if (!player) notFound();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link href="/players" className="inline-flex items-center gap-1.5 text-sm text-text-grey hover:text-brand transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Players
      </Link>

      <PlayerTabs
        profile={<ProfileTab player={player} sports={sportNames} />}
        history={<HistoryTab history={history} />}
        stats={<StatsTab stats={stats} />}
      />
    </div>
  );
}
