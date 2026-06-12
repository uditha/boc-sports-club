"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { addEventImage, deleteEventImage } from "@/app/actions/event-images";

interface EventImage {
  id: string;
  url: string;
  caption: string | null;
  sortOrder: number;
}

interface Props {
  eventId: string;
  images: EventImage[];
  canEdit: boolean;
}

const MAX_DIMENSION = 1280;

async function compressImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.8);
}

export default function EventPhotos({ eventId, images, canEdit }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);

    let added = 0;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image`);
        continue;
      }
      try {
        const dataUrl = await compressImage(file);
        const res = await addEventImage(eventId, dataUrl, caption);
        if (res.error) {
          toast.error(`${file.name}: ${res.error}`);
        } else {
          added++;
        }
      } catch {
        toast.error(`Could not process ${file.name}`);
      }
    }

    setUploading(false);
    setCaption("");
    if (fileRef.current) fileRef.current.value = "";
    if (added > 0) {
      toast.success(`${added} photo${added !== 1 ? "s" : ""} added`);
      router.refresh();
    }
  }

  async function handleDelete(imageId: string) {
    if (!confirm("Remove this photo?")) return;
    const res = await deleteEventImage(imageId);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Photo removed");
      router.refresh();
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-purple-100 overflow-hidden">
      <div className="flex items-center justify-between gap-3 flex-wrap px-6 py-4 border-b border-purple-100">
        <h2 className="font-semibold text-text-dark">Photos ({images.length})</h2>
        {canEdit && (
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Caption for new photos (optional)"
              className="px-3 py-2 rounded-xl border border-purple-200 bg-brand-bg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand w-64"
            />
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-3 py-2 bg-brand hover:bg-brand-dark disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {uploading ? "Uploading…" : "Add Photos"}
            </button>
          </div>
        )}
      </div>

      {images.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-text-grey text-sm">No photos yet.</p>
          {canEdit && <p className="text-text-grey text-xs mt-1">Add photos of the meet — they appear in the event report book.</p>}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-6">
          {images.map((img) => (
            <figure key={img.id} className="group relative rounded-xl overflow-hidden border border-purple-100 bg-brand-bg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.caption ?? "Event photo"} className="w-full h-40 object-cover" />
              {img.caption && (
                <figcaption className="px-3 py-2 text-xs text-text-grey">{img.caption}</figcaption>
              )}
              {canEdit && (
                <button
                  onClick={() => handleDelete(img.id)}
                  title="Remove photo"
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 text-text-grey hover:text-brand-pink opacity-0 group-hover:opacity-100 transition-opacity shadow"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
