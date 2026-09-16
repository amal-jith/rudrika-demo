"use client";

/**
 * Opens the browser print dialog for the invoice sheet.
 * Choosing "Save as PDF" there produces the downloadable invoice file.
 */
export default function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="btn-primary !py-2 !px-5 text-sm">
      Download / Print invoice
    </button>
  );
}
