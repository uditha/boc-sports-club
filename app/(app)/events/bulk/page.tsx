import Link from "next/link";
import { requireEditor } from "@/lib/auth-helpers";
import { getEvents } from "@/app/actions/events";
import { getPlayers } from "@/app/actions/players";
import { getActiveSportNames, getAllDisciplinesBySport } from "@/app/actions/sports";
import { getActiveAgeCategoryNames } from "@/app/actions/ageCategories";
import BulkResultForm from "@/components/results/BulkResultForm";

interface PageProps {
  searchParams: Promise<{ eventId?: string }>;
}

export default async function BulkEntryPage({ searchParams }: PageProps) {
  await requireEditor();
  const { eventId } = await searchParams;

  const [allEvents, allPlayers, sportNames, disciplinesBySport, ageCategoryNames] = await Promise.all([
    getEvents(),
    getPlayers({ includeInactive: false }),
    getActiveSportNames(),
    getAllDisciplinesBySport(),
    getActiveAgeCategoryNames(),
  ]);

  const unlockedEvents = allEvents.filter((e) => !e.locked);
  const lockedEvents = allEvents.filter((e) => e.locked);
  const sortedEvents = [...unlockedEvents, ...lockedEvents];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 text-sm text-text-grey hover:text-brand transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Events
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-text-dark">Bulk Result Entry</h1>
        <p className="text-text-grey mt-0.5">Select an event, sport and discipline, then assign 1st, 2nd, 3rd and all participants at once</p>
      </div>

      <BulkResultForm
        events={sortedEvents}
        players={allPlayers}
        sports={sportNames}
        sportDisciplines={disciplinesBySport}
        ageCategories={ageCategoryNames}
        defaultEventId={eventId}
      />
    </div>
  );
}
