import { Suspense } from "react";
import { getRankings, type Period } from "@/app/actions/rankings";
import { requireUser } from "@/lib/auth-helpers";
import RankingsFilters from "@/components/rankings/RankingsFilters";
import { getActiveSportNames } from "@/app/actions/sports";
import RankingsTable from "@/components/rankings/RankingsTable";
import ExportButtons from "@/components/rankings/ExportButtons";

interface PageProps {
  searchParams: Promise<{
    period?: string;
    sport?: string;
    gender?: string;
    all?: string;
    topN?: string;
  }>;
}

async function RankingsContent({ searchParams }: { searchParams: Awaited<PageProps["searchParams"]> }) {
  const period = (searchParams.period ?? "this_year") as Period;
  const topN = searchParams.topN ? parseInt(searchParams.topN) : 25;

  const rows = await getRankings({
    period,
    sport: searchParams.sport,
    gender: searchParams.gender,
    activeOnly: searchParams.all !== "1",
    topN: topN || undefined,
  });

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-text-grey">{rows.length} player{rows.length !== 1 ? "s" : ""} ranked</p>
        <ExportButtons rows={rows} period={period} />
      </div>
      <RankingsTable rows={rows} searchParams={new URLSearchParams(searchParams as Record<string, string>).toString()} />
    </>
  );
}

export default async function RankingsPage({ searchParams }: PageProps) {
  await requireUser();
  const [params, sportNames] = await Promise.all([searchParams, getActiveSportNames()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-dark">Rankings</h1>
        <p className="text-text-grey mt-0.5">Player performance rankings by marks earned</p>
      </div>

      <Suspense>
        <RankingsFilters sports={sportNames} />
      </Suspense>

      <Suspense fallback={<div className="bg-white rounded-2xl border border-purple-100 py-16 text-center text-text-grey text-sm">Loading rankings…</div>}>
        <RankingsContent searchParams={params} />
      </Suspense>
    </div>
  );
}
