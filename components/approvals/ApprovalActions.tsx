"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { approveResult, rejectResult } from "@/app/actions/results";

interface Props {
  resultId: string;
}

export function ApproveButton({ resultId }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handle() {
    setLoading(true);
    const res = await approveResult(resultId);
    setLoading(false);
    if (res.error) { toast.error(res.error); return; }
    toast.success("Result approved");
    router.refresh();
  }

  return (
    <button
      onClick={handle}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-teal/10 text-teal-700 text-xs font-semibold hover:bg-brand-teal/20 transition-colors disabled:opacity-50"
    >
      {loading ? "…" : "✓ Approve"}
    </button>
  );
}

export function RejectButton({ resultId }: Props) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handle() {
    setLoading(true);
    const res = await rejectResult(resultId, notes);
    setLoading(false);
    if (res.error) { toast.error(res.error); return; }
    toast.success("Result rejected");
    setOpen(false);
    setNotes("");
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-pink/10 text-rose-700 text-xs font-semibold hover:bg-brand-pink/20 transition-colors"
      >
        ✕ Reject
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <input
        type="text"
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Reason (optional)"
        className="border border-purple-200 rounded-lg px-2 py-1 text-xs text-text-dark focus:outline-none focus:ring-1 focus:ring-brand w-44"
      />
      <button
        onClick={handle}
        disabled={loading}
        className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors disabled:opacity-50"
      >
        {loading ? "…" : "Confirm Reject"}
      </button>
      <button
        onClick={() => { setOpen(false); setNotes(""); }}
        className="px-2 py-1.5 rounded-lg text-text-grey text-xs hover:text-text-dark transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}
