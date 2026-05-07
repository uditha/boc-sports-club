"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createSport, updateSport, createDiscipline, updateDiscipline,
  type SportRow, type DisciplineRow,
} from "@/app/actions/sports";

interface Props {
  sportsList: SportRow[];
  disciplinesBySport: Record<string, DisciplineRow[]>;
}

export default function SportManagement({ sportsList, disciplinesBySport }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Sport-level state
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [expandedSportId, setExpandedSportId] = useState<string | null>(null);

  // Discipline-level state (keyed by sportId)
  const [addingDisciplineFor, setAddingDisciplineFor] = useState<string | null>(null);
  const [newDisciplineName, setNewDisciplineName] = useState("");
  const [editingDisciplineId, setEditingDisciplineId] = useState<string | null>(null);
  const [editDisciplineName, setEditDisciplineName] = useState("");

  // ── Sport handlers ─────────────────────────────────────────────────────────

  async function handleAddSport(e: React.FormEvent) {
    e.preventDefault();
    const result = await createSport(newName);
    if (result.error) { toast.error(result.error); return; }
    toast.success("Sport added");
    setNewName("");
    setAdding(false);
    router.refresh();
  }

  async function handleRenameSport(id: string) {
    const result = await updateSport(id, { name: editName });
    if (result.error) { toast.error(result.error); return; }
    toast.success("Sport renamed");
    setEditingId(null);
    router.refresh();
  }

  function handleToggleSport(id: string, currentActive: boolean | number) {
    startTransition(async () => {
      const result = await updateSport(id, { active: !Boolean(currentActive) });
      if (result.error) { toast.error(result.error); return; }
      router.refresh();
    });
  }

  // ── Discipline handlers ────────────────────────────────────────────────────

  async function handleAddDiscipline(e: React.FormEvent, sportId: string) {
    e.preventDefault();
    const result = await createDiscipline(sportId, newDisciplineName);
    if (result.error) { toast.error(result.error); return; }
    toast.success("Discipline added");
    setNewDisciplineName("");
    setAddingDisciplineFor(null);
    router.refresh();
  }

  async function handleRenameDiscipline(id: string) {
    const result = await updateDiscipline(id, { name: editDisciplineName });
    if (result.error) { toast.error(result.error); return; }
    toast.success("Discipline renamed");
    setEditingDisciplineId(null);
    router.refresh();
  }

  function handleToggleDiscipline(id: string, currentActive: boolean | number) {
    startTransition(async () => {
      const result = await updateDiscipline(id, { active: !Boolean(currentActive) });
      if (result.error) { toast.error(result.error); return; }
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-grey">{sportsList.length} sport{sportsList.length !== 1 ? "s" : ""}</p>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand hover:bg-brand-dark text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Sport
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-purple-100 overflow-hidden divide-y divide-purple-50">
        {/* Add sport inline form */}
        {adding && (
          <form onSubmit={handleAddSport} className="flex items-center gap-3 px-5 py-3 bg-brand-bg/40">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Sport name e.g. Rugby"
              className="flex-1 px-3.5 py-2 rounded-xl border border-purple-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
            />
            <button type="submit" className="px-4 py-2 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-dark transition-colors">
              Add
            </button>
            <button type="button" onClick={() => { setAdding(false); setNewName(""); }}
              className="px-4 py-2 rounded-xl border border-purple-200 text-sm text-text-grey hover:bg-brand-bg transition-colors">
              Cancel
            </button>
          </form>
        )}

        {sportsList.length === 0 && !adding ? (
          <div className="text-center py-12 text-text-grey text-sm">
            No sports yet. Add one to get started.
          </div>
        ) : (
          sportsList.map((sport) => {
            const disciplines = disciplinesBySport[sport.id] ?? [];
            const isExpanded = expandedSportId === sport.id;

            return (
              <div key={sport.id}>
                {/* Sport row */}
                <div className="flex items-center gap-3 px-5 py-3 hover:bg-brand-bg/30 transition-colors">
                  {/* Expand toggle */}
                  <button
                    onClick={() => setExpandedSportId(isExpanded ? null : sport.id)}
                    className="flex items-center justify-center w-6 h-6 rounded-lg hover:bg-brand/10 text-text-grey hover:text-brand transition-colors flex-shrink-0"
                    title={isExpanded ? "Hide disciplines" : "Manage disciplines"}
                  >
                    <svg className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Sport name / rename input */}
                  <div className="flex-1 min-w-0">
                    {editingId === sport.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          autoFocus
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRenameSport(sport.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          className="px-3 py-1.5 rounded-xl border border-brand text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 w-40"
                        />
                        <button onClick={() => handleRenameSport(sport.id)}
                          className="px-3 py-1.5 rounded-xl bg-brand text-white text-xs font-semibold hover:bg-brand-dark transition-colors">
                          Save
                        </button>
                        <button onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 rounded-xl border border-purple-200 text-xs text-text-grey hover:bg-brand-bg transition-colors">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-text-dark text-sm">{sport.name}</span>
                        <span className="text-xs text-text-grey">
                          {disciplines.length > 0 ? `${disciplines.length} discipline${disciplines.length !== 1 ? "s" : ""}` : "no disciplines"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  <div className="hidden sm:block w-20">
                    {Boolean(sport.active) ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-teal-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-teal" />Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-text-grey">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />Inactive
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  {editingId !== sport.id && (
                    <div className="flex items-center gap-3">
                      <button onClick={() => { setEditingId(sport.id); setEditName(sport.name); }}
                        className="text-xs text-brand hover:text-brand-dark font-medium transition-colors">
                        Rename
                      </button>
                      <button onClick={() => handleToggleSport(sport.id, sport.active)} disabled={isPending}
                        className="text-xs text-text-grey hover:text-text-dark font-medium transition-colors disabled:opacity-50">
                        {Boolean(sport.active) ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Discipline accordion */}
                {isExpanded && (
                  <div className="bg-brand-bg/40 border-t border-purple-50 px-5 py-3 space-y-2">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-text-grey uppercase tracking-wide">Disciplines / Events</p>
                      {addingDisciplineFor !== sport.id && (
                        <button
                          onClick={() => { setAddingDisciplineFor(sport.id); setNewDisciplineName(""); }}
                          className="flex items-center gap-1 text-xs text-brand hover:text-brand-dark font-medium transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add discipline
                        </button>
                      )}
                    </div>

                    {/* Add discipline inline form */}
                    {addingDisciplineFor === sport.id && (
                      <form onSubmit={(e) => handleAddDiscipline(e, sport.id)} className="flex items-center gap-2 mb-2">
                        <input
                          autoFocus
                          value={newDisciplineName}
                          onChange={(e) => setNewDisciplineName(e.target.value)}
                          placeholder="e.g. 100m, Long Jump, Shot Put"
                          className="flex-1 px-3 py-1.5 rounded-xl border border-purple-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white"
                        />
                        <button type="submit" className="px-3 py-1.5 rounded-xl bg-brand text-white text-xs font-semibold hover:bg-brand-dark transition-colors">
                          Add
                        </button>
                        <button type="button" onClick={() => setAddingDisciplineFor(null)}
                          className="px-3 py-1.5 rounded-xl border border-purple-200 text-xs text-text-grey hover:bg-white transition-colors">
                          Cancel
                        </button>
                      </form>
                    )}

                    {disciplines.length === 0 && addingDisciplineFor !== sport.id ? (
                      <p className="text-xs text-text-grey py-1">No disciplines added yet. Add one to enable discipline selection in the result form.</p>
                    ) : (
                      <div className="space-y-1">
                        {disciplines.map((d) => (
                          <div key={d.id} className="flex items-center gap-3 px-3 py-2 bg-white rounded-xl border border-purple-100">
                            {editingDisciplineId === d.id ? (
                              <div className="flex items-center gap-2 flex-1">
                                <input
                                  autoFocus
                                  value={editDisciplineName}
                                  onChange={(e) => setEditDisciplineName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleRenameDiscipline(d.id);
                                    if (e.key === "Escape") setEditingDisciplineId(null);
                                  }}
                                  className="px-2.5 py-1 rounded-lg border border-brand text-xs focus:outline-none focus:ring-2 focus:ring-brand/30 flex-1"
                                />
                                <button onClick={() => handleRenameDiscipline(d.id)}
                                  className="px-2.5 py-1 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand-dark transition-colors">
                                  Save
                                </button>
                                <button onClick={() => setEditingDisciplineId(null)}
                                  className="px-2.5 py-1 rounded-lg border border-purple-200 text-xs text-text-grey hover:bg-brand-bg transition-colors">
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <>
                                <span className={`flex-1 text-xs font-medium ${Boolean(d.active) ? "text-text-dark" : "text-text-grey line-through"}`}>
                                  {d.name}
                                </span>
                                <button onClick={() => { setEditingDisciplineId(d.id); setEditDisciplineName(d.name); }}
                                  className="text-xs text-brand hover:text-brand-dark font-medium transition-colors">
                                  Rename
                                </button>
                                <button onClick={() => handleToggleDiscipline(d.id, d.active)} disabled={isPending}
                                  className="text-xs text-text-grey hover:text-text-dark font-medium transition-colors disabled:opacity-50">
                                  {Boolean(d.active) ? "Hide" : "Show"}
                                </button>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <p className="text-xs text-text-grey">
        Inactive sports are hidden from forms. Hidden disciplines won&apos;t appear in the result form but existing records are preserved.
      </p>
    </div>
  );
}
