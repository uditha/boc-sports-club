// @ts-nocheck — @react-pdf/renderer has a known JSX type conflict with React 19
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import type { AnnualReportData } from "@/app/actions/reports";

Font.registerHyphenationCallback(word => [word]);

const PURPLE  = "#A05AFF";
const TEAL    = "#1BCFB4";
const BLUE    = "#4BCBEB";
const AMBER   = "#F59E0B";
const TEXT_DARK  = "#2C2C3A";
const TEXT_GREY  = "#6B6B7B";
const BG_LIGHT   = "#F5F0FF";
const WHITE      = "#FFFFFF";
const LAVENDER   = "#9E58FF";
const PINK       = "#FE9496";

const EVENT_TYPE_COLORS: Record<string, string> = {
  inter_province: PURPLE,
  nationalized:   TEAL,
  coaching_camp:  BLUE,
  local:          LAVENDER,
  international:  PINK,
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    backgroundColor: WHITE,
    fontSize: 10,
    color: TEXT_DARK,
  },

  // ── Top brand banner ──────────────────────────────────────────────────────
  banner: {
    backgroundColor: PURPLE,
    paddingHorizontal: 36,
    paddingVertical: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bannerOrg:   { fontSize: 13, fontFamily: "Helvetica-Bold", color: WHITE },
  bannerLabel: { fontSize: 9,  color: "rgba(255,255,255,0.75)" },
  bannerYear:  { fontSize: 28, fontFamily: "Helvetica-Bold", color: WHITE },

  // ── Page content area ─────────────────────────────────────────────────────
  content: { paddingHorizontal: 36, paddingTop: 20, paddingBottom: 48 },

  // ── Stat cards (2 × 2 grid) ───────────────────────────────────────────────
  statsRow:  { flexDirection: "row", gap: 10, marginBottom: 10 },
  statCard:  { flex: 1, borderRadius: 16, padding: 16 },
  statIcon:  { fontSize: 16, marginBottom: 4 },
  statNum:   { fontSize: 30, fontFamily: "Helvetica-Bold", color: WHITE },
  statLabel: { fontSize: 10, color: WHITE, opacity: 0.9, marginTop: 2 },
  statYear:  { fontSize: 8,  color: WHITE, opacity: 0.65, marginTop: 1 },

  // ── Section card ──────────────────────────────────────────────────────────
  sectionCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E9E0FF",
    overflow: "hidden",
    marginBottom: 14,
  },
  sectionHead: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E9E0FF",
  },
  sectionTitle:    { fontSize: 11, fontFamily: "Helvetica-Bold", color: TEXT_DARK },
  sectionSubtitle: { fontSize: 8,  color: TEXT_GREY, marginTop: 1 },

  // ── Table ─────────────────────────────────────────────────────────────────
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: BG_LIGHT,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  tableHeaderCell: { fontSize: 8, color: TEXT_GREY, fontFamily: "Helvetica-Bold" },
  tableRow:        { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: "#F5F0FF" },
  tableRowAlt:     { backgroundColor: "#FAFAFE" },
  cell:     { fontSize: 9, color: TEXT_DARK },
  cellGrey: { fontSize: 9, color: TEXT_GREY },

  // Rank badge
  rankBadge:    { width: 20, height: 20, borderRadius: 6, alignItems: "center", justifyContent: "center", backgroundColor: BG_LIGHT },
  rankBadgeTop: { backgroundColor: AMBER },
  rankText:     { fontSize: 7, fontFamily: "Helvetica-Bold", color: TEXT_GREY },
  rankTextTop:  { color: WHITE },

  // Event type chip
  chip: { borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },

  // Achievement pill
  pillAmber:  { backgroundColor: "#FEF3C7", borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  pillPurple: { backgroundColor: "#EDE9FE", borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  pillTeal:   { backgroundColor: "#D1FAE5", borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  pillText:   { fontSize: 8, fontFamily: "Helvetica-Bold", color: TEXT_DARK },

  // ── Fixed footer ──────────────────────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 18,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: BG_LIGHT,
    paddingTop: 5,
  },
  footerText: { fontSize: 7, color: TEXT_GREY },
});

const COL_RANK   = [28, 155, 85, 45, 45, 40];
const COL_EVENT  = [180, 95, 65, 40];
const COL_ACHIEVE = [145, 100, 65, 100];

function Banner({ year, section }: { year: number; section: string }) {
  return (
    <View style={styles.banner}>
      <View>
        <Text style={styles.bannerOrg}>BOC Sports Society</Text>
        <Text style={styles.bannerLabel}>Annual Performance Report · {section}</Text>
      </View>
      <Text style={styles.bannerYear}>{year}</Text>
    </View>
  );
}

function Footer({ year, section }: { year: number; section: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>BOC Sports Society — Annual Report {year}</Text>
      <Text style={styles.footerText}>{section} · Confidential</Text>
    </View>
  );
}

interface Props { data: AnnualReportData }

export function AnnualReportPdf({ data }: Props) {
  const generated = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <Document>

      {/* ── Page 1: Summary + Top Performers ─────────────────────────────── */}
      <Page size="A4" style={styles.page}>
        <Banner year={data.year} section="Summary" />
        <View style={styles.content}>

          {/* Stat cards — 2 × 2 grid matching the web dashboard */}
          <View style={[styles.statsRow, { marginBottom: 10 }]}>
            <View style={[styles.statCard, { backgroundColor: PURPLE }]}>
              <Text style={styles.statNum}>{data.totalEvents}</Text>
              <Text style={styles.statLabel}>Events Held</Text>
              <Text style={styles.statYear}>{data.year}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: TEAL }]}>
              <Text style={styles.statNum}>{data.uniquePlayers}</Text>
              <Text style={styles.statLabel}>Players Participated</Text>
              <Text style={styles.statYear}>{data.year}</Text>
            </View>
          </View>
          <View style={[styles.statsRow, { marginBottom: 20 }]}>
            <View style={[styles.statCard, { backgroundColor: BLUE }]}>
              <Text style={styles.statNum}>{data.totalResults}</Text>
              <Text style={styles.statLabel}>Results Recorded</Text>
              <Text style={styles.statYear}>{data.year}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: AMBER }]}>
              <Text style={styles.statNum}>{data.totalMarks}</Text>
              <Text style={styles.statLabel}>Total Marks</Text>
              <Text style={styles.statYear}>{data.year}</Text>
            </View>
          </View>

          {/* Top Performers — this year */}
          {data.topThisYear.length > 0 && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>Top Performers — {data.year}</Text>
                <Text style={styles.sectionSubtitle}>Ranked by total marks earned in {data.year}</Text>
              </View>
              <View style={styles.tableHeaderRow}>
                {["#", "Player", "Branch", "Events", "Marks", "Trend"].map((h, i) => (
                  <Text key={h} style={[styles.tableHeaderCell, { width: COL_RANK[i] }]}>{h}</Text>
                ))}
              </View>
              {data.topThisYear.map((r, i) => (
                <View key={r.playerId} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                  <View style={[styles.rankBadge, i < 3 ? styles.rankBadgeTop : {}, { width: COL_RANK[0] }]}>
                    <Text style={[styles.rankText, i < 3 ? styles.rankTextTop : {}]}>{r.rank}</Text>
                  </View>
                  <Text style={[styles.cell, { width: COL_RANK[1], fontFamily: "Helvetica-Bold" }]}>{r.playerName}</Text>
                  <Text style={[styles.cellGrey, { width: COL_RANK[2] }]}>{r.branch}</Text>
                  <Text style={[styles.cell,     { width: COL_RANK[3], textAlign: "center" }]}>{r.eventCount}</Text>
                  <Text style={[styles.cell,     { width: COL_RANK[4], textAlign: "center", color: PURPLE, fontFamily: "Helvetica-Bold" }]}>{r.totalMarks} pts</Text>
                  <Text style={[styles.cell,     { width: COL_RANK[5], color: r.trend === "up" ? TEAL : r.trend === "down" ? PINK : TEXT_GREY }]}>
                    {r.trend === "up" ? "↑ Up" : r.trend === "down" ? "↓ Down" : "—"}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* All-time top performers */}
          {data.topLifetime.length > 0 && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>All-Time Top Performers</Text>
                <Text style={styles.sectionSubtitle}>Ranked by lifetime marks across all years</Text>
              </View>
              <View style={styles.tableHeaderRow}>
                {["#", "Player", "Branch", "Events", "Marks", "Trend"].map((h, i) => (
                  <Text key={h} style={[styles.tableHeaderCell, { width: COL_RANK[i] }]}>{h}</Text>
                ))}
              </View>
              {data.topLifetime.map((r, i) => (
                <View key={r.playerId} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                  <View style={[styles.rankBadge, i < 3 ? styles.rankBadgeTop : {}, { width: COL_RANK[0] }]}>
                    <Text style={[styles.rankText, i < 3 ? styles.rankTextTop : {}]}>{r.rank}</Text>
                  </View>
                  <Text style={[styles.cell, { width: COL_RANK[1], fontFamily: "Helvetica-Bold" }]}>{r.playerName}</Text>
                  <Text style={[styles.cellGrey, { width: COL_RANK[2] }]}>{r.branch}</Text>
                  <Text style={[styles.cell,     { width: COL_RANK[3], textAlign: "center" }]}>{r.eventCount}</Text>
                  <Text style={[styles.cell,     { width: COL_RANK[4], textAlign: "center", color: LAVENDER, fontFamily: "Helvetica-Bold" }]}>{r.totalMarks} pts</Text>
                  <Text style={[styles.cell,     { width: COL_RANK[5], color: r.trend === "up" ? TEAL : r.trend === "down" ? PINK : TEXT_GREY }]}>
                    {r.trend === "up" ? "↑ Up" : r.trend === "down" ? "↓ Down" : "—"}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <Text style={[styles.footerText, { textAlign: "center", marginTop: 8 }]}>Generated {generated}</Text>
        </View>
        <Footer year={data.year} section="Summary" />
      </Page>

      {/* ── Page 2: Events held this year ─────────────────────────────────── */}
      {data.yearEvents.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Banner year={data.year} section="Events" />
          <View style={styles.content}>
            <View style={styles.sectionCard}>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>Events Held in {data.year}</Text>
                <Text style={styles.sectionSubtitle}>{data.yearEvents.length} event{data.yearEvents.length !== 1 ? "s" : ""} recorded</Text>
              </View>
              <View style={styles.tableHeaderRow}>
                {["Event", "Type", "Date", "Results"].map((h, i) => (
                  <Text key={h} style={[styles.tableHeaderCell, { width: COL_EVENT[i] }]}>{h}</Text>
                ))}
              </View>
              {data.yearEvents.map((e, i) => (
                <View key={e.id} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                  <View style={{ width: COL_EVENT[0] }}>
                    <Text style={[styles.cell, { fontFamily: "Helvetica-Bold" }]}>{e.name}</Text>
                    {e.location ? <Text style={styles.cellGrey}>{e.location}</Text> : null}
                  </View>
                  <View style={{ width: COL_EVENT[1] }}>
                    <View style={[styles.chip, { backgroundColor: `${EVENT_TYPE_COLORS[e.type] ?? PURPLE}22` }]}>
                      <Text style={{ fontSize: 8, color: EVENT_TYPE_COLORS[e.type] ?? PURPLE, fontFamily: "Helvetica-Bold" }}>
                        {e.typeLabel}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.cellGrey, { width: COL_EVENT[2] }]}>
                    {new Date(e.eventDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </Text>
                  <View style={{ width: COL_EVENT[3], alignItems: "center" }}>
                    <View style={[styles.rankBadge, { backgroundColor: BG_LIGHT, width: 24, height: 24, borderRadius: 6 }]}>
                      <Text style={[styles.rankText, { color: PURPLE, fontFamily: "Helvetica-Bold" }]}>{e.resultCount}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
          <Footer year={data.year} section="Events" />
        </Page>
      )}

      {/* ── Page 3: Achievements ──────────────────────────────────────────── */}
      {data.achievements.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Banner year={data.year} section="Achievements" />
          <View style={styles.content}>
            <View style={styles.sectionCard}>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>Special Achievements — {data.year}</Text>
                <Text style={styles.sectionSubtitle}>{data.achievements.length} achievement{data.achievements.length !== 1 ? "s" : ""} recorded</Text>
              </View>
              <View style={styles.tableHeaderRow}>
                {["Player", "Branch", "Achievement", "Event"].map((h, i) => (
                  <Text key={h} style={[styles.tableHeaderCell, { width: COL_ACHIEVE[i] }]}>{h}</Text>
                ))}
              </View>
              {data.achievements.map((a, i) => (
                <View key={`${a.playerId}-${a.eventId}`} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                  <Text style={[styles.cell, { width: COL_ACHIEVE[0], fontFamily: "Helvetica-Bold" }]}>{a.playerName}</Text>
                  <Text style={[styles.cellGrey, { width: COL_ACHIEVE[1] }]}>{a.branch}</Text>
                  <View style={{ width: COL_ACHIEVE[2] }}>
                    <View style={a.type === "both" ? styles.pillTeal : a.type === "best_athlete" ? styles.pillAmber : styles.pillPurple}>
                      <Text style={styles.pillText}>
                        {a.type === "both" ? "Best + Record" : a.type === "best_athlete" ? "Best Athlete" : "Meet Record"}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.cellGrey, { width: COL_ACHIEVE[3] }]}>{a.eventName}</Text>
                </View>
              ))}
            </View>
          </View>
          <Footer year={data.year} section="Achievements" />
        </Page>
      )}

    </Document>
  );
}
