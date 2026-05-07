"use client";

import { useState } from "react";

const TABS = ["Profile", "History", "Stats"] as const;
type Tab = typeof TABS[number];

interface Props {
  profile: React.ReactNode;
  history: React.ReactNode;
  stats: React.ReactNode;
}

export default function PlayerTabs({ profile, history, stats }: Props) {
  const [active, setActive] = useState<Tab>("Profile");

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 bg-white rounded-2xl border border-purple-100 p-1 w-fit mb-6">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-colors ${
              active === tab
                ? "bg-brand text-white shadow-sm"
                : "text-text-grey hover:text-brand-dark hover:bg-brand-bg"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {active === "Profile" && profile}
      {active === "History" && history}
      {active === "Stats" && stats}
    </div>
  );
}
