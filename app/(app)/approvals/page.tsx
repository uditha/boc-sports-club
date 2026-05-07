import { requireAdmin } from "@/lib/auth-helpers";
import { getPendingResults } from "@/app/actions/approvals";
import { ApproveButton, RejectButton } from "@/components/approvals/ApprovalActions";
import { EVENT_TYPE_LABELS, type EventType, PLACE_LABELS, type Place } from "@/lib/marks";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-teal-100 text-teal-700",
  rejected: "bg-rose-100 text-rose-700",
};

const SPORT_COLORS: Record<string, string> = {
  M: "bg-blue-50 text-blue-600",
  F: "bg-pink-50 text-pink-600",
};

export default async function ApprovalsPage() {
  await requireAdmin();
  const pending = await getPendingResults();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-dark">Pending Approvals</h1>
        <p className="text-text-grey mt-0.5">
          Results submitted by sport admins awaiting your review
        </p>
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
        <div className="bg-white rounded-2xl border border-purple-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-purple-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-text-dark">Results Queue</h2>
              <p className="text-xs text-text-grey mt-0.5">{pending.length} result{pending.length !== 1 ? "s" : ""} awaiting review</p>
            </div>
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
              {pending.length}
            </span>
          </div>

          <div className="divide-y divide-purple-50">
            {pending.map((r) => (
              <div key={r.id} className="px-5 py-4 hover:bg-brand-bg/30 transition-colors">
                <div className="flex items-start gap-4 flex-wrap">
                  {/* Player + event info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Link href={`/players/${r.playerId}`} className="font-semibold text-text-dark hover:text-brand transition-colors text-sm">
                        {r.playerName}
                      </Link>
                      <span className="text-text-grey text-sm">·</span>
                      <span className="text-sm text-text-grey">{r.playerBranch}</span>
                      {r.gender && (
                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${SPORT_COLORS[r.gender] ?? ""}`}>
                          {r.gender === "M" ? "Male" : "Female"}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap text-xs text-text-grey">
                      <Link href={`/events/${r.eventId}`} className="font-medium text-brand-dark hover:text-brand transition-colors">
                        {r.eventName}
                      </Link>
                      <span>·</span>
                      <span>{EVENT_TYPE_LABELS[r.eventType as EventType] ?? r.eventType}</span>
                      <span>·</span>
                      <span>{new Date(r.eventDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>

                    {/* Result details row */}
                    <div className="flex items-center gap-2 flex-wrap mt-2">
                      {r.sport && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-brand-bg text-brand font-medium">
                          {r.sport}
                        </span>
                      )}
                      {r.discipline && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-brand-lavender font-medium">
                          {r.discipline}
                        </span>
                      )}
                      {r.ageCategory && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
                          {r.ageCategory}
                        </span>
                      )}
                      <span className="text-xs font-semibold text-text-dark">
                        {PLACE_LABELS[r.place as Place]}
                      </span>
                      {r.bestAthlete && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">
                          Best Athlete
                        </span>
                      )}
                      {r.meetRecord && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-brand-lavender font-semibold">
                          Meet Record
                        </span>
                      )}
                      <span className="text-xs font-bold text-brand">{r.marksAwarded} pts</span>
                      {r.performance && (
                        <span className="text-xs text-text-grey">{r.performance}</span>
                      )}
                    </div>

                    <p className="text-xs text-text-grey mt-1.5">
                      Submitted by <span className="font-medium">{r.submittedBy ?? "Unknown"}</span>
                      {" · "}
                      {new Date(r.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <ApproveButton resultId={r.id} />
                    <RejectButton resultId={r.id} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
