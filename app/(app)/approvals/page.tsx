import { requireAdmin } from "@/lib/auth-helpers";
import { getPendingResults } from "@/app/actions/approvals";
import { ApproveButton, RejectButton, ApproveAllButton } from "@/components/approvals/ApprovalActions";
import { EVENT_TYPE_LABELS, type EventType, PLACE_LABELS, type Place } from "@/lib/marks";
import Link from "next/link";

const GENDER_COLORS: Record<string, string> = {
  M: "bg-blue-50 text-blue-600",
  F: "bg-pink-50 text-pink-600",
};

export default async function ApprovalsPage() {
  await requireAdmin();
  const pending = await getPendingResults();

  // Group: sport → eventId → results
  const bySport = new Map<string, Map<string, typeof pending>>();

  for (const r of pending) {
    const sportKey = r.sport ?? "Unspecified";
    if (!bySport.has(sportKey)) bySport.set(sportKey, new Map());
    const byEvent = bySport.get(sportKey)!;
    if (!byEvent.has(r.eventId)) byEvent.set(r.eventId, []);
    byEvent.get(r.eventId)!.push(r);
  }

  const sportGroups = Array.from(bySport.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Pending Approvals</h1>
          <p className="text-text-grey mt-0.5">Results submitted by sport admins awaiting your review</p>
        </div>
        {pending.length > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 text-amber-700 text-sm font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            {pending.length} pending
          </span>
        )}
      </div>

      {pending.length === 0 ? (
        <div className="bg-white rounded-2xl border border-purple-100 p-14 text-center">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-brand-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="font-semibold text-text-dark">All caught up!</p>
          <p className="text-sm text-text-grey mt-1">No results are waiting for approval.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sportGroups.map(([sport, byEvent]) => {
            const sportResultIds = Array.from(byEvent.values()).flat().map(r => r.id);
            const eventGroups = Array.from(byEvent.entries());

            return (
              <div key={sport} className="bg-white rounded-2xl border border-purple-100 overflow-hidden">
                {/* Sport header */}
                <div className="px-5 py-4 border-b border-purple-100 flex items-center justify-between gap-4 bg-brand-bg/40">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center">
                      <svg className="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="font-bold text-text-dark">{sport}</h2>
                      <p className="text-xs text-text-grey">
                        {sportResultIds.length} result{sportResultIds.length !== 1 ? "s" : ""} · {byEvent.size} event{byEvent.size !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <ApproveAllButton resultIds={sportResultIds} label={`(${sportResultIds.length})`} />
                </div>

                {/* Events within this sport */}
                <div className="divide-y divide-purple-50">
                  {eventGroups.map(([eventId, rows]) => {
                    const first = rows[0];
                    // Group rows by discipline within this event
                    const byDiscipline = new Map<string, typeof rows>();
                    for (const r of rows) {
                      const dk = [r.discipline, r.ageCategory, r.gender].filter(Boolean).join(" · ") || "General";
                      if (!byDiscipline.has(dk)) byDiscipline.set(dk, []);
                      byDiscipline.get(dk)!.push(r);
                    }

                    return (
                      <div key={eventId}>
                        {/* Event sub-header */}
                        <div className="px-5 py-3 bg-purple-50/50 flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2 text-sm">
                            <Link href={`/events/${eventId}`} className="font-semibold text-brand-dark hover:text-brand transition-colors">
                              {first.eventName}
                            </Link>
                            <span className="text-text-grey">·</span>
                            <span className="text-text-grey text-xs">{EVENT_TYPE_LABELS[first.eventType as EventType] ?? first.eventType}</span>
                            <span className="text-text-grey">·</span>
                            <span className="text-text-grey text-xs">
                              {new Date(first.eventDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          </div>
                          <span className="text-xs text-text-grey">{rows.length} result{rows.length !== 1 ? "s" : ""}</span>
                        </div>

                        {/* Discipline groups within the event */}
                        {Array.from(byDiscipline.entries()).map(([disciplineKey, dRows]) => (
                          <div key={disciplineKey}>
                            {/* Discipline label row */}
                            <div className="px-5 py-2 flex items-center gap-2 border-b border-purple-50/60 bg-white">
                              <span className="text-xs font-semibold text-brand-lavender uppercase tracking-wide">{disciplineKey}</span>
                              <span className="text-xs text-text-grey">({dRows.length})</span>
                            </div>

                            {/* Result rows */}
                            {dRows.map((r) => (
                              <div key={r.id} className="px-5 py-3.5 hover:bg-brand-bg/20 transition-colors flex items-center gap-4 flex-wrap">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Link href={`/players/${r.playerId}`} className="font-semibold text-text-dark hover:text-brand text-sm transition-colors">
                                      {r.playerName}
                                    </Link>
                                    <span className="text-text-grey text-xs">{r.playerBranch}</span>
                                    {r.gender && (
                                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${GENDER_COLORS[r.gender] ?? ""}`}>
                                        {r.gender === "M" ? "M" : "F"}
                                      </span>
                                    )}
                                    <span className="text-xs font-bold text-text-dark px-2 py-0.5 rounded-full bg-brand-bg border border-purple-200">
                                      {PLACE_LABELS[r.place as Place]}
                                    </span>
                                    {r.bestAthlete && (
                                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">Best Athlete</span>
                                    )}
                                    {r.meetRecord && (
                                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-100 text-brand-lavender font-semibold">Meet Record</span>
                                    )}
                                    <span className="text-xs font-bold text-brand">{r.marksAwarded} pts</span>
                                    {r.performance && <span className="text-xs text-text-grey font-mono">{r.performance}</span>}
                                  </div>
                                  <p className="text-xs text-text-grey mt-0.5">
                                    by <span className="font-medium">{r.submittedBy ?? "Unknown"}</span>
                                    {" · "}
                                    {new Date(r.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <ApproveButton resultId={r.id} />
                                  <RejectButton resultId={r.id} />
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
