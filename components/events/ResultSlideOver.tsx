"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createResult, updateResult, type ResultFormData } from "@/app/actions/results";
import { calculateMarks, EVENT_TYPE_LABELS, PLACE_LABELS, type EventType, type Place } from "@/lib/marks";

const schema = z.object({
  playerId: z.string().min(1, "Player is required"),
  sport: z.string().min(1, "Sport is required"),
  discipline: z.string().optional(),
  gender: z.enum(["M", "F"]),
  ageCategory: z.string().optional(),
  performance: z.string().optional(),
  place: z.enum(["1", "2", "3", "participated"]),
  bestAthlete: z.boolean(),
  meetRecord: z.boolean(),
  notes: z.string().optional(),
});

interface Player {
  id: string;
  fullName: string;
  employeeId: string;
  branch: string;
  sport: string;
  gender: string;
}

interface ExistingResult {
  id: string;
  playerId: string;
  sport?: string | null;
  discipline?: string | null;
  gender?: string | null;
  ageCategory?: string | null;
  performance?: string | null;
  place: string;
  bestAthlete: boolean;
  meetRecord: boolean;
  notes?: string | null;
  playerName: string;
  playerSport?: string | null;
  playerGender?: string | null;
}

interface Props {
  eventId: string;
  eventType: EventType;
  players: Player[];
  sports: string[];
  sportDisciplines: Record<string, string[]>;
  ageCategories: string[];
  result?: ExistingResult;
  trigger: React.ReactNode;
}

export default function ResultSlideOver({ eventId, eventType, players, sports, sportDisciplines, ageCategories, result, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [playerSearch, setPlayerSearch] = useState("");

  const { register, control, handleSubmit, watch, setValue, formState: { errors, isSubmitting }, reset } = useForm<ResultFormData>({
    resolver: zodResolver(schema),
    defaultValues: result ? {
      playerId: result.playerId,
      sport: result.sport ?? "",
      discipline: result.discipline ?? "",
      gender: (result.gender ?? result.playerGender ?? "M") as "M" | "F",
      ageCategory: result.ageCategory ?? "",
      performance: result.performance ?? "",
      place: result.place as Place,
      bestAthlete: result.bestAthlete,
      meetRecord: result.meetRecord,
      notes: result.notes ?? "",
    } : { sport: "", discipline: "", gender: "M", ageCategory: "", performance: "", place: "participated", bestAthlete: false, meetRecord: false },
  });

  const watchedPlayerId = watch("playerId");
  const watchedPlace = watch("place");
  const watchedBestAthlete = watch("bestAthlete");
  const watchedMeetRecord = watch("meetRecord");
  const watchedSport = watch("sport");
  const watchedDiscipline = watch("discipline");
  const watchedGender = watch("gender");
  const watchedAgeCategory = watch("ageCategory");

  // When player changes, auto-select their sport if they only have one, and set gender
  useEffect(() => {
    if (!watchedPlayerId || result) return;
    const player = players.find(p => p.id === watchedPlayerId);
    if (!player) return;
    const playerSports = player.sport.split(",").map(s => s.trim()).filter(Boolean);
    if (playerSports.length === 1) {
      setValue("sport", playerSports[0]);
    } else {
      setValue("sport", "");
    }
    setValue("discipline", "");
    setValue("gender", (player as { gender?: string }).gender as "M" | "F" ?? "M");
  }, [watchedPlayerId, players, result, setValue]);

  // Reset discipline when sport changes
  useEffect(() => {
    if (!result) setValue("discipline", "");
  }, [watchedSport, result, setValue]);

  const previewMarks = calculateMarks(
    eventType,
    (watchedPlace as Place) ?? "participated",
    watchedBestAthlete ?? false,
    watchedMeetRecord ?? false
  );

  const filteredPlayers = players.filter((p) => {
    if (watchedGender && p.gender !== watchedGender) return false;
    if (!playerSearch) return true;
    const q = playerSearch.toLowerCase();
    return p.fullName.toLowerCase().includes(q) || p.employeeId.toLowerCase().includes(q);
  });

  const selectedPlayer = players.find(p => p.id === watchedPlayerId);
  const registeredSports = selectedPlayer
    ? selectedPlayer.sport.split(",").map(s => s.trim()).filter(Boolean)
    : result?.playerSport
      ? result.playerSport.split(",").map(s => s.trim()).filter(Boolean)
      : [];

  async function onSubmit(data: ResultFormData) {
    const res = result
      ? await updateResult(result.id, eventId, data)
      : await createResult(eventId, data);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(result ? "Result updated" : "Result added");
      setOpen(false);
      reset();
      setPlayerSearch("");
    }
  }

  return (
    <>
      <div onClick={() => setOpen(true)}>{trigger}</div>

      {open && <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setOpen(false)} />}

      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-purple-100">
          <div>
            <h2 className="text-lg font-semibold text-text-dark">{result ? "Edit Result" : "Add Result"}</h2>
            <p className="text-xs text-text-grey mt-0.5">{EVENT_TYPE_LABELS[eventType]}</p>
          </div>
          <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-xl hover:bg-brand-bg flex items-center justify-center text-text-grey">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">

            {/* Player search (create only) */}
            {!result && (
              <div>
                <label className="block text-sm font-medium text-text-dark mb-1">
                  Player <span className="text-brand-pink">*</span>
                </label>
                <input
                  type="text"
                  value={playerSearch}
                  onChange={(e) => setPlayerSearch(e.target.value)}
                  placeholder="Search by name or ID…"
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-brand-bg text-sm focus:outline-none focus:ring-2 focus:ring-brand mb-2"
                />
                <Controller
                  name="playerId"
                  control={control}
                  render={({ field }) => (
                    <div className="max-h-44 overflow-y-auto rounded-xl border border-purple-200 divide-y divide-purple-50">
                      {filteredPlayers.length === 0 && (
                        <p className="text-sm text-text-grey text-center py-4">No players found</p>
                      )}
                      {filteredPlayers.map((p) => (
                        <label key={p.id} className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${field.value === p.id ? "bg-brand/10" : "hover:bg-brand-bg"}`}>
                          <input type="radio" className="hidden" value={p.id} checked={field.value === p.id} onChange={() => field.onChange(p.id)} />
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${field.value === p.id ? "border-brand bg-brand" : "border-purple-200"}`}>
                            {field.value === p.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-dark">{p.fullName}</p>
                            <p className="text-xs text-text-grey">{p.employeeId} · {p.branch}</p>
                          </div>
                          <span className="text-xs text-text-grey shrink-0">{p.sport.split(",")[0]}{p.sport.includes(",") ? "…" : ""}</span>
                        </label>
                      ))}
                    </div>
                  )}
                />
                {errors.playerId && <p className="text-xs text-brand-pink mt-1">{errors.playerId.message}</p>}
              </div>
            )}

            {result && (
              <div className="px-3 py-2.5 rounded-xl bg-brand-bg border border-purple-200">
                <p className="text-xs text-text-grey">Player</p>
                <p className="text-sm font-medium text-text-dark">{result.playerName}</p>
              </div>
            )}

            {/* Sport picker — shown once player is selected */}
            {(watchedPlayerId || result) && sports.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-text-dark mb-1">
                  Sport <span className="text-brand-pink">*</span>
                </label>
                {registeredSports.length > 0 && (
                  <p className="text-xs text-text-grey mb-2">Registered sports are highlighted</p>
                )}
                <Controller
                  name="sport"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-2 gap-2">
                      {sports.map((s) => {
                        const isRegistered = registeredSports.includes(s);
                        const isSelected = field.value === s;
                        return (
                          <label key={s} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors text-sm ${isSelected ? "border-brand bg-brand/10 text-brand-dark font-medium" : isRegistered ? "border-brand/40 bg-brand/5 text-text-dark hover:border-brand/60" : "border-purple-200 bg-brand-bg text-text-grey hover:border-brand/50"}`}>
                            <input type="radio" className="hidden" value={s} checked={isSelected} onChange={() => field.onChange(s)} />
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? "border-brand bg-brand" : "border-purple-200"}`}>
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                            <span className="flex-1">{s}</span>
                            {isRegistered && !isSelected && (
                              <span className="text-xs text-brand/70 font-medium">★</span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  )}
                />
                {errors.sport && <p className="text-xs text-brand-pink mt-1">{errors.sport.message}</p>}
              </div>
            )}

            {/* Discipline picker — shown when selected sport has disciplines configured */}
            {watchedSport && (sportDisciplines[watchedSport]?.length ?? 0) > 0 && (
              <div>
                <label className="block text-sm font-medium text-text-dark mb-1">
                  Discipline / Event
                  <span className="text-text-grey font-normal ml-1">(optional)</span>
                </label>
                <Controller
                  name="discipline"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-2 gap-2">
                      {sportDisciplines[watchedSport].map((d) => {
                        const isSelected = field.value === d;
                        return (
                          <label key={d} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors text-sm ${isSelected ? "border-brand bg-brand/10 text-brand-dark font-medium" : "border-purple-200 bg-brand-bg text-text-grey hover:border-brand/50"}`}>
                            <input type="radio" className="hidden" value={d} checked={isSelected} onChange={() => field.onChange(isSelected ? "" : d)} />
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? "border-brand bg-brand" : "border-purple-200"}`}>
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                            {d}
                          </label>
                        );
                      })}
                    </div>
                  )}
                />
              </div>
            )}

            {/* Age category */}
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">
                Age Category
                <span className="text-text-grey font-normal ml-1">(optional)</span>
              </label>
              <Controller
                name="ageCategory"
                control={control}
                render={({ field }) => (
                  <div className="flex flex-wrap gap-2">
                    {ageCategories.map((cat) => {
                      const isSelected = field.value === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => field.onChange(isSelected ? "" : cat)}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${isSelected ? "border-brand bg-brand/10 text-brand-dark" : "border-purple-200 bg-brand-bg text-text-grey hover:border-brand/50"}`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                    {watchedAgeCategory && (
                      <button
                        type="button"
                        onClick={() => field.onChange("")}
                        className="px-3 py-1.5 rounded-xl border border-purple-200 bg-brand-bg text-text-grey hover:text-brand-pink text-xs transition-colors"
                      >
                        ✕ Clear
                      </button>
                    )}
                  </div>
                )}
              />
            </div>

            {/* Performance */}
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">
                Performance
                <span className="text-text-grey font-normal ml-1">(optional — e.g. 10.85s, 6.45m)</span>
              </label>
              <input
                {...register("performance")}
                type="text"
                placeholder="e.g. 10.85s or 6.45m"
                className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-brand-bg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>

            {/* Gender category */}
            <div>
              <label className="block text-sm font-medium text-text-dark mb-2">
                Category <span className="text-brand-pink">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["M", "F"] as const).map((g) => (
                  <label key={g} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors text-sm ${watchedGender === g ? "border-brand bg-brand/10 text-brand-dark font-medium" : "border-purple-200 bg-brand-bg text-text-grey hover:border-brand/50"}`}>
                    <input type="radio" className="hidden" value={g} {...register("gender")} />
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${watchedGender === g ? "border-brand bg-brand" : "border-purple-200"}`}>
                      {watchedGender === g && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    {g === "M" ? "Men's" : "Women's"}
                  </label>
                ))}
              </div>
            </div>

            {/* Place */}
            <div>
              <label className="block text-sm font-medium text-text-dark mb-2">
                Place <span className="text-brand-pink">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["1", "2", "3", "participated"] as Place[]).map((p) => (
                  <label key={p} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors text-sm ${watchedPlace === p ? "border-brand bg-brand/10 text-brand-dark font-medium" : "border-purple-200 bg-brand-bg text-text-grey hover:border-brand/50"}`}>
                    <input type="radio" className="hidden" value={p} {...register("place")} />
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${watchedPlace === p ? "border-brand bg-brand" : "border-purple-200"}`}>
                      {watchedPlace === p && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    {PLACE_LABELS[p]}
                  </label>
                ))}
              </div>
            </div>

            {/* Best Athlete & Meet Record */}
            <div className="space-y-2">
              <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-purple-200 bg-brand-bg cursor-pointer hover:border-brand/50 transition-colors">
                <Controller name="bestAthlete" control={control} render={({ field }) => (
                  <input type="checkbox" checked={field.value} onChange={field.onChange} className="w-4 h-4 rounded accent-brand" />
                )} />
                <div>
                  <p className="text-sm font-medium text-text-dark">Best Athlete</p>
                  <p className="text-xs text-text-grey">+3 marks</p>
                </div>
              </label>
              <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-purple-200 bg-brand-bg cursor-pointer hover:border-brand/50 transition-colors">
                <Controller name="meetRecord" control={control} render={({ field }) => (
                  <input type="checkbox" checked={field.value} onChange={field.onChange} className="w-4 h-4 rounded accent-brand" />
                )} />
                <div>
                  <p className="text-sm font-medium text-text-dark">Meet Record / Best Performance</p>
                  <p className="text-xs text-text-grey">+2 marks</p>
                </div>
              </label>
            </div>

            {/* Live marks preview */}
            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-gradient-to-r from-brand to-brand-lavender text-white">
              <p className="text-sm font-medium">Marks awarded</p>
              <p className="text-2xl font-bold">{previewMarks}</p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">
                Notes <span className="text-text-grey">(optional)</span>
              </label>
              <textarea {...register("notes")} rows={2} className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-brand-bg text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-none" />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-purple-100 flex gap-3">
            <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2.5 rounded-xl border border-purple-200 text-text-grey text-sm font-medium hover:bg-brand-bg transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 rounded-xl bg-brand hover:bg-brand-dark disabled:opacity-60 text-white text-sm font-semibold transition-colors">
              {isSubmitting ? "Saving…" : result ? "Save Changes" : "Add Result"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
