import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { players } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getPlayerHistory, getPlayerStats } from "@/app/actions/player-stats";
import { requireUser } from "@/lib/auth-helpers";
import { EVENT_TYPE_LABELS, PLACE_LABELS, type EventType, type Place } from "@/lib/marks";
import PrintButton from "@/components/PrintButton";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PlayerPrintPage({ params }: PageProps) {
  await requireUser();
  const { id } = await params;
  const db = getDb();

  const [player, history, stats] = await Promise.all([
    db.select().from(players).where(eq(players.id, id)).limit(1).then((r) => r[0]),
    getPlayerHistory(id),
    getPlayerStats(id),
  ]);

  if (!player) notFound();

  const initials = player.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <html lang="en">
      <head>
        <title>{player.fullName} — BOC Sports Profile</title>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Inter', sans-serif; color: #2C2C3A; background: white; padding: 32px; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
            @page { margin: 20mm; size: A4; }
          }
          .header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 20px; border-bottom: 2px solid #A05AFF; margin-bottom: 24px; }
          .logo { font-size: 13px; font-weight: 700; color: #A05AFF; }
          .logo span { color: #6B6B7B; font-weight: 400; }
          .player-header { display: flex; gap: 20px; align-items: flex-start; margin-bottom: 24px; }
          .avatar { width: 72px; height: 72px; border-radius: 16px; background: #A05AFF; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 700; color: white; flex-shrink: 0; }
          h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
          .badge { display: inline-block; padding: 2px 10px; border-radius: 99px; font-size: 11px; font-weight: 600; background: #E6F9F6; color: #1BCFB4; border: 1px solid #B3EFE7; }
          .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; padding: 16px; background: #F5F0FF; border-radius: 12px; margin-bottom: 24px; }
          .info-item label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #6B6B7B; display: block; margin-bottom: 2px; }
          .info-item p { font-size: 13px; font-weight: 600; }
          .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
          .stat-card { padding: 12px; border-radius: 12px; text-align: center; }
          .stat-card.purple { background: linear-gradient(135deg, #A05AFF, #9E58FF); color: white; }
          .stat-card.teal { background: linear-gradient(135deg, #1BCFB4, #4BCBEB); color: white; }
          .stat-card.blue { background: linear-gradient(135deg, #4BCBEB, #9E58FF); color: white; }
          .stat-card.gold { background: linear-gradient(135deg, #F59E0B, #D97706); color: white; }
          .stat-card h3 { font-size: 22px; font-weight: 700; }
          .stat-card p { font-size: 10px; opacity: 0.85; margin-top: 2px; }
          h2 { font-size: 14px; font-weight: 700; margin-bottom: 12px; color: #A05AFF; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { text-align: left; padding: 8px 10px; color: #6B6B7B; font-weight: 500; border-bottom: 1px solid #E9E0FF; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; }
          td { padding: 8px 10px; border-bottom: 1px solid #F5F0FF; }
          .place-badge { display: inline-block; padding: 1px 8px; border-radius: 99px; font-size: 11px; font-weight: 600; }
          .place-1 { background: #FEF9C3; color: #92400E; }
          .place-2 { background: #F3F4F6; color: #4B5563; }
          .place-3 { background: #FEF3C7; color: #92400E; }
          .place-p { background: #F5F0FF; color: #7E3FF2; }
          .tag { display: inline-block; padding: 1px 7px; border-radius: 99px; font-size: 10px; font-weight: 600; margin-right: 3px; }
          .tag-teal { background: #E6F9F6; color: #1BCFB4; }
          .tag-pink { background: #FEE2E2; color: #FE9496; }
          .marks { font-weight: 700; color: #A05AFF; }
          .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #E9E0FF; font-size: 11px; color: #6B6B7B; display: flex; justify-content: space-between; }
          .print-btn { position: fixed; bottom: 24px; right: 24px; padding: 10px 20px; background: #A05AFF; color: white; border: none; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; }
        `}</style>
      </head>
      <body>
        <PrintButton />

        {/* Page header */}
        <div className="header">
          <div className="logo">BOC Sports Society <span>· Player Profile</span></div>
          <div style={{ fontSize: 12, color: "#6B6B7B" }}>
            Generated {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </div>
        </div>

        {/* Player header */}
        <div className="player-header">
          {player.photoUrl ? (
            <img src={player.photoUrl} alt={player.fullName} style={{ width: 72, height: 72, borderRadius: 16, objectFit: "cover", flexShrink: 0 }} />
          ) : (
            <div className="avatar">{initials}</div>
          )}
          <div>
            <h1>{player.fullName}</h1>
            <p style={{ color: "#6B6B7B", fontSize: 13, marginBottom: 6 }}>{player.branch}</p>
            <span className="badge">{player.active ? "Active" : "Inactive"}</span>
          </div>
        </div>

        {/* Info grid */}
        <div className="info-grid">
          <div className="info-item"><label>Employee ID</label><p>{player.employeeId}</p></div>
          <div className="info-item"><label>Gender</label><p>{player.gender === "M" ? "Male" : "Female"}</p></div>
          <div className="info-item"><label>Joined Year</label><p>{player.joinedYear ?? "—"}</p></div>
          <div className="info-item"><label>Date of Birth</label><p>{player.dateOfBirth ?? "—"}</p></div>
          <div className="info-item" style={{ gridColumn: "span 2" }}>
            <label>Sports</label>
            <p>{player.sport.split(",").map((s) => s.trim()).filter(Boolean).join(" · ")}</p>
          </div>
        </div>

        {/* Stats */}
        <h2>Performance Summary</h2>
        <div className="stats-grid">
          <div className="stat-card purple"><h3>{stats.totalEvents}</h3><p>Total Events</p></div>
          <div className="stat-card teal"><h3>{stats.totalMarks}</h3><p>Lifetime Marks</p></div>
          <div className="stat-card blue"><h3>{stats.marksThisYear}</h3><p>Marks This Year</p></div>
          <div className="stat-card gold"><h3>{stats.firstPlaces}</h3><p>1st Places</p></div>
        </div>
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card" style={{ background: "#F3F4F6", color: "#4B5563" }}><h3>{stats.secondPlaces}</h3><p>2nd Places</p></div>
          <div className="stat-card" style={{ background: "#FEF3C7", color: "#92400E" }}><h3>{stats.thirdPlaces}</h3><p>3rd Places</p></div>
          <div className="stat-card teal"><h3>{stats.bestAthleteCount}</h3><p>Best Athlete</p></div>
          <div className="stat-card" style={{ background: "linear-gradient(135deg,#FE9496,#F43F5E)", color: "white" }}><h3>{stats.meetRecordCount}</h3><p>Meet Records</p></div>
        </div>

        {/* History table */}
        <h2>Competition History ({history.length} events)</h2>
        {history.length === 0 ? (
          <p style={{ color: "#6B6B7B", fontSize: 13 }}>No events recorded yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Event</th>
                <th>Type</th>
                <th>Date</th>
                <th>Place</th>
                <th>Achievements</th>
                <th style={{ textAlign: "right" }}>Marks</th>
              </tr>
            </thead>
            <tbody>
              {history.map((r) => (
                <tr key={r.resultId}>
                  <td style={{ fontWeight: 500 }}>{r.eventName}</td>
                  <td style={{ color: "#6B6B7B" }}>{EVENT_TYPE_LABELS[r.eventType as EventType]}</td>
                  <td style={{ color: "#6B6B7B", whiteSpace: "nowrap" }}>
                    {new Date(r.eventDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
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
        )}

        {/* Footer */}
        <div className="footer">
          <span>Bank of Ceylon Sports Society — Confidential</span>
          <span>{player.fullName} · Generated for Selection Committee</span>
        </div>

      </body>
    </html>
  );
}
