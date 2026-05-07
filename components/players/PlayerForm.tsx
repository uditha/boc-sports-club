"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { playerSchema, type PlayerFormData } from "@/lib/validations";
import type { Player } from "@/db/schema";

interface Props {
  player?: Player;
  sports: string[];
  onSubmit: (data: PlayerFormData) => Promise<void>;
  onCancel: () => void;
}

export default function PlayerForm({ player, sports, onSubmit, onCancel }: Props) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PlayerFormData>({
    resolver: zodResolver(playerSchema),
    defaultValues: player
      ? {
          fullName: player.fullName,
          employeeId: player.employeeId,
          branch: player.branch,
          sports: player.sport ? player.sport.split(",") : [],
          gender: player.gender,
          dateOfBirth: player.dateOfBirth ?? "",
          joinedYear: player.joinedYear ? String(player.joinedYear) : "",
          photoUrl: player.photoUrl ?? "",
          notes: player.notes ?? "",
        }
      : { sports: ["Athletics"] },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-text-dark mb-1">
            Full Name <span className="text-brand-pink">*</span>
          </label>
          <input
            {...register("fullName")}
            className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-brand-bg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            placeholder="e.g. Kasun Perera"
          />
          {errors.fullName && <p className="text-xs text-brand-pink mt-1">{errors.fullName.message}</p>}
        </div>

        {/* Employee ID */}
        <div>
          <label className="block text-sm font-medium text-text-dark mb-1">
            Employee ID <span className="text-brand-pink">*</span>
          </label>
          <input
            {...register("employeeId")}
            className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-brand-bg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            placeholder="e.g. BOC12345"
          />
          {errors.employeeId && <p className="text-xs text-brand-pink mt-1">{errors.employeeId.message}</p>}
        </div>

        {/* Branch */}
        <div>
          <label className="block text-sm font-medium text-text-dark mb-1">
            Branch <span className="text-brand-pink">*</span>
          </label>
          <input
            {...register("branch")}
            className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-brand-bg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            placeholder="e.g. Head Office, Kandy"
          />
          {errors.branch && <p className="text-xs text-brand-pink mt-1">{errors.branch.message}</p>}
        </div>

        {/* Sports — multi-select checkboxes */}
        <div>
          <label className="block text-sm font-medium text-text-dark mb-2">
            Sports <span className="text-brand-pink">*</span>
          </label>
          <Controller
            name="sports"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-2 gap-2">
                {sports.length === 0 ? (
                  <p className="text-xs text-text-grey col-span-2 py-2">No sports configured — add sports in Settings first.</p>
                ) : null}
                {sports.map((sport) => {
                  const checked = field.value?.includes(sport);
                  return (
                    <label
                      key={sport}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm cursor-pointer transition-colors ${
                        checked
                          ? "border-brand bg-brand/10 text-brand-dark font-medium"
                          : "border-purple-200 bg-brand-bg text-text-grey hover:border-brand/50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={checked}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...(field.value ?? []), sport]
                            : (field.value ?? []).filter((s) => s !== sport);
                          field.onChange(next);
                        }}
                      />
                      <span className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${
                        checked ? "bg-brand" : "border border-purple-200 bg-white"
                      }`}>
                        {checked && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      {sport}
                    </label>
                  );
                })}
              </div>
            )}
          />
          {errors.sports && <p className="text-xs text-brand-pink mt-1">{errors.sports.message}</p>}
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-text-dark mb-1">
            Gender <span className="text-brand-pink">*</span>
          </label>
          <select
            {...register("gender")}
            className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-brand-bg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          >
            <option value="">Select…</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
          </select>
          {errors.gender && <p className="text-xs text-brand-pink mt-1">{errors.gender.message}</p>}
        </div>

        {/* DOB & Joined Year */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-text-dark mb-1">Date of Birth</label>
            <input
              type="date"
              {...register("dateOfBirth")}
              className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-brand-bg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-dark mb-1">Joined Year</label>
            <input
              type="number"
              {...register("joinedYear")}
              className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-brand-bg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              placeholder="e.g. 2018"
              min={1950}
              max={new Date().getFullYear()}
            />
          </div>
        </div>

        {/* Photo URL */}
        <div>
          <label className="block text-sm font-medium text-text-dark mb-1">
            Photo URL <span className="text-text-grey">(optional)</span>
          </label>
          <input
            {...register("photoUrl")}
            className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-brand-bg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            placeholder="https://…"
          />
          {errors.photoUrl && <p className="text-xs text-brand-pink mt-1">{errors.photoUrl.message}</p>}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-text-dark mb-1">
            Notes <span className="text-text-grey">(optional)</span>
          </label>
          <textarea
            {...register("notes")}
            rows={3}
            className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-brand-bg text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-none"
            placeholder="Any additional notes…"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-purple-100 flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-purple-200 text-text-grey text-sm font-medium hover:bg-brand-bg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 py-2.5 rounded-xl bg-brand hover:bg-brand-dark disabled:opacity-60 text-white text-sm font-semibold transition-colors"
        >
          {isSubmitting ? "Saving…" : player ? "Save Changes" : "Add Player"}
        </button>
      </div>
    </form>
  );
}
