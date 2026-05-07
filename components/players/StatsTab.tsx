import MarksBarChart from "./MarksBarChart";
import type { PlayerStats } from "@/app/actions/player-stats";

const CARDS = (stats: PlayerStats) => [
  { label: "Total Events", value: stats.totalEvents, color: "from-brand to-brand-lavender", icon: "🏅" },
  { label: "Lifetime Marks", value: stats.totalMarks, color: "from-brand-teal to-brand-blue", icon: "⭐" },
  { label: "Marks This Year", value: stats.marksThisYear, color: "from-brand-blue to-brand-lavender", icon: "📈" },
  { label: "1st Places", value: stats.firstPlaces, color: "from-yellow-400 to-amber-400", icon: "🥇" },
  { label: "2nd Places", value: stats.secondPlaces, color: "from-gray-400 to-gray-500", icon: "🥈" },
  { label: "3rd Places", value: stats.thirdPlaces, color: "from-amber-500 to-amber-600", icon: "🥉" },
  { label: "Best Athlete", value: stats.bestAthleteCount, color: "from-brand-teal to-teal-600", icon: "🏆" },
  { label: "Meet Records", value: stats.meetRecordCount, color: "from-brand-pink to-rose-500", icon: "📋" },
];

interface Props {
  stats: PlayerStats;
}

export default function StatsTab({ stats }: Props) {
  const cards = CARDS(stats);

  return (
    <div className="space-y-6">
      {/* Metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className={`bg-gradient-to-br ${card.color} rounded-2xl p-4 text-white`}>
            <p className="text-2xl mb-1">{card.icon}</p>
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-xs opacity-80 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="bg-white rounded-2xl border border-purple-100 p-5">
        <h3 className="text-sm font-semibold text-text-dark mb-4">Marks Per Year</h3>
        <MarksBarChart data={stats.marksPerYear} />
      </div>
    </div>
  );
}
