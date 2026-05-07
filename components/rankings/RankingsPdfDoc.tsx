// @ts-nocheck — @react-pdf/renderer has a known JSX type conflict with React 19
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { RankingRow } from "@/app/actions/rankings";

const styles = StyleSheet.create({
  page: { fontFamily: "Helvetica", padding: 36, backgroundColor: "#FFFFFF", fontSize: 10, color: "#2C2C3A" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 2, borderBottomColor: "#A05AFF", paddingBottom: 12, marginBottom: 20 },
  logoText: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#A05AFF" },
  subtitle: { fontSize: 9, color: "#6B6B7B", marginTop: 2 },
  tableHeader: { flexDirection: "row", backgroundColor: "#A05AFF", borderRadius: 4, padding: "6 8", marginBottom: 2 },
  tableHeaderCell: { color: "#FFFFFF", fontFamily: "Helvetica-Bold", fontSize: 9 },
  row: { flexDirection: "row", padding: "6 8", borderBottomWidth: 1, borderBottomColor: "#F5F0FF" },
  rowAlt: { backgroundColor: "#FAFAFE" },
  cell: { fontSize: 9, color: "#2C2C3A" },
  rankBadge: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#A05AFF", alignItems: "center", justifyContent: "center" },
  rankBadgeText: { color: "#FFFFFF", fontSize: 8, fontFamily: "Helvetica-Bold" },
  footer: { position: "absolute", bottom: 24, left: 36, right: 36, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#E9E0FF", paddingTop: 8 },
  footerText: { fontSize: 8, color: "#6B6B7B" },
});

const COL_WIDTHS = [28, 150, 100, 60, 40, 50, 40];

interface Props {
  rows: RankingRow[];
  period: string;
}

export function RankingsPdfDoc({ rows, period }: Props) {
  const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const periodLabel = period.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logoText}>BOC Sports Society</Text>
            <Text style={styles.subtitle}>Player Rankings · {periodLabel}</Text>
          </View>
          <Text style={[styles.subtitle, { textAlign: "right" }]}>Generated {date}</Text>
        </View>

        {/* Table header */}
        <View style={styles.tableHeader}>
          {["#", "Player", "Branch", "Sport", "Events", "Marks", "Trend"].map((h, i) => (
            <Text key={h} style={[styles.tableHeaderCell, { width: COL_WIDTHS[i] }]}>{h}</Text>
          ))}
        </View>

        {/* Rows */}
        {rows.map((r, i) => (
          <View key={r.playerId} style={[styles.row, i % 2 === 1 ? styles.rowAlt : {}]}>
            <View style={[styles.rankBadge, { width: COL_WIDTHS[0], marginRight: 4 }]}>
              <Text style={styles.rankBadgeText}>{r.rank}</Text>
            </View>
            <Text style={[styles.cell, { width: COL_WIDTHS[1], fontFamily: "Helvetica-Bold" }]}>{r.playerName}</Text>
            <Text style={[styles.cell, { width: COL_WIDTHS[2], color: "#6B6B7B" }]}>{r.branch}</Text>
            <Text style={[styles.cell, { width: COL_WIDTHS[3], color: "#6B6B7B" }]}>{r.sport.split(",")[0]}</Text>
            <Text style={[styles.cell, { width: COL_WIDTHS[4], textAlign: "center" }]}>{r.eventCount}</Text>
            <Text style={[styles.cell, { width: COL_WIDTHS[5], textAlign: "center", color: "#A05AFF", fontFamily: "Helvetica-Bold" }]}>{r.totalMarks}</Text>
            <Text style={[styles.cell, { width: COL_WIDTHS[6], color: r.trend === "up" ? "#1BCFB4" : r.trend === "down" ? "#FE9496" : "#6B6B7B" }]}>
              {r.trend === "up" ? "↑ Up" : r.trend === "down" ? "↓ Down" : "—"}
            </Text>
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Bank of Ceylon Sports Society — Confidential</Text>
          <Text style={styles.footerText}>{rows.length} players · {periodLabel}</Text>
        </View>
      </Page>
    </Document>
  );
}
