"use client";

import { useState } from "react";
import type { AnnualReportData } from "@/app/actions/reports";

interface Props {
  data: AnnualReportData;
}

export default function AnnualReportExportButton({ data }: Props) {
  const [generating, setGenerating] = useState(false);

  async function handleExport() {
    setGenerating(true);
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const { createElement } = await import("react");
      const { AnnualReportPdf } = await import("./AnnualReportPdf");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blob = await pdf(createElement(AnnualReportPdf, { data }) as any).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `BOC_Sports_Annual_Report_${data.year}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={generating}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-dark transition-colors disabled:opacity-60 shadow-sm shadow-brand/30"
    >
      {generating ? (
        <>
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Generating PDF…
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download Annual Report PDF
        </>
      )}
    </button>
  );
}
