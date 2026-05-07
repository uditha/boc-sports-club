"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createEvent, updateEvent, type EventFormData } from "@/app/actions/events";
import { EVENT_TYPE_LABELS } from "@/lib/marks";
import type { Event } from "@/db/schema";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  type: z.enum(["inter_province", "nationalized", "coaching_camp", "local", "international"]),
  eventDate: z.string().min(1, "Date is required"),
  location: z.string().optional(),
  notes: z.string().optional(),
});

interface Props {
  event?: Event;
  trigger: React.ReactNode;
  onCreated?: (id: string) => void;
}

export default function EventSlideOver({ event, trigger, onCreated }: Props) {
  const [open, setOpen] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<EventFormData>({
    resolver: zodResolver(schema),
    defaultValues: event ? {
      name: event.name,
      type: event.type,
      eventDate: event.eventDate,
      location: event.location ?? "",
      notes: event.notes ?? "",
    } : { type: "inter_province" },
  });

  async function onSubmit(data: EventFormData) {
    const result = event
      ? await updateEvent(event.id, data)
      : await createEvent(data);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(event ? "Event updated" : "Event created");
      setOpen(false);
      reset();
      if (!event && "id" in result) onCreated?.(result.id as string);
    }
  }

  return (
    <>
      <div onClick={() => setOpen(true)}>{trigger}</div>

      {open && <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setOpen(false)} />}

      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-purple-100">
          <h2 className="text-lg font-semibold text-text-dark">{event ? "Edit Event" : "Create Event"}</h2>
          <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-xl hover:bg-brand-bg flex items-center justify-center text-text-grey">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">Event Name <span className="text-brand-pink">*</span></label>
              <input {...register("name")} className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-brand-bg text-sm focus:outline-none focus:ring-2 focus:ring-brand" placeholder="e.g. BOC Inter-Province Meet 2025" />
              {errors.name && <p className="text-xs text-brand-pink mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">Event Type <span className="text-brand-pink">*</span></label>
              <select {...register("type")} className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-brand-bg text-sm focus:outline-none focus:ring-2 focus:ring-brand">
                {(Object.entries(EVENT_TYPE_LABELS) as [string, string][]).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">Event Date <span className="text-brand-pink">*</span></label>
              <input type="date" {...register("eventDate")} className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-brand-bg text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
              {errors.eventDate && <p className="text-xs text-brand-pink mt-1">{errors.eventDate.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">Location <span className="text-text-grey">(optional)</span></label>
              <input {...register("location")} className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-brand-bg text-sm focus:outline-none focus:ring-2 focus:ring-brand" placeholder="e.g. Sugathadasa Stadium, Colombo" />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">Notes <span className="text-text-grey">(optional)</span></label>
              <textarea {...register("notes")} rows={3} className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-brand-bg text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-none" />
            </div>
          </div>

          <div className="px-6 py-4 border-t border-purple-100 flex gap-3">
            <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2.5 rounded-xl border border-purple-200 text-text-grey text-sm font-medium hover:bg-brand-bg transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 rounded-xl bg-brand hover:bg-brand-dark disabled:opacity-60 text-white text-sm font-semibold transition-colors">
              {isSubmitting ? "Saving…" : event ? "Save Changes" : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
