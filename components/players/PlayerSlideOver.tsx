"use client";

import { useState } from "react";
import { toast } from "sonner";
import PlayerForm from "./PlayerForm";
import { createPlayer, updatePlayer } from "@/app/actions/players";
import type { Player } from "@/db/schema";
import type { PlayerFormData } from "@/lib/validations";

interface Props {
  player?: Player;
  sports: string[];
  trigger: React.ReactNode;
}

export default function PlayerSlideOver({ player, sports, trigger }: Props) {
  const [open, setOpen] = useState(false);

  async function handleSubmit(data: PlayerFormData) {
    const result = player
      ? await updatePlayer(player.id, data)
      : await createPlayer(data);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(player ? "Player updated successfully" : "Player added successfully");
      setOpen(false);
    }
  }

  return (
    <>
      <div onClick={() => setOpen(true)}>{trigger}</div>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-over panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-purple-100">
          <h2 className="text-lg font-semibold text-text-dark">
            {player ? "Edit Player" : "Add New Player"}
          </h2>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 rounded-xl hover:bg-brand-bg flex items-center justify-center text-text-grey transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 min-h-0 flex flex-col">
          <PlayerForm
            player={player}
            sports={sports}
            onSubmit={handleSubmit}
            onCancel={() => setOpen(false)}
          />
        </div>
      </div>
    </>
  );
}
