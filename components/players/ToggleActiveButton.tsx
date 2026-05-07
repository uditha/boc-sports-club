"use client";

import { toast } from "sonner";
import { togglePlayerActive } from "@/app/actions/players";

export default function ToggleActiveButton({ id, active }: { id: string; active: boolean }) {
  async function handleToggle() {
    const result = await togglePlayerActive(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(active ? "Player deactivated" : "Player activated");
    }
  }

  return (
    <button
      onClick={handleToggle}
      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
        active
          ? "bg-pink-50 text-brand-pink hover:bg-pink-100 border border-pink-200"
          : "bg-green-50 text-brand-teal hover:bg-green-100 border border-green-200"
      }`}
    >
      {active ? "Deactivate" : "Activate"}
    </button>
  );
}
