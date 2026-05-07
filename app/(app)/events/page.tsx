import Link from "next/link";
import { getEvents } from "@/app/actions/events";
import EventSlideOver from "@/components/events/EventSlideOver";
import { requireUser } from "@/lib/auth-helpers";
import { EVENT_TYPE_LABELS, type EventType } from "@/lib/marks";

interface PageProps {
  searchParams: Promise<{ year?: string }>;
}

const TYPE_COLORS: Record<EventType, string> = {
  inter_province: "bg-brand/10 text-brand-dark border-brand/20",
  nationalized: "bg-teal-50 text-teal-700 border-teal-200",
  coaching_camp: "bg-blue-50 text-blue-700 border-blue-200",
  local: "bg-lavender-50 text-brand-lavender border-brand-lavender/30",
  international: "bg-pink-50 text-brand-pink border-pink-200",
};

export default async function EventsPage({ searchParams }: PageProps) {
  await requireUser();
  const { year } = await searchParams;
  const selectedYear = year ? parseInt(year) : undefined;

  const allEvents = await getEvents({ year: selectedYear });
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Events</h1>
          <p className="text-text-grey mt-0.5">Manage meets and competitions</p>
        </div>
        <EventSlideOver
          trigger={
            <button className="flex items-center gap-2 px-4 py-2.5 bg-brand hover:bg-brand-dark text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Event
            </button>
          }
        />
      </div>

      {/* Year filter */}
      <div className="flex gap-2 flex-wrap">
        <Link href="/events" className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${!selectedYear ? "bg-brand text-white border-brand" : "bg-white text-text-grey border-purple-200 hover:border-brand"}`}>
          All Years
        </Link>
        {years.map((y) => (
          <Link key={y} href={`/events?year=${y}`} className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${selectedYear === y ? "bg-brand text-white border-brand" : "bg-white text-text-grey border-purple-200 hover:border-brand"}`}>
            {y}
          </Link>
        ))}
      </div>

      {/* Events table */}
      <div className="bg-white rounded-2xl border border-purple-100 overflow-hidden">
        {allEvents.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-brand-bg flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-text-dark font-semibold">No events yet</p>
            <p className="text-text-grey text-sm mt-1">Create your first event to start recording results.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-purple-100">
                <th className="text-left py-3 px-4 text-text-grey font-medium">Event</th>
                <th className="text-left py-3 px-4 text-text-grey font-medium">Type</th>
                <th className="text-left py-3 px-4 text-text-grey font-medium">Date</th>
                <th className="text-left py-3 px-4 text-text-grey font-medium">Location</th>
                <th className="text-left py-3 px-4 text-text-grey font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {allEvents.map((event) => (
                <tr key={event.id} className="border-b border-purple-50 hover:bg-brand-bg/50 transition-colors">
                  <td className="py-3 px-4">
                    <Link href={`/events/${event.id}`} className="font-medium text-text-dark hover:text-brand transition-colors">
                      {event.name}
                    </Link>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${TYPE_COLORS[event.type as EventType] ?? "bg-gray-100 text-text-grey border-gray-200"}`}>
                      {EVENT_TYPE_LABELS[event.type as EventType]}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-text-grey">
                    {new Date(event.eventDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="py-3 px-4 text-text-grey">{event.location ?? "—"}</td>
                  <td className="py-3 px-4">
                    {event.locked ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-600 border border-amber-200">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Locked
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-brand-teal border border-teal-200">
                        Open
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
