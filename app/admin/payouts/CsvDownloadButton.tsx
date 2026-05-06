"use client";

type Row = Record<string, string | number>;

const HEADER_LABEL: Record<string, string> = {
  contract_id: "契約ID",
  job_title: "案件名",
  worker_name: "受注者名",
  worker_handle: "ハンドル",
  bank_name: "銀行名",
  bank_branch_name: "支店名",
  bank_branch_code: "支店コード",
  bank_account_type: "種別",
  bank_account_number: "口座番号",
  bank_account_holder: "名義",
  amount_jpy: "振込金額",
  released_at: "検収日",
};

function escapeCsv(v: string | number): string {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export default function CsvDownloadButton({ rows, filename }: { rows: Row[]; filename: string }) {
  function download() {
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const headerLine = headers.map((h) => HEADER_LABEL[h] ?? h).join(",");
    const lines = rows.map((r) => headers.map((h) => escapeCsv(r[h])).join(","));
    // BOM 付きで Excel 互換
    const csv = "﻿" + [headerLine, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button onClick={download} className="btn-accent btn-sm gap-1.5" disabled={rows.length === 0}>
      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
      </svg>
      CSV ダウンロード
    </button>
  );
}
