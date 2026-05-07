"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createBulkResults, type BulkEntry } from "@/app/actions/results";
import { calculateMarks, EVENT_TYPE_LABELS, type EventType, type Place } from "@/lib/marks";


interface EventOption {
  id: string;
  name: string;
  type: string;
  eventDate: string;
  locked: boolean;
}

interface Player {
  id: string;
  fullName: string;
  employeeId: string;
  branch: string;
  sport: string;
  gender: string;
}

interface Props {
  events: EventOption[];
  players: Player[];
  sports: string[];
  sportDisciplines: Record<string, string[]>;
  ageCategories: string[];
  defaultEventId?: string;
}

type PlaceSlot = { playerId: string; bestAthlete: boolean; meetRecord: boolean } | null;

const PLACE_CONFIG = [
  { place: "1" as Place, label: "1st Place", emoji: "🥇", color: "border-yellow-300 bg-yellow-50", selectedColor: "border-yellow-400 bg-yellow-100" },
  { place: "2" as Place, label: "2nd Place", emoji: "🥈", color: "border-gray-300 bg-gray-50", selectedColor: "border-gray-400 bg-gray-100" },
  { place: "3" as Place, label: "3rd Place", emoji: "🥉", color: "border-amber-300 bg-amber-50", selectedColor: "border-amber-400 bg-amber-100" },
];

function PlayerList({
  players,
  selectedId,
  onSelect,
  search,
  onSearch,
  excludeIds,
  multiSelect,
  selectedIds,
  onToggle,
  placeholder,
}: {
  players: Player[];
  selectedId?: string;
  onSelect?: (id: string | null) => void;
  search: string;
  onSearch: (v: string) => void;
  excludeIds: Set<string>;
  multiSelect?: boolean;
  selectedIds?: Set<string>;
  onToggle?: (id: string) => void;
  placeholder?: string;
}) {
  const filtered = players.filter((p) => {
    if (excludeIds.has(p.id)) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return p.fullName.toLowerCase().includes(q) || p.employeeId.toLowerCase().includes(q);
  });

  return (
    <div>
      <input
        type="text"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder={placeholder ?? "Search by name or ID…"}
        className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-brand-bg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand mb-2"
      />
      <div className="max-h-48 overflow-y-auto rounded-xl border border-purple-200 divide-y divide-purple-50">
        {filtered.length === 0 && (
          <p className="text-sm text-text-grey text-center py-4">No players found</p>
        )}
        {filtered.map((p) => {
          const isSelected = multiSelect ? selectedIds?.has(p.id) : selectedId === p.id;
          return (
            <label
              key={p.id}
              className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${isSelected ? "bg-brand/10" : "hover:bg-brand-bg"}`}
            >
              {multiSelect ? (
                <input
                  type="checkbox"
                  className="hidden"
                  checked={isSelected}
                  onChange={() => onToggle?.(p.id)}
                />
              ) : (
                <input
                  type="radio"
                  className="hidden"
                  checked={isSelected}
                  onChange={() => onSelect?.(isSelected ? null : p.id)}
                />
              )}
              <div className={`flex-shrink-0 ${multiSelect ? "w-4 h-4 rounded border-2 flex items-center justify-center" : "w-4 h-4 rounded-full border-2 flex items-center justify-center"} ${isSelected ? "border-brand bg-brand" : "border-purple-200"}`}>
                {isSelected && (
                  multiSelect
                    ? <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12"><path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
                    : <div className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-dark">{p.fullName}</p>
                <p className="text-xs text-text-grey">{p.employeeId} · {p.branch}</p>
              </div>
              <span className="text-xs text-text-grey shrink-0">{p.sport.split(",")[0]}{p.sport.includes(",") ? "…" : ""}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export default function BulkResultForm({ events, players, sports, sportDisciplines, ageCategories, defaultEventId }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  // Step 1 state
  const [eventId, setEventId] = useState(defaultEventId ?? "");
  const [sport, setSport] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [gender, setGender] = useState<"M" | "F">("M");
  const [ageCategory, setAgeCategory] = useState("");

  // Place slots
  const [slots, setSlots] = useState<[PlaceSlot, PlaceSlot, PlaceSlot]>([null, null, null]);
  const [participantIds, setParticipantIds] = useState<Set<string>>(new Set());

  // Search state per section
  const [searches, setSearches] = useState({ s0: "", s1: "", s2: "", part: "" });

  const selectedEvent = events.find((e) => e.id === eventId);
  const disciplines = sport ? (sportDisciplines[sport] ?? []) : [];
  const genderedPlayers = players.filter((p) => p.gender === gender);

  // All currently assigned player IDs
  const assignedIds = useMemo(() => {
    const ids = new Set<string>();
    slots.forEach((s) => { if (s) ids.add(s.playerId); });
    participantIds.forEach((id) => ids.add(id));
    return ids;
  }, [slots, participantIds]);

  function setSlot(index: 0 | 1 | 2, playerId: string | null) {
    setSlots((prev) => {
      const next: [PlaceSlot, PlaceSlot, PlaceSlot] = [...prev] as [PlaceSlot, PlaceSlot, PlaceSlot];
      if (!playerId) {
        next[index] = null;
      } else {
        // Remove from participants if was there
        setParticipantIds((p) => { const s = new Set(p); s.delete(playerId); return s; });
        // Clear from other slots
        next.forEach((s, i) => { if (i !== index && s?.playerId === playerId) next[i] = null; });
        next[index] = { playerId, bestAthlete: prev[index]?.playerId === playerId ? (prev[index]?.bestAthlete ?? false) : false, meetRecord: prev[index]?.playerId === playerId ? (prev[index]?.meetRecord ?? false) : false };
      }
      return next;
    });
  }

  function toggleSlotFlag(index: 0 | 1 | 2, flag: "bestAthlete" | "meetRecord") {
    setSlots((prev) => {
      const next: [PlaceSlot, PlaceSlot, PlaceSlot] = [...prev] as [PlaceSlot, PlaceSlot, PlaceSlot];
      if (next[index]) next[index] = { ...next[index]!, [flag]: !next[index]![flag] };
      return next;
    });
  }

  function toggleParticipant(playerId: string) {
    setParticipantIds((prev) => {
      const next = new Set(prev);
      if (next.has(playerId)) {
        next.delete(playerId);
      } else {
        // Remove from slots if there
        setSlots((s) => {
          const n: [PlaceSlot, PlaceSlot, PlaceSlot] = [...s] as [PlaceSlot, PlaceSlot, PlaceSlot];
          n.forEach((slot, i) => { if (slot?.playerId === playerId) n[i] = null; });
          return n;
        });
        next.add(playerId);
      }
      return next;
    });
  }

  function resetAssignments() {
    setSlots([null, null, null]);
    setParticipantIds(new Set());
    setSearches({ s0: "", s1: "", s2: "", part: "" });
  }

  const totalEntries = slots.filter(Boolean).length + participantIds.size;
  const canSubmit = eventId && sport && totalEntries > 0 && !submitting;

  function handleGenderChange(g: "M" | "F") {
    setGender(g);
    resetAssignments();
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);

    const entries: BulkEntry[] = [];
    slots.forEach((s, i) => {
      if (!s) return;
      entries.push({ playerId: s.playerId, place: String(i + 1) as Place, bestAthlete: s.bestAthlete, meetRecord: s.meetRecord });
    });
    participantIds.forEach((pid) => {
      entries.push({ playerId: pid, place: "participated", bestAthlete: false, meetRecord: false });
    });

    const res = await createBulkResults(eventId, sport, discipline || null, gender, ageCategory || null, entries);
    setSubmitting(false);

    if (res.error) {
      toast.error(res.error);
      return;
    }

    const { inserted = 0, skipped = 0 } = res as { inserted: number; skipped: number };
    if (skipped > 0) {
      toast.warning(`${inserted} result${inserted !== 1 ? "s" : ""} added. ${skipped} player${skipped !== 1 ? "s" : ""} skipped (already have results for this event).`);
    } else {
      toast.success(`${inserted} result${inserted !== 1 ? "s" : ""} added successfully`);
    }

    resetAssignments();
    router.refresh();
  }

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Step 1: Event + Sport + Discipline */}
      <div className="bg-white rounded-2xl border border-purple-100 p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-text-dark mb-0.5">Event & Sport</h2>
          <p className="text-sm text-text-grey">Select what you&apos;re recording results for</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-dark mb-1">Event <span className="text-brand-pink">*</span></label>
          <select
            value={eventId}
            onChange={(e) => { setEventId(e.target.value); resetAssignments(); }}
            className="w-full px-3 py-2.5 rounded-xl border border-purple-200 bg-brand-bg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
          >
            <option value="">Select an event…</option>
            {events.map((e) => (
              <option key={e.id} value={e.id} disabled={e.locked}>
                {e.name} ({new Date(e.eventDate).getFullYear()}){e.locked ? " — Locked" : ""}
              </option>
            ))}
          </select>
          {selectedEvent && (
            <p className="text-xs text-text-grey mt-1">{EVENT_TYPE_LABELS[selectedEvent.type as EventType]} · {new Date(selectedEvent.eventDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-dark mb-1">Sport <span className="text-brand-pink">*</span></label>
            <select
              value={sport}
              onChange={(e) => { setSport(e.target.value); setDiscipline(""); resetAssignments(); }}
              className="w-full px-3 py-2.5 rounded-xl border border-purple-200 bg-brand-bg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
            >
              <option value="">Select sport…</option>
              {sports.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-dark mb-1">
              Discipline
              <span className="text-text-grey font-normal ml-1">(optional)</span>
            </label>
            <select
              value={discipline}
              onChange={(e) => setDiscipline(e.target.value)}
              disabled={disciplines.length === 0}
              className="w-full px-3 py-2.5 rounded-xl border border-purple-200 bg-brand-bg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand disabled:opacity-50"
            >
              <option value="">{disciplines.length === 0 ? "No disciplines configured" : "Any / not specified"}</option>
              {disciplines.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-dark mb-2">Category <span className="text-brand-pink">*</span></label>
          <div className="grid grid-cols-2 gap-3">
            {(["M", "F"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => handleGenderChange(g)}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-colors ${gender === g ? "border-brand bg-brand/10 text-brand-dark" : "border-purple-200 bg-brand-bg text-text-grey hover:border-brand/50"}`}
              >
                <span className="text-base">{g === "M" ? "♂" : "♀"}</span>
                {g === "M" ? "Men's" : "Women's"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-dark mb-2">
            Age Category
            <span className="text-text-grey font-normal ml-1">(optional)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {ageCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setAgeCategory((prev) => (prev === cat ? "" : cat))}
                className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${ageCategory === cat ? "border-brand bg-brand/10 text-brand-dark" : "border-purple-200 bg-brand-bg text-text-grey hover:border-brand/50"}`}
              >
                {cat}
              </button>
            ))}
            {ageCategory && (
              <button
                type="button"
                onClick={() => setAgeCategory("")}
                className="px-3 py-1.5 rounded-xl border border-purple-200 bg-brand-bg text-text-grey hover:text-brand-pink text-xs transition-colors"
              >
                ✕ Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Step 2: Assign players (only shown once event + sport are set) */}
      {eventId && sport && (
        <>
          {/* Place slots */}
          {PLACE_CONFIG.map((config, index) => {
            const slot = slots[index as 0 | 1 | 2];
            const excludeForSlot = new Set(assignedIds);
            if (slot) excludeForSlot.delete(slot.playerId);

            const marks = slot
              ? calculateMarks(selectedEvent!.type as EventType, config.place, slot.bestAthlete, slot.meetRecord)
              : calculateMarks(selectedEvent!.type as EventType, config.place, false, false);

            const searchKey = `s${index}` as "s0" | "s1" | "s2";

            return (
              <div key={config.place} className={`bg-white rounded-2xl border-2 p-5 space-y-3 ${slot ? config.selectedColor : config.color}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{config.emoji}</span>
                    <h3 className="font-semibold text-text-dark">{config.label}</h3>
                    {slot && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-brand text-white font-medium">
                        {players.find((p) => p.id === slot.playerId)?.fullName}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {slot && (
                      <>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={slot.bestAthlete}
                            onChange={() => toggleSlotFlag(index as 0 | 1 | 2, "bestAthlete")}
                            className="w-3.5 h-3.5 rounded accent-brand"
                          />
                          <span className="text-xs text-text-grey">Best Athlete <span className="text-brand">+3</span></span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={slot.meetRecord}
                            onChange={() => toggleSlotFlag(index as 0 | 1 | 2, "meetRecord")}
                            className="w-3.5 h-3.5 rounded accent-brand"
                          />
                          <span className="text-xs text-text-grey">Meet Record <span className="text-brand">+2</span></span>
                        </label>
                      </>
                    )}
                    <span className="text-sm font-bold text-brand bg-brand/10 px-2.5 py-0.5 rounded-lg">{marks} marks</span>
                  </div>
                </div>

                <PlayerList
                  players={genderedPlayers}
                  selectedId={slot?.playerId}
                  onSelect={(id) => setSlot(index as 0 | 1 | 2, id)}
                  search={searches[searchKey]}
                  onSearch={(v) => setSearches((p) => ({ ...p, [searchKey]: v }))}
                  excludeIds={excludeForSlot}
                  placeholder={`Search for ${config.label} player…`}
                />
              </div>
            );
          })}

          {/* Participants */}
          <div className="bg-white rounded-2xl border-2 border-purple-200 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎽</span>
                <h3 className="font-semibold text-text-dark">Participants</h3>
                {participantIds.size > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-brand/10 text-brand font-medium">
                    {participantIds.size} selected
                  </span>
                )}
              </div>
              <span className="text-sm font-bold text-brand bg-brand/10 px-2.5 py-0.5 rounded-lg">
                {calculateMarks(selectedEvent!.type as EventType, "participated", false, false)} marks each
              </span>
            </div>

            <PlayerList
              players={genderedPlayers}
              search={searches.part}
              onSearch={(v) => setSearches((p) => ({ ...p, part: v }))}
              excludeIds={new Set([...slots.filter(Boolean).map((s) => s!.playerId)])}
              multiSelect
              selectedIds={participantIds}
              onToggle={toggleParticipant}
              placeholder="Search participants…"
            />
          </div>

          {/* Submit */}
          <div className="bg-white rounded-2xl border border-purple-100 p-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="font-medium text-text-dark">
                  {totalEntries === 0
                    ? "No players assigned yet"
                    : `${totalEntries} result${totalEntries !== 1 ? "s" : ""} ready to submit`}
                </p>
                <p className="text-sm text-text-grey mt-0.5">
                  {sport}{discipline ? ` · ${discipline}` : ""}{ageCategory ? ` · ${ageCategory}` : ""} · {selectedEvent?.name}
                </p>
              </div>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="px-6 py-2.5 rounded-xl bg-brand hover:bg-brand-dark disabled:opacity-50 text-white text-sm font-semibold transition-colors"
              >
                {submitting ? "Saving…" : `Add ${totalEntries || ""} Result${totalEntries !== 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
