import { notFound } from "next/navigation";
import Link from "next/link";
import { getEventById } from "@/app/actions/events";
import { getResultsForEvent } from "@/app/actions/results";
import { getPlayers } from "@/app/actions/players";
import { getActiveSportNames, getAllDisciplinesBySport } from "@/app/actions/sports";
import { getActiveAgeCategoryNames } from "@/app/actions/ageCategories";
import { requireUser, isSuperAdmin, getMyAllowedSports } from "@/lib/auth-helpers";
import { auth } from "@/auth";
import { EVENT_TYPE_LABELS, PLACE_LABELS, type EventType } from "@/lib/marks";
import EventSlideOver from "@/components/events/EventSlideOver";
import ResultSlideOver from "@/components/events/ResultSlideOver";
import LockEventButton from "@/components/events/LockEventButton";
import DeleteResultButton from "@/components/events/DeleteResultButton";

interface PageProps {
  params: Promise<{ id: string }>;
}

const PLACE_STYLES: Record<string, string> = {
  "1": "bg-yellow-50 text-yellow-700 border-yellow-200",
  "2": "bg-gray-100 text-gray-600 border-gray-200",
  "3": "bg-amber-50 text-amber-600 border-amber-200",
  participated: "bg-brand-bg text-brand border-brand/20",
};

const STATUS_STYLES: Record<string, string> = {
  approved: "bg-teal-50 text-teal-700 border-teal-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
};

export default async function EventDetailPage({ params }: PageProps) {
  await requireUser();
  const { id } = await params;

  const [session, allowedSports] = await Promise.all([auth(), getMyAllowedSports()]);

  const role = (session?.user as { role?: string })?.role ?? "";
  const isAdmin = isSuperAdmin(role);
  const isSportAdmin = !isAdmin && role === "sport_admin";

  const [event, allEventResults, allPlayers, allSports, disciplinesBySport, allAgeCategories] = await Promise.all([
    getEventById(id),
    getResultsForEvent(id),
    // Sport_admin: only their assigned players; super_admin: all players
    getPlayers({ includeInactive: false, allowedSports: allowedSports ?? undefined }),
    getActiveSportNames(),
    getAllDisciplinesBySport(),
    getActiveAgeCategoryNames(),
  ]);

  if (!event) notFound();

  // Sport_admin sees only their sport's results in the table; super_admin sees all
  const eventResults = (allowedSports !== null && isSportAdmin)
    ? allEventResults.filter(r =>
        allowedSports.length === 0
          ? false
          : r.sport != null && allowedSports.some(s => r.sport === s)
      )
    : allEventResults;

  // Restrict sport picker to assigned sports for sport_admin
  const visibleSports = allowedSports !== null
    ? allSports.filter(s => allowedSports.includes(s))
    : allSports;

  const totalMarks = eventResults.reduce((sum, r) => sum + r.marksAwarded, 0);

  // Players not yet entered in the visible scope
  const enteredPlayerIds = new Set(eventResults.map((r) => r.playerId));
  const availablePlayers = allPlayers.filter((p) => !enteredPlayerIds.has(p.id));

  const canEdit = isAdmin || isSportAdmin;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back */}
      <Link href="/events" className="inline-flex items-center gap-1.5 text-sm text-text-grey hover:text-brand transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Events
      </Link>

      {/* Event header card */}
      <div className="bg-white rounded-2xl border border-purple-100 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h1 className="text-2xl font-bold text-text-dark">{event.name}</h1>
              {event.locked && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-600 border border-amber-200">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Locked
                </span>
              )}
            </div>
            <p className="text-text-grey text-sm">{EVENT_TYPE_LABELS[event.type as EventType]}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {!event.locked && canEdit && (
              <>
                {isAdmin && (
                  <Link
                    href={`/events/bulk?eventId=${event.id}`}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-purple-200 text-text-grey text-sm font-medium hover:bg-brand-bg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    Bulk Entry
                  </Link>
                )}
                {isAdmin && (
                  <EventSlideOver event={event} trigger={
                    <button className="px-4 py-2 rounded-xl border border-purple-200 text-text-grey text-sm font-medium hover:bg-brand-bg transition-colors cursor-pointer">
                      Edit Event
                    </button>
                  } />
                )}
              </>
            )}
            {isAdmin && <LockEventButton id={event.id} locked={event.locked} />}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-6 pt-6 border-t border-purple-100">
          <div>
            <p className="text-xs text-text-grey uppercase tracking-wide mb-0.5">Date</p>
            <p className="text-sm font-medium text-text-dark">
              {new Date(event.eventDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-grey uppercase tracking-wide mb-0.5">Location</p>
            <p className="text-sm font-medium text-text-dark">{event.location ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-text-grey uppercase tracking-wide mb-0.5">Participants</p>
            <p className="text-sm font-medium text-text-dark">{eventResults.length}</p>
          </div>
          <div>
            <p className="text-xs text-text-grey uppercase tracking-wide mb-0.5">Total Marks</p>
            <p className="text-sm font-bold text-brand">{totalMarks}</p>
          </div>
        </div>
      </div>

      {/* Sport_admin notice: results pending approval */}
      {isSportAdmin && eventResults.some(r => r.status === "pending") && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            {eventResults.filter(r => r.status === "pending").length} result{eventResults.filter(r => r.status === "pending").length !== 1 ? "s" : ""} waiting for super admin approval.
            Approved results appear in rankings automatically.
          </span>
        </div>
      )}

      {isSportAdmin && eventResults.some(r => r.status === "rejected") && (
        <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-800">
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            {eventResults.filter(r => r.status === "rejected").length} result{eventResults.filter(r => r.status === "rejected").length !== 1 ? "s" : ""} were rejected. Check the status column and re-submit if needed.
          </span>
        </div>
      )}

      {/* Results section */}
      <div className="bg-white rounded-2xl border border-purple-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-purple-100">
          <h2 className="font-semibold text-text-dark">
            Results ({eventResults.length})
            {isSportAdmin && visibleSports.length > 0 && (
              <span className="ml-2 text-xs font-normal text-text-grey">· {visibleSports.join(", ")}</span>
            )}
          </h2>
          {!event.locked && canEdit && (
            <ResultSlideOver
              eventId={event.id}
              eventType={event.type as EventType}
              players={availablePlayers}
              sports={visibleSports}
              sportDisciplines={disciplinesBySport}
              ageCategories={allAgeCategories}
              trigger={
                <button className="flex items-center gap-2 px-3 py-2 bg-brand hover:bg-brand-dark text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Result
                </button>
              }
            />
          )}
        </div>

        {eventResults.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-grey text-sm">No results recorded yet.</p>
            {!event.locked && canEdit && <p className="text-text-grey text-xs mt-1">Click "Add Result" to start recording.</p>}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-purple-100">
                <th className="text-left py-3 px-4 text-text-grey font-medium">Player</th>
                <th className="text-left py-3 px-4 text-text-grey font-medium">Sport</th>
                <th className="text-left py-3 px-4 text-text-grey font-medium">Place</th>
                <th className="text-left py-3 px-4 text-text-grey font-medium">Achievements</th>
                <th className="text-left py-3 px-4 text-text-grey font-medium">Status</th>
                <th className="text-right py-3 px-4 text-text-grey font-medium">Marks</th>
                {!event.locked && canEdit && <th className="py-3 px-4" />}
              </tr>
            </thead>
            <tbody>
              {eventResults.map((r) => (
                <tr key={r.id} className="border-b border-purple-50 hover:bg-brand-bg/50 transition-colors">
                  <td className="py-3 px-4">
                    <Link href={`/players/${r.playerId}`} className="hover:text-brand transition-colors">
                      <p className="font-medium text-text-dark">{r.playerName}</p>
                      <p className="text-xs text-text-grey">{r.playerEmployeeId} · {r.playerBranch}</p>
                    </Link>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm text-text-grey">{r.sport ?? "—"}</p>
                      {r.gender && (
                        <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${r.gender === "M" ? "bg-blue-50 text-blue-600" : "bg-pink-50 text-pink-600"}`}>
                          {r.gender === "M" ? "Men's" : "Women's"}
                        </span>
                      )}
                    </div>
                    {r.discipline && <p className="text-xs text-text-grey/70 mt-0.5">{r.discipline}</p>}
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      {r.ageCategory && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-50 text-brand border border-brand/20 font-medium">
                          {r.ageCategory}
                        </span>
                      )}
                      {r.performance && (
                        <span className="text-xs text-text-grey font-mono">{r.performance}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${PLACE_STYLES[r.place] ?? ""}`}>
                      {PLACE_LABELS[r.place as keyof typeof PLACE_LABELS]}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1.5 flex-wrap">
                      {r.bestAthlete && (
                        <span className="px-2 py-0.5 rounded-full bg-brand-teal/10 text-brand-teal text-xs font-medium border border-brand-teal/30">
                          Best Athlete
                        </span>
                      )}
                      {r.meetRecord && (
                        <span className="px-2 py-0.5 rounded-full bg-brand-pink/10 text-brand-pink text-xs font-medium border border-brand-pink/30">
                          Meet Record
                        </span>
                      )}
                      {!r.bestAthlete && !r.meetRecord && <span className="text-text-grey text-xs">—</span>}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${STATUS_STYLES[r.status] ?? ""}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="font-bold text-brand">{r.marksAwarded}</span>
                  </td>
                  {!event.locked && canEdit && (
                    <td className="py-3 px-4 text-right">
                      {/* Super admin can edit/delete any result; sport_admin only their pending ones */}
                      {(isAdmin || r.status === "pending") && (
                        <div className="flex items-center justify-end gap-1">
                          <ResultSlideOver
                            eventId={event.id}
                            eventType={event.type as EventType}
                            players={allPlayers}
                            sports={visibleSports}
                            sportDisciplines={disciplinesBySport}
                            ageCategories={allAgeCategories}
                            result={r}
                            trigger={
                              <button className="p-1.5 rounded-lg hover:bg-brand-bg text-text-grey hover:text-brand transition-colors" title="Edit result">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                            }
                          />
                          {isAdmin && <DeleteResultButton resultId={r.id} eventId={event.id} />}
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
