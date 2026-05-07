"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import type { RankingRow } from "@/app/actions/rankings";

interface Props {
  rows: RankingRow[];
  period: string;
}

export default function ExportButtons({ rows, period }: Props) {
  const [exporting, setExporting] = useState(false);

  function exportExcel() {
    const data = rows.map((r) => ({
      Rank: r.rank,
      "Player Name": r.playerName,
      Branch: r.branch,
      Sport: r.sport,
      Gender: r.gender === "M" ? "Male" : "Female",
      Events: r.eventCount,
      "Total Marks": r.totalMarks,
      Trend: r.trend === "up" ? "↑ Up" : r.trend === "down" ? "↓ Down" : "— Flat",
    }));

    const ws = XLSX.utils.json_to_sheet(data);

    // Style header row
    const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = XLSX.utils.encode_cell({ r: 0, c });
      if (!ws[cell]) continue;
      ws[cell].s = {
        fill: { fgColor: { rgb: "A05AFF" } },
        font: { bold: true, color: { rgb: "FFFFFF" } },
      };
    }

    // Column widths
    ws["!cols"] = [{ wch: 6 }, { wch: 28 }, { wch: 20 }, { wch: 20 }, { wch: 10 }, { wch: 8 }, { wch: 12 }, { wch: 10 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rankings");
    XLSX.writeFile(wb, `BOC_Sports_Rankings_${period}.xlsx`);
  }

  async function exportPdf() {
    setExporting(true);
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const { createElement } = await import("react");
      const { RankingsPdfDoc } = await import("./RankingsPdfDoc");

      const blob = await pdf(createElement(RankingsPdfDoc, { rows, period })).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `BOC_Sports_Rankings_${period}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={exportExcel}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-purple-200 bg-white text-text-grey text-sm font-medium hover:bg-brand-bg hover:text-brand-dark transition-colors"
      >
        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Excel
      </button>
      <button
        onClick={exportPdf}
        disabled={exporting}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-purple-200 bg-white text-text-grey text-sm font-medium hover:bg-brand-bg hover:text-brand-dark transition-colors disabled:opacity-50"
      >
        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        {exporting ? "Generating…" : "PDF"}
      </button>
    </div>
  );
}
