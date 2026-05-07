import MarksBarChart from "./MarksBarChart";
import type { PlayerStats } from "@/app/actions/player-stats";

interface Props {
  stats: PlayerStats;
}

function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-purple-100 p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-text-dark leading-none">{value}</p>
        <p className="text-xs font-medium text-text-grey mt-1">{label}</p>
        {sub && <p className="text-xs text-text-grey/60 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function SmallStatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-purple-100 px-4 py-3.5 flex items-center gap-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${accent}`}>
        {icon}
      </div>
      <div>
        <p className="text-lg font-bold text-text-dark leading-none">{value}</p>
        <p className="text-xs text-text-grey mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function StatsTab({ stats }: Props) {
  const podiumTotal = stats.firstPlaces + stats.secondPlaces + stats.thirdPlaces;
  const podiumRate = stats.totalEvents > 0
    ? Math.round((podiumTotal / stats.totalEvents) * 100)
    : 0;

  return (
    <div className="space-y-4">

      {/* Primary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Events"
          value={stats.totalEvents}
          sub="all time"
          accent="bg-brand/10"
          icon={
            <svg className="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          label="Lifetime Marks"
          value={stats.totalMarks}
          sub="cumulative points"
          accent="bg-brand-teal/10"
          icon={
            <svg className="w-5 h-5 text-brand-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          }
        />
        <StatCard
          label="Marks This Year"
          value={stats.marksThisYear}
          sub={`${new Date().getFullYear()}`}
          accent="bg-brand-blue/10"
          icon={
            <svg className="w-5 h-5 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />
      </div>

      {/* Podium + Achievements row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <SmallStatCard
          label="1st Place"
          value={stats.firstPlaces}
          accent="bg-yellow-50"
          icon={
            <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          }
        />
        <SmallStatCard
          label="2nd Place"
          value={stats.secondPlaces}
          accent="bg-gray-100"
          icon={
            <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          }
        />
        <SmallStatCard
          label="3rd Place"
          value={stats.thirdPlaces}
          accent="bg-amber-50"
          icon={
            <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          }
        />
        <SmallStatCard
          label="Best Athlete"
          value={stats.bestAthleteCount}
          accent="bg-brand-teal/10"
          icon={
            <svg className="w-4 h-4 text-brand-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          }
        />
        <SmallStatCard
          label="Meet Records"
          value={stats.meetRecordCount}
          accent="bg-brand-pink/10"
          icon={
            <svg className="w-4 h-4 text-brand-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />
      </div>

      {/* Podium rate bar */}
      {stats.totalEvents > 0 && (
        <div className="bg-white rounded-2xl border border-purple-100 px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-text-dark">Podium Rate</p>
            <span className="text-sm font-bold text-brand">{podiumRate}%</span>
          </div>
          <div className="h-2 rounded-full bg-purple-50 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand to-brand-lavender transition-all"
              style={{ width: `${podiumRate}%` }}
            />
          </div>
          <p className="text-xs text-text-grey mt-1.5">{podiumTotal} podium finish{podiumTotal !== 1 ? "es" : ""} from {stats.totalEvents} event{stats.totalEvents !== 1 ? "s" : ""}</p>
        </div>
      )}

      {/* Marks per year chart */}
      <div className="bg-white rounded-2xl border border-purple-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-dark">Marks Per Year</h3>
          {stats.marksPerYear.length > 0 && (
            <span className="text-xs text-text-grey">{stats.marksPerYear.length} year{stats.marksPerYear.length !== 1 ? "s" : ""} of data</span>
          )}
        </div>
        <MarksBarChart data={stats.marksPerYear} />
      </div>

    </div>
  );
}
