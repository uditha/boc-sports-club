"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createAgeCategory, updateAgeCategory, type AgeCategoryRow } from "@/app/actions/ageCategories";

interface Props {
  categories: AgeCategoryRow[];
}

export default function AgeCategoryManagement({ categories }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const result = await createAgeCategory(newName);
    if (result.error) { toast.error(result.error); return; }
    toast.success("Age category added");
    setNewName("");
    setAdding(false);
    router.refresh();
  }

  async function handleRename(id: string) {
    const result = await updateAgeCategory(id, { name: editName });
    if (result.error) { toast.error(result.error); return; }
    toast.success("Renamed");
    setEditingId(null);
    router.refresh();
  }

  function handleToggle(id: string, currentActive: boolean | number) {
    startTransition(async () => {
      const result = await updateAgeCategory(id, { active: !Boolean(currentActive) });
      if (result.error) { toast.error(result.error); return; }
      router.refresh();
    });
  }

  const active = categories.filter((c) => Boolean(c.active));
  const inactive = categories.filter((c) => !Boolean(c.active));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-grey">
          {active.length} active{inactive.length > 0 ? `, ${inactive.length} hidden` : ""}
        </p>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand hover:bg-brand-dark text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Category
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-purple-100 overflow-hidden divide-y divide-purple-50">
        {/* Add form */}
        {adding && (
          <form onSubmit={handleAdd} className="flex items-center gap-3 px-5 py-3 bg-brand-bg/40">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Masters 60+"
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

        {categories.length === 0 && !adding ? (
          <div className="text-center py-12 text-text-grey text-sm">No categories yet.</div>
        ) : (
          categories.map((cat) => {
            const isActive = Boolean(cat.active);
            return (
              <div key={cat.id} className="flex items-center gap-3 px-5 py-3 hover:bg-brand-bg/30 transition-colors">
                {/* Category name / rename input */}
                <div className="flex-1 min-w-0">
                  {editingId === cat.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRename(cat.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="px-3 py-1.5 rounded-xl border border-brand text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 w-44"
                      />
                      <button onClick={() => handleRename(cat.id)}
                        className="px-3 py-1.5 rounded-xl bg-brand text-white text-xs font-semibold hover:bg-brand-dark transition-colors">
                        Save
                      </button>
                      <button onClick={() => setEditingId(null)}
                        className="px-3 py-1.5 rounded-xl border border-purple-200 text-xs text-text-grey hover:bg-brand-bg transition-colors">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <span className={`font-medium text-sm ${isActive ? "text-text-dark" : "text-text-grey line-through"}`}>
                      {cat.name}
                    </span>
                  )}
                </div>

                {/* Status dot */}
                <div className="hidden sm:block w-20">
                  {isActive ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-teal-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-teal" />Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs text-text-grey">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />Hidden
                    </span>
                  )}
                </div>

                {/* Actions */}
                {editingId !== cat.id && (
                  <div className="flex items-center gap-3">
                    <button onClick={() => { setEditingId(cat.id); setEditName(cat.name); }}
                      className="text-xs text-brand hover:text-brand-dark font-medium transition-colors">
                      Rename
                    </button>
                    <button onClick={() => handleToggle(cat.id, cat.active)} disabled={isPending}
                      className="text-xs text-text-grey hover:text-text-dark font-medium transition-colors disabled:opacity-50">
                      {isActive ? "Hide" : "Show"}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <p className="text-xs text-text-grey">
        Hidden categories won&apos;t appear in result forms but existing records are preserved.
      </p>
    </div>
  );
}
