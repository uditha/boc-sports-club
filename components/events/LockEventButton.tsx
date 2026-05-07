"use client";

import { toast } from "sonner";
import { toggleLockEvent } from "@/app/actions/events";

export default function LockEventButton({ id, locked }: { id: string; locked: boolean }) {
  async function handleToggle() {
    const result = await toggleLockEvent(id);
    if (result.error) toast.error(result.error);
    else toast.success(locked ? "Event unlocked" : "Event locked — no further edits allowed");
  }

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
        locked
          ? "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100"
          : "bg-gray-50 text-text-grey border-gray-200 hover:bg-gray-100"
      }`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {locked ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
        )}
      </svg>
      {locked ? "Locked" : "Lock Event"}
    </button>
  );
}
