/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation";
import { getEventById } from "@/app/actions/events";
import { getResultsForEvent } from "@/app/actions/results";
import { getEventImages } from "@/app/actions/event-images";
import { requireUser } from "@/lib/auth-helpers";
import { EVENT_TYPE_LABELS, PLACE_LABELS, type EventType, type Place } from "@/lib/marks";
import PrintButton from "@/components/PrintButton";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const event = await getEventById(id);
  return { title: event ? `${event.name} — Event Report` : "Event Report" };
}

const MEDALS: { place: Place; label: string; emoji: string }[] = [
  { place: "1", label: "1st Place", emoji: "🥇" },
  { place: "2", label: "2nd Place", emoji: "🥈" },
  { place: "3", label: "3rd Place", emoji: "🥉" },
];

export default async function EventReportPage({ params }: PageProps) {
  await requireUser();
  const { id } = await params;

  const [event, allResults, images] = await Promise.all([
    getEventById(id),
    getResultsForEvent(id),
    getEventImages(id),
  ]);

  if (!event) notFound();

  const results = allResults.filter((r) => r.status === "approved");
  const pendingCount = allResults.filter((r) => r.status === "pending").length;

  const participants = new Set(results.map((r) => r.playerId)).size;
  const totalMarks = results.reduce((s, r) => s + r.marksAwarded, 0);
  const golds = results.filter((r) => r.place === "1");
  const silvers = results.filter((r) => r.place === "2");
  const bronzes = results.filter((r) => r.place === "3");
  const bestAthletes = results.filter((r) => r.bestAthlete);
  const meetRecords = results.filter((r) => r.meetRecord);

  // Results grouped by sport for the detailed section
  const sportsInEvent = Array.from(new Set(results.map((r) => r.sport ?? "Unspecified"))).sort();
  const bySport = sportsInEvent.map((sport) => ({
    sport,
    rows: results
      .filter((r) => (r.sport ?? "Unspecified") === sport)
      .sort((a, b) =>
        (a.discipline ?? "").localeCompare(b.discipline ?? "") || a.place.localeCompare(b.place)
      ),
  }));

  const heroImage = images[0];
  const galleryImages = images.length > 1 ? images.slice(1) : [];
  const eventDateLabel = new Date(event.eventDate).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });

  const categoryLabel = (r: (typeof results)[number]) =>
    [r.gender === "M" ? "Men's" : r.gender === "F" ? "Women's" : null, r.ageCategory]
      .filter(Boolean)
      .join(" · ") || "—";

  return (
    <div className="report-root">
      <style>{`
        .report-root { font-family: var(--font-inter), 'Inter', sans-serif; color: #2C2C3A; background: white; padding: 32px; min-height: 100vh; }
        @media print {
          .report-root { padding: 0; }
          .no-print { display: none; }
          @page { margin: 18mm; size: A4; }
          .cover { page-break-after: always; }
          .section-break { page-break-before: always; }
        }
        .cover { text-align: center; padding: 48px 24px; }
        .cover .band { font-size: 13px; font-weight: 700; color: #A05AFF; letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 32px; }
        .cover .type { display: inline-block; padding: 4px 16px; border-radius: 99px; font-size: 12px; font-weight: 600; background: #F5F0FF; color: #7E3FF2; border: 1px solid #E9E0FF; margin-bottom: 16px; }
        .cover h1 { font-size: 34px; font-weight: 700; line-height: 1.2; margin: 0 0 12px; }
        .cover .meta { font-size: 14px; color: #6B6B7B; margin: 0 0 32px; }
        .cover .hero { width: 100%; max-height: 360px; object-fit: cover; border-radius: 16px; border: 1px solid #E9E0FF; }
        .cover .report-title { margin-top: 40px; font-size: 12px; color: #6B6B7B; text-transform: uppercase; letter-spacing: 0.15em; }
        .report-root .header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 16px; border-bottom: 2px solid #A05AFF; margin-bottom: 24px; }
        .logo { font-size: 13px; font-weight: 700; color: #A05AFF; }
        .logo span { color: #6B6B7B; font-weight: 400; }
        .report-root h2 { font-size: 15px; font-weight: 700; margin: 24px 0 12px; color: #A05AFF; }
        .report-root h3 { font-size: 13px; font-weight: 700; margin: 16px 0 8px; }
        .info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; padding: 16px; background: #F5F0FF; border-radius: 12px; }
        .info-item label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #6B6B7B; display: block; margin-bottom: 2px; }
        .info-item p { font-size: 13px; font-weight: 600; margin: 0; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 8px; }
        .stat-card { padding: 12px; border-radius: 12px; text-align: center; }
        .stat-card.purple { background: linear-gradient(135deg, #A05AFF, #9E58FF); color: white; }
        .stat-card.teal { background: linear-gradient(135deg, #1BCFB4, #4BCBEB); color: white; }
        .stat-card.gold { background: linear-gradient(135deg, #F59E0B, #D97706); color: white; }
        .stat-card.silver { background: #F3F4F6; color: #4B5563; }
        .stat-card.bronze { background: #FEF3C7; color: #92400E; }
        .stat-card.pink { background: linear-gradient(135deg, #FE9496, #F43F5E); color: white; }
        .stat-card h4 { font-size: 22px; font-weight: 700; margin: 0; }
        .stat-card p { font-size: 10px; opacity: 0.85; margin: 2px 0 0; }
        .report-root table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .report-root th { text-align: left; padding: 8px 10px; color: #6B6B7B; font-weight: 500; border-bottom: 1px solid #E9E0FF; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; }
        .report-root td { padding: 8px 10px; border-bottom: 1px solid #F5F0FF; vertical-align: top; }
        .report-root tr { break-inside: avoid; }
        .place-badge { display: inline-block; padding: 1px 8px; border-radius: 99px; font-size: 11px; font-weight: 600; white-space: nowrap; }
        .place-1 { background: #FEF9C3; color: #92400E; }
        .place-2 { background: #F3F4F6; color: #4B5563; }
        .place-3 { background: #FEF3C7; color: #92400E; }
        .place-p { background: #F5F0FF; color: #7E3FF2; }
        .tag { display: inline-block; padding: 1px 7px; border-radius: 99px; font-size: 10px; font-weight: 600; margin-right: 3px; }
        .tag-teal { background: #E6F9F6; color: #1BCFB4; }
        .tag-pink { background: #FEE2E2; color: #FE9496; }
        .marks { font-weight: 700; color: #A05AFF; }
        .perf { font-family: ui-monospace, monospace; font-size: 11px; }
        .muted { color: #6B6B7B; }
        .notes-box { padding: 14px 16px; background: #F5F0FF; border-radius: 12px; font-size: 12px; color: #4B4B5C; line-height: 1.5; }
        .pending-note { margin-top: 8px; font-size: 11px; color: #92400E; background: #FEF3C7; border-radius: 8px; padding: 8px 12px; }
        .gallery { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .photo-card { break-inside: avoid; border: 1px solid #E9E0FF; border-radius: 12px; overflow: hidden; margin: 0; }
        .photo-card img { width: 100%; height: 220px; object-fit: cover; display: block; }
        .photo-card figcaption { padding: 8px 12px; font-size: 11px; color: #6B6B7B; }
        .report-root .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #E9E0FF; font-size: 11px; color: #6B6B7B; display: flex; justify-content: space-between; }
      `}</style>

      <PrintButton />

      {/* ── Cover page ── */}
      <div className="cover">
        <div className="band">Bank of Ceylon Sports Society</div>
        <div className="type">{EVENT_TYPE_LABELS[event.type as EventType]}</div>
        <h1>{event.name}</h1>
        <p className="meta">
          {eventDateLabel}
          {event.location ? ` · ${event.location}` : ""}
        </p>
        {heroImage && <img className="hero" src={heroImage.url} alt={heroImage.caption ?? event.name} />}
        <p className="report-title">Official Event Report · {event.year}</p>
      </div>

      {/* ── Summary ── */}
      <div className="header">
        <div className="logo">BOC Sports Society <span>· Event Report</span></div>
        <div style={{ fontSize: 12, color: "#6B6B7B" }}>
          Generated {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
        </div>
      </div>

      <div className="info-grid">
        <div className="info-item"><label>Event Type</label><p>{EVENT_TYPE_LABELS[event.type as EventType]}</p></div>
        <div className="info-item"><label>Date</label><p>{eventDateLabel}</p></div>
        <div className="info-item"><label>Location</label><p>{event.location ?? "—"}</p></div>
        <div className="info-item"><label>Status</label><p>{event.locked ? "Locked (finalised)" : "Open"}</p></div>
      </div>

      <h2>Event Summary</h2>
      <div className="stats-grid">
        <div className="stat-card purple"><h4>{participants}</h4><p>Participants</p></div>
        <div className="stat-card teal"><h4>{results.length}</h4><p>Results Recorded</p></div>
        <div className="stat-card gold"><h4>{golds.length}</h4><p>1st Places</p></div>
        <div className="stat-card silver"><h4>{silvers.length}</h4><p>2nd Places</p></div>
      </div>
      <div className="stats-grid">
        <div className="stat-card bronze"><h4>{bronzes.length}</h4><p>3rd Places</p></div>
        <div className="stat-card teal"><h4>{bestAthletes.length}</h4><p>Best Athletes</p></div>
        <div className="stat-card pink"><h4>{meetRecords.length}</h4><p>Meet Records</p></div>
        <div className="stat-card purple"><h4>{totalMarks}</h4><p>Total Marks Awarded</p></div>
      </div>
      {pendingCount > 0 && (
        <p className="pending-note">
          {pendingCount} result{pendingCount !== 1 ? "s" : ""} awaiting approval {pendingCount !== 1 ? "are" : "is"} not included in this report.
        </p>
      )}

      {event.notes && (
        <>
          <h2>Event Notes</h2>
          <div className="notes-box">{event.notes}</div>
        </>
      )}

      {/* ── Medal winners ── */}
      {(golds.length > 0 || silvers.length > 0 || bronzes.length > 0) && (
        <>
          <h2>Medal Winners</h2>
          <table>
            <thead>
              <tr>
                <th>Place</th>
                <th>Player</th>
                <th>Sport / Discipline</th>
                <th>Category</th>
                <th>Performance</th>
                <th style={{ textAlign: "right" }}>Marks</th>
              </tr>
            </thead>
            <tbody>
              {MEDALS.flatMap(({ place, label, emoji }) =>
                results
                  .filter((r) => r.place === place)
                  .map((r) => (
                    <tr key={r.id}>
                      <td style={{ whiteSpace: "nowrap" }}>{emoji} <span className={`place-badge place-${place}`}>{label}</span></td>
                      <td>
                        <strong>{r.playerName}</strong>
                        <div className="muted" style={{ fontSize: 11 }}>{r.playerEmployeeId} · {r.playerBranch}</div>
                        <div>
                          {r.bestAthlete && <span className="tag tag-teal">Best Athlete</span>}
                          {r.meetRecord && <span className="tag tag-pink">Meet Record</span>}
                        </div>
                      </td>
                      <td>{r.sport ?? "—"}{r.discipline ? ` · ${r.discipline}` : ""}</td>
                      <td>{categoryLabel(r)}</td>
                      <td className="perf">{r.performance ?? "—"}</td>
                      <td className="marks" style={{ textAlign: "right" }}>{r.marksAwarded}</td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </>
      )}

      {/* ── Full results by sport ── */}
      <div className="section-break">
        <h2>Full Results ({results.length})</h2>
        {results.length === 0 ? (
          <p className="muted" style={{ fontSize: 13 }}>No approved results recorded for this event.</p>
        ) : (
          bySport.map(({ sport, rows }) => (
            <div key={sport}>
              <h3>{sport} ({rows.length})</h3>
              <table style={{ marginBottom: 16 }}>
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Discipline</th>
                    <th>Category</th>
                    <th>Performance</th>
                    <th>Place</th>
                    <th>Achievements</th>
                    <th style={{ textAlign: "right" }}>Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <strong>{r.playerName}</strong>
                        <div className="muted" style={{ fontSize: 11 }}>{r.playerEmployeeId} · {r.playerBranch}</div>
                      </td>
                      <td>{r.discipline ?? "—"}</td>
                      <td>{categoryLabel(r)}</td>
                      <td className="perf">{r.performance ?? "—"}</td>
                      <td>
                        <span className={`place-badge ${r.place === "1" ? "place-1" : r.place === "2" ? "place-2" : r.place === "3" ? "place-3" : "place-p"}`}>
                          {PLACE_LABELS[r.place as Place]}
                        </span>
                      </td>
                      <td>
                        {r.bestAthlete && <span className="tag tag-teal">Best Athlete</span>}
                        {r.meetRecord && <span className="tag tag-pink">Meet Record</span>}
                        {!r.bestAthlete && !r.meetRecord && "—"}
                      </td>
                      <td className="marks" style={{ textAlign: "right" }}>{r.marksAwarded}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>

      {/* ── Photo gallery ── */}
      {galleryImages.length > 0 && (
        <div className="section-break">
          <h2>Photo Gallery</h2>
          <div className="gallery">
            {galleryImages.map((img) => (
              <figure className="photo-card" key={img.id}>
                <img src={img.url} alt={img.caption ?? "Event photo"} />
                {img.caption && <figcaption>{img.caption}</figcaption>}
              </figure>
            ))}
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <div className="footer">
        <span>Bank of Ceylon Sports Society — Confidential</span>
        <span>{event.name} · Official Event Report</span>
      </div>
    </div>
  );
}
