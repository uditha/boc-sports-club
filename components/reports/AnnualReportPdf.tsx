// @ts-nocheck — @react-pdf/renderer has a known JSX type conflict with React 19
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { AnnualReportData } from "@/app/actions/reports";

const PURPLE = "#A05AFF";
const TEAL = "#1BCFB4";
const BLUE = "#4BCBEB";
const PINK = "#FE9496";
const LAVENDER = "#9E58FF";
const TEXT_DARK = "#2C2C3A";
const TEXT_GREY = "#6B6B7B";
const BG_LIGHT = "#F5F0FF";
const WHITE = "#FFFFFF";

const styles = StyleSheet.create({
  page: { fontFamily: "Helvetica", padding: 36, backgroundColor: WHITE, fontSize: 10, color: TEXT_DARK },

  // Cover page
  coverPage: { fontFamily: "Helvetica", padding: 0, backgroundColor: PURPLE },
  coverContent: { flex: 1, alignItems: "center", justifyContent: "center", padding: 60 },
  coverTitle: { fontSize: 28, fontFamily: "Helvetica-Bold", color: WHITE, textAlign: "center", marginBottom: 8 },
  coverSubtitle: { fontSize: 14, color: "rgba(255,255,255,0.85)", textAlign: "center", marginBottom: 4 },
  coverYear: { fontSize: 48, fontFamily: "Helvetica-Bold", color: WHITE, textAlign: "center", marginTop: 16, marginBottom: 16 },
  coverDivider: { width: 60, height: 3, backgroundColor: "rgba(255,255,255,0.5)", marginTop: 24, marginBottom: 24 },
  coverDate: { fontSize: 10, color: "rgba(255,255,255,0.65)", textAlign: "center" },

  // Summary stats on cover
  statsRow: { flexDirection: "row", gap: 12, marginTop: 32 },
  statBox: { flex: 1, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 8, padding: 12, alignItems: "center" },
  statNum: { fontSize: 22, fontFamily: "Helvetica-Bold", color: WHITE },
  statLabel: { fontSize: 8, color: "rgba(255,255,255,0.75)", marginTop: 2, textAlign: "center" },

  // Section header
  sectionHeader: { marginBottom: 14 },
  sectionTitle: { fontSize: 14, fontFamily: "Helvetica-Bold", color: PURPLE, marginBottom: 2 },
  sectionDivider: { height: 2, backgroundColor: PURPLE, borderRadius: 1, width: 40 },

  // Page header (non-cover)
  pageHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1.5, borderBottomColor: PURPLE, paddingBottom: 10, marginBottom: 20 },
  logoText: { fontSize: 13, fontFamily: "Helvetica-Bold", color: PURPLE },
  logoSub: { fontSize: 8, color: TEXT_GREY, marginTop: 1 },
  pageLabel: { fontSize: 8, color: TEXT_GREY, textAlign: "right" },

  // Table
  tableHeader: { flexDirection: "row", backgroundColor: PURPLE, borderRadius: 4, padding: "6 8", marginBottom: 1 },
  tableHeaderCell: { color: WHITE, fontFamily: "Helvetica-Bold", fontSize: 8 },
  row: { flexDirection: "row", padding: "5 8", borderBottomWidth: 1, borderBottomColor: BG_LIGHT },
  rowAlt: { backgroundColor: "#FAFAFE" },
  cell: { fontSize: 9, color: TEXT_DARK },
  cellGrey: { fontSize: 9, color: TEXT_GREY },

  // Rank badge
  rankBadge: { width: 18, height: 18, borderRadius: 9, backgroundColor: PURPLE, alignItems: "center", justifyContent: "center" },
  rankBadgeTop: { backgroundColor: "#F59E0B" },
  rankBadgeText: { color: WHITE, fontSize: 7, fontFamily: "Helvetica-Bold" },

  // Achievement pill
  pillBestAthlete: { backgroundColor: "#FEF3C7", borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  pillMeetRecord: { backgroundColor: "#EDE9FE", borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  pillBoth: { backgroundColor: "#D1FAE5", borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  pillText: { fontSize: 7, fontFamily: "Helvetica-Bold", color: TEXT_DARK },

  // Event type badge
  eventTypeBadge: { borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },

  // Footer
  footer: { position: "absolute", bottom: 24, left: 36, right: 36, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: BG_LIGHT, paddingTop: 6 },
  footerText: { fontSize: 7, color: TEXT_GREY },
});

const COL_RANK = [22, 155, 90, 50, 45, 40];
const COL_EVENT = [160, 90, 70, 50];
const COL_ACHIEVE = [145, 100, 60, 100];

const EVENT_TYPE_COLORS: Record<string, string> = {
  inter_province: PURPLE,
  nationalized: TEAL,
  coaching_camp: BLUE,
  local: LAVENDER,
  international: PINK,
};

function PageFooter({ year, section }: { year: number; section: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>BOC Sports Society — Annual Report {year}</Text>
      <Text style={styles.footerText}>{section} · Confidential</Text>
    </View>
  );
}

function PageHeader({ year, section }: { year: number; section: string }) {
  return (
    <View style={styles.pageHeader}>
      <View>
        <Text style={styles.logoText}>BOC Sports Society</Text>
        <Text style={styles.logoSub}>Annual Report {year}</Text>
      </View>
      <Text style={styles.pageLabel}>{section}</Text>
    </View>
  );
}

interface Props {
  data: AnnualReportData;
}

export function AnnualReportPdf({ data }: Props) {
  const generated = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const topYear = data.topThisYear;
  const hasTopYear = topYear.length > 0;

  return (
    <Document>
      {/* Cover page */}
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.coverContent}>
          <Text style={styles.coverSubtitle}>Bank of Ceylon Sports Society</Text>
          <Text style={styles.coverTitle}>Annual Performance Report</Text>
          <Text style={styles.coverYear}>{data.year}</Text>
          <View style={styles.coverDivider} />
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{data.totalEvents}</Text>
              <Text style={styles.statLabel}>Events Held</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{data.uniquePlayers}</Text>
              <Text style={styles.statLabel}>Players Participated</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{data.totalResults}</Text>
              <Text style={styles.statLabel}>Results Recorded</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{data.totalMarks}</Text>
              <Text style={styles.statLabel}>Total Marks</Text>
            </View>
          </View>
          <Text style={styles.coverDate}>Generated {generated}</Text>
        </View>
      </Page>

      {/* Top 10 This Year */}
      {hasTopYear && (
        <Page size="A4" style={styles.page}>
          <PageHeader year={data.year} section={`Top Performers — ${data.year}`} />
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top 10 Players — {data.year}</Text>
            <View style={styles.sectionDivider} />
          </View>
          <View style={styles.tableHeader}>
            {["#", "Player", "Branch", "Events", "Marks", "Trend"].map((h, i) => (
              <Text key={h} style={[styles.tableHeaderCell, { width: COL_RANK[i] }]}>{h}</Text>
            ))}
          </View>
          {topYear.map((r, i) => (
            <View key={r.playerId} style={[styles.row, i % 2 === 1 ? styles.rowAlt : {}]}>
              <View style={[styles.rankBadge, i < 3 ? styles.rankBadgeTop : {}, { width: COL_RANK[0] }]}>
                <Text style={styles.rankBadgeText}>{r.rank}</Text>
              </View>
              <Text style={[styles.cell, { width: COL_RANK[1], fontFamily: "Helvetica-Bold" }]}>{r.playerName}</Text>
              <Text style={[styles.cellGrey, { width: COL_RANK[2] }]}>{r.branch}</Text>
              <Text style={[styles.cell, { width: COL_RANK[3], textAlign: "center" }]}>{r.eventCount}</Text>
              <Text style={[styles.cell, { width: COL_RANK[4], textAlign: "center", color: PURPLE, fontFamily: "Helvetica-Bold" }]}>{r.totalMarks}</Text>
              <Text style={[styles.cell, { width: COL_RANK[5], color: r.trend === "up" ? TEAL : r.trend === "down" ? PINK : TEXT_GREY }]}>
                {r.trend === "up" ? "↑ Up" : r.trend === "down" ? "↓ Down" : "—"}
              </Text>
            </View>
          ))}
          <PageFooter year={data.year} section={`Top Performers ${data.year}`} />
        </Page>
      )}

      {/* Top 10 Lifetime */}
      {data.topLifetime.length > 0 && (
        <Page size="A4" style={styles.page}>
          <PageHeader year={data.year} section="All-Time Lifetime Rankings" />
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All-Time Top 10 — Lifetime Rankings</Text>
            <View style={[styles.sectionDivider, { backgroundColor: LAVENDER }]} />
          </View>
          <View style={[styles.tableHeader, { backgroundColor: LAVENDER }]}>
            {["#", "Player", "Branch", "Events", "Marks", "Trend"].map((h, i) => (
              <Text key={h} style={[styles.tableHeaderCell, { width: COL_RANK[i] }]}>{h}</Text>
            ))}
          </View>
          {data.topLifetime.map((r, i) => (
            <View key={r.playerId} style={[styles.row, i % 2 === 1 ? styles.rowAlt : {}]}>
              <View style={[styles.rankBadge, { backgroundColor: LAVENDER, width: COL_RANK[0] }, i < 3 ? styles.rankBadgeTop : {}]}>
                <Text style={styles.rankBadgeText}>{r.rank}</Text>
              </View>
              <Text style={[styles.cell, { width: COL_RANK[1], fontFamily: "Helvetica-Bold" }]}>{r.playerName}</Text>
              <Text style={[styles.cellGrey, { width: COL_RANK[2] }]}>{r.branch}</Text>
              <Text style={[styles.cell, { width: COL_RANK[3], textAlign: "center" }]}>{r.eventCount}</Text>
              <Text style={[styles.cell, { width: COL_RANK[4], textAlign: "center", color: LAVENDER, fontFamily: "Helvetica-Bold" }]}>{r.totalMarks}</Text>
              <Text style={[styles.cell, { width: COL_RANK[5], color: r.trend === "up" ? TEAL : r.trend === "down" ? PINK : TEXT_GREY }]}>
                {r.trend === "up" ? "↑ Up" : r.trend === "down" ? "↓ Down" : "—"}
              </Text>
            </View>
          ))}
          <PageFooter year={data.year} section="All-Time Rankings" />
        </Page>
      )}

      {/* Events held this year */}
      {data.yearEvents.length > 0 && (
        <Page size="A4" style={styles.page}>
          <PageHeader year={data.year} section={`Events Held — ${data.year}`} />
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Events Held in {data.year}</Text>
            <View style={[styles.sectionDivider, { backgroundColor: TEAL }]} />
          </View>
          <View style={[styles.tableHeader, { backgroundColor: TEAL }]}>
            {["Event Name", "Type", "Date", "Results"].map((h, i) => (
              <Text key={h} style={[styles.tableHeaderCell, { width: COL_EVENT[i] }]}>{h}</Text>
            ))}
          </View>
          {data.yearEvents.map((e, i) => (
            <View key={e.id} style={[styles.row, i % 2 === 1 ? styles.rowAlt : {}]}>
              <Text style={[styles.cell, { width: COL_EVENT[0], fontFamily: "Helvetica-Bold" }]}>{e.name}</Text>
              <View style={{ width: COL_EVENT[1] }}>
                <View style={[styles.eventTypeBadge, { backgroundColor: `${EVENT_TYPE_COLORS[e.type] ?? PURPLE}22` }]}>
                  <Text style={{ fontSize: 8, color: EVENT_TYPE_COLORS[e.type] ?? PURPLE, fontFamily: "Helvetica-Bold" }}>
                    {e.typeLabel}
                  </Text>
                </View>
              </View>
              <Text style={[styles.cellGrey, { width: COL_EVENT[2] }]}>
                {new Date(e.eventDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              </Text>
              <Text style={[styles.cell, { width: COL_EVENT[3], textAlign: "center" }]}>{e.resultCount}</Text>
            </View>
          ))}
          <PageFooter year={data.year} section={`Events ${data.year}`} />
        </Page>
      )}

      {/* Achievements */}
      {data.achievements.length > 0 && (
        <Page size="A4" style={styles.page}>
          <PageHeader year={data.year} section={`Achievements — ${data.year}`} />
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Special Achievements — {data.year}</Text>
            <View style={[styles.sectionDivider, { backgroundColor: "#F59E0B" }]} />
          </View>
          <View style={[styles.tableHeader, { backgroundColor: "#F59E0B" }]}>
            {["Player", "Branch", "Achievement", "Event"].map((h, i) => (
              <Text key={h} style={[styles.tableHeaderCell, { width: COL_ACHIEVE[i] }]}>{h}</Text>
            ))}
          </View>
          {data.achievements.map((a, i) => (
            <View key={`${a.playerId}-${a.eventId}`} style={[styles.row, i % 2 === 1 ? styles.rowAlt : {}]}>
              <Text style={[styles.cell, { width: COL_ACHIEVE[0], fontFamily: "Helvetica-Bold" }]}>{a.playerName}</Text>
              <Text style={[styles.cellGrey, { width: COL_ACHIEVE[1] }]}>{a.branch}</Text>
              <View style={{ width: COL_ACHIEVE[2] }}>
                <View style={a.type === "both" ? styles.pillBoth : a.type === "best_athlete" ? styles.pillBestAthlete : styles.pillMeetRecord}>
                  <Text style={styles.pillText}>
                    {a.type === "both" ? "Best Athlete + Record" : a.type === "best_athlete" ? "Best Athlete" : "Meet Record"}
                  </Text>
                </View>
              </View>
              <Text style={[styles.cellGrey, { width: COL_ACHIEVE[3] }]}>{a.eventName}</Text>
            </View>
          ))}
          <PageFooter year={data.year} section={`Achievements ${data.year}`} />
        </Page>
      )}
    </Document>
  );
}
