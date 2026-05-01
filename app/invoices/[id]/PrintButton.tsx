"use client";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="btn-outline btn-sm"
      aria-label="このページを印刷する"
    >
      🖨 印刷
    </button>
  );
}
