// components/InvoiceDefaultTemplate.jsx
import React from "react";

// Inline helpers (replaces external lib/helpers import)
const displayNum = (v) => (Number(v) || 0).toLocaleString("en-IN");
const fmt = (v, currency) =>
  `₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;


/* ---------- Rupees in words (Indian system) - fallback ---------- */
function fallbackRupeesInWords(n) {
  n = Math.floor(Number(n) || 0);
  if (n === 0) return "Zero Rupees";
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];
  function toWords(num) {
    if (num < 20) return ones[num];
    if (num < 100)
      return (
        tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "")
      );
    if (num < 1000)
      return (
        ones[Math.floor(num / 100)] +
        " Hundred" +
        (num % 100 ? " " + toWords(num % 100) : "")
      );
    return "";
  }
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const hundredBelow = n;
  let parts = [];
  if (crore) parts.push(toWords(crore) + " Crore");
  if (lakh) parts.push(toWords(lakh) + " Lakh");
  if (thousand) parts.push(toWords(thousand) + " Thousand");
  if (hundredBelow) parts.push(toWords(hundredBelow));
  return parts.join(" ") + " Rupees";
}

/* ---------- Date formatting (DD-MM-YYYY) ---------- */
function formatDateForDisplay(dateString) {
  if (!dateString) return "";

  try {
    const [year, month, day] = dateString.split('-');
    if (!year || !month || !day) return dateString;
    return `${day}-${month}-${year}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
}

function DefaultTemplate({
  data,
  profile = {},
  subtotal = 0,
  perLineTax = [],
  fmt = (v) => v,
  logo = null,
  previewOpen = false,
  pageIndex = 0,
  totalPages = 1,
  showTotals = true,
  startIndex = 0,
  rupeesInWords = null,
  paymentInfo = { paid_amount: 0, outstanding_amount: 0 },
  taxOverride = null,           // direct tax amount from backend (skips perLineTax)
  taxLabelOverride = null,      // e.g. "Tax (18%)"
  totalAmountOverride = null,   // direct total_amount from backend
}) {
  const rupeesToWords = rupeesInWords || fallbackRupeesInWords;
  const taxTypes = data.taxTypes || {};

  // Per-page items are rendered in the table, but totals (on last page) must be for all items
  const currentPageTax = perLineTax.slice(startIndex, startIndex + data.items.length);
  const taxForTotals = showTotals ? perLineTax : currentPageTax;
  const cgstTotal = taxForTotals.reduce((s, t) => s + (t.cgst || 0), 0);
  const sgstTotal = taxForTotals.reduce((s, t) => s + (t.sgst || 0), 0);
  const igstTotal = taxForTotals.reduce((s, t) => s + (t.igst || 0), 0);
  const utgstTotal = taxForTotals.reduce((s, t) => s + (t.utgst || 0), 0);
  const gstTotal = taxForTotals.reduce((s, t) => s + (t.gstTotal || 0), 0);

  const discountAmt =
    data.discountMode === "AMOUNT"
      ? Number(data.discountAmountManual) || 0
      : subtotal * ((Number(data.discountPct) || 0) / 100);
  const shippingN = Number(data.shipping) || 0;

  // If taxOverride is provided, use it directly; otherwise derive from perLineTax
  const effectiveTax = taxOverride !== null
    ? Number(taxOverride) || 0
    : (taxTypes.CGST || taxTypes.SGST || taxTypes.IGST || taxTypes.UTGST
        ? cgstTotal + sgstTotal + igstTotal + utgstTotal
        : gstTotal);

  const total = Math.max(0, subtotal - discountAmt + effectiveTax + shippingN);

  const displayName =
    profile?.company ||
    profile?.fullName ||
    profile?.full_name ||
    profile?.name ||
    "Your Company";

  let address = (profile?.address || "").trim();

  const addIfMissing = (text) => {
    if (!text) return;
    const normalized = address.toLowerCase();
    if (!normalized.includes(text.toLowerCase())) {
      address += (address ? ", " : "") + text;
    }
  };

  addIfMissing(profile?.city);
  addIfMissing(profile?.state);
  addIfMissing(profile?.country);
  addIfMissing(profile?.postalCode);

  const displayAddress = address || "Address not provided";

  // --- Currency Conversion Logic ---
  const showConversion = data.settings?.show_conversion && data.currency !== "INR";
  const exchangeRate = Number(data.settings?.exchange_rate || 83);
  const totalInINR = total * exchangeRate;

  const style = `
/* ===== COLOR RESET — force black text regardless of global CSS ===== */
.template-default,
.template-default * {
  color: #000 !important;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.template-default .invoice-page,
.template-default .border-container,
.template-default .content-wrapper {
  background: #fff !important;
}

/* ================= PDF / EXPORT ================= */
.invoice-page.export {
  width: 210mm;
  min-height: 297mm;
  height: auto;
  background: #fff;
  position: fixed;
  padding: 10mm; /* Outer padding: space between page edge and border */
  box-sizing: border-box;
}

/* Main wrapper with border */
.invoice-page.export .border-container {
  width: 100%;
  min-height: calc(297mm - 20mm - 20px); /* Account for 10mm top + 10mm bottom outer padding + footer space */
  height: auto;
  box-sizing: border-box;
  position: relative;
  border: 0.5mm solid #000;
}

/* Fixed inner padding for all content */
.invoice-page.export .content-wrapper {
  width: 100%;
  min-height: calc(297mm - 22mm - 20px); /* Account for outer padding + border + footer space */
  height: 100%;
  box-sizing: border-box;
  padding: 0mm; /* Inner padding: space between border and content */
  display: flex;
  flex-direction: column;
  position: relative;
}

/* Ensure proper spacing for content area */
.invoice-page.export .main-content {
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
}

/* FOOTER - OUTSIDE BORDER (in the outer padding area) */
.template-default .footer-area {
  position: absolute;
  bottom: 17px; /* Position at the very bottom of the page */
  left: 10mm; /* Match outer padding */
  right: 10mm; /* Match outer padding */
  text-align: center;
  padding: 4px 0;
  z-index: 10;
  border-top: none !important;
}

.invoice-page.preview .footer-area {
  display: none !important;
}

/* Page number - keep inside border */
.template-default .page-number {
  position: absolute;
  bottom: 1mm; /* Align with bottom inner padding */
  right: 1mm; /* Align with right inner padding */
  font-size: 10px;
  color: #666 !important;
  z-index: 20;
}

/* Fix for preview mode - EXACT A4 SIMULATION */
.invoice-page.preview {
  width: 210mm; /* Fixed A4 width */
  height: auto;
  min-height: 297mm;
  overflow: visible;
  background: white;
  margin: 0;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
}

/* Main wrapper with border - FOR PREVIEW */
.invoice-page.preview .border-container {
  width: calc(100% - 20mm); /* 10mm inset on each side */
  min-height: calc(297mm - 20mm);
  height: auto;
  box-sizing: border-box;
  position: relative;
  border: 0.5mm solid #000;
  margin: 10mm auto;
}

/* Fixed inner padding for all content - FOR PREVIEW */
.invoice-page.preview .content-wrapper {
  width: 100%;
  min-height: calc(297mm - 22mm - 20px); /* Match export calculation */
  height: 100%;
  box-sizing: border-box;
  padding: 0mm; /* Inner padding for content */
  display: flex;
  flex-direction: column;
  position: relative;
}

.template-default .company-name { 
  font-size: 14px; 
  font-weight: 700; 
  margin-top: 4px;
}
  

/* Header */
.template-default .header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
  padding-bottom: 8px;
  margin-bottom: 4px;
}

.template-default .logo-box {
  width: 130px;
  height: 130px;
  padding: 4px;
  margin-bottom: -12px;
  border-radius: 4px;
  overflow: hidden;
  display:flex; 
  align-items:center; 
  justify-content:center;
  background:#fff; 
  flex-shrink:0; 
}

.template-default .company-name { 
  font-size: 14px; 
  font-weight: 700; 
  margin-bottom: 4px;
}

.template-default .meta-title {
  font-size: 28px;
  font-weight: 500;
  margin-top: 20mm;
  margin-right: 3mm;
}

/* Address Boxes */
.template-default .addresses { 
  display:flex; 
  gap:0; 
  margin-bottom: 0px; 
}

.template-default .addr-box { 
  flex:1; 
  border-top: 1px solid #000;
  border-bottom: 1px solid #000;
  padding: 8px 6px;
  min-height: 70px; 
}

.template-default .addr-box:first-child {
  border-right: 1px solid #000;
}

.template-default .addr-box .label {
  display: block;
  font-weight:700;
  font-size:10px;
  margin-bottom: 4px;
  position: relative;
}

.template-default .addr-box .label::after {
  content: "";
  display: block;
  border-bottom:1px solid #000;
  margin-top: 6px;
  margin-left: -6px;
  margin-right: -6px;
}

/* Bill & Ship To */
.template-default .two-col-box {
  display: flex;
  width: 100%;
  border-top: none;
  border-bottom: 1px solid #000;
  background: #ffffffff;
  margin-bottom: -8px;
}

.template-default .two-col-box .col {
  flex: 1;
  padding: 10px 8px;
  border-right: 1px solid #000;
  min-height: 85px;
}

.template-default .two-col-box .col:last-child { 
  border-right: none; 
}

.template-default .two-col-box .label {
  display: block;
  font-weight:700;
  font-size:10px;
  margin-bottom: 4px;
  position: relative;
}

.template-default .two-col-box .label::after {
  content: "";
  display: block;
  border-bottom:1px solid #000;
  margin-top: 8px;
  margin-left: -8px;
  margin-right: -8px;
}

.template-default .two-col-box .value { 
  font-size:10px; 
  margin-top: 3px; 
  line-height: 1.3;
}

.template-default .two-col-box .value.name { 
  font-weight:600; 
  font-size:11px; 
  margin-bottom: 2px;
}

/* Table */
.template-default table { 
  width: 100%;
  border-collapse: collapse;
  border-spacing: 0;
  table-layout: relative;
  font-size: 11px;
  margin-top: 0;
  margin-bottom: 0px;
}

.template-default thead th,
.template-default tbody td {
  padding: 8px 6px;
  text-align: left;
  line-height: 1.3;
  vertical-align: top;
}

.template-default thead tr {
  border-bottom: 1px solid #000;
}

.template-default tbody tr {
  border-bottom: 1px solid #000;
}

.template-default thead th + th,
.template-default tbody td + td {
  border-left: 1px solid #000;
}

.template-default .continued-note { 
  text-align:center; 
  font-size:10px; 
  color:#666; 
  margin:0px 0; 
  font-style: italic;
}

/* Bottom Section */
.template-default .bottom-block {
  margin-top: 8px;
  display: flex;
  gap: 2px;
  align-items: flex-start;
  width: 100%;
}

.template-default .right-col { 
  flex: 0 0 42%;
  max-width: 42%;
  padding-left: 4px;
}
.template-default .left-col {
  flex: 0 0 58%;
  max-width: 58%;
}

.template-default .amount-words-label { 
  font-weight:700; 
  font-size:11px; 
  margin-bottom: 4px; 
  padding-left: 4px;
}

.template-default .amount-words { 
  font-style: italic; 
  font-family: Georgia, "Times New Roman", Times, serif; 
  font-weight:600; 
  font-size:11px; 
  margin-bottom: 8px; 
  line-height: 1.4;
  padding: 4px 0;
  padding-left: 4px;
}

.template-default .notes, 
.template-default .terms { 
  font-size:11px; 
  white-space: pre-wrap; 
  line-height: 1.4;
  padding-left: 4px;
}

/* Totals */
.template-default .totals { 
  border: 1px solid #000; 
  border-right: none;
  border-top: none;
  margin-top: -9px;
  padding: 8px 10px 10px 8px;
}

.template-default .totals .row { 
  display:flex; 
  justify-content:space-between; 
  padding: 4px 0;
  font-size:11px; 
}

.template-default .totals .row.total {
  border-top: 1px solid #000;
  padding-top: 6px;
  margin-top: 6px;
  font-weight: 600;
}

.template-default .totals .row.balance-due {
  border-top: none;
  margin-top: 4px;
  font-weight: 800;
  font-size: 13px;
}

/* Signature */
.template-default .signature-box { 
  width:100%; 
  margin-top: 0px;
  border: 1px solid #000; 
  border-right: none;
  border-top: none;
  padding: 10px 8px 12px 8px;
  text-align:center; 
  min-height: 70px; 
  display:flex; 
  align-items:flex-end; 
  justify-content:center; 
}

.template-default .signature-text { 
  font-size:10px; 
  font-weight:600; 
  text-transform:uppercase; 
}

/* Footer text styling */
.template-default .footer-text {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  padding: 4px 8px;
}

.template-default .footer-logo {
  height: 14px;
  margin-top: 12px;
  width: auto;
  vertical-align: middle;
}

// /* Print styles */
// @media print {
//   @page {
//     size: A4;
//     margin: 0;
//   }

//   body, html {
//     margin: 0 !important;
//     padding: 0 !important;
//     background: white !important;
//     width: 210mm !important;
//     height: 297mm !important;
//   }

//   .template-default {
//     width: 210mm !important;
//     min-height: 297mm !important;
//   }

//   .invoice-page.export {
//     width: 210mm !important;
//     min-height: 297mm !important;
//     height: auto !important;
//     page-break-after: always;
//     page-break-inside: avoid;
//   }

  

//   .invoice-page.export .content-wrapper {
//     width: 210mm !important;
//     min-height: calc(297mm - 2mm) !important;
//     padding: 12mm !important;
//   }

//   .invoice-page.preview {
//     width: 210mm !important;
//     min-height: 297mm !important;
//   }

//   .template-default table tr {
//     page-break-inside: avoid !important;
//     break-inside: avoid !important;
//   }
  
//   .template-default .bottom-block {
//     page-break-inside: avoid !important;
//     break-inside: avoid !important;
//   }
  
//   .template-default .continued-note {
//     page-break-before: avoid !important;
//   }
// }

/* Ensure items table doesn't overflow */
.template-default table {
  break-inside: auto;
}

}

/* Prevent content overflow */
.template-default .content-wrapper > *:not(.footer-area):not(.page-number) {
  max-width: 100%;
  overflow-wrap: break-word;
}
`;

  const displayPlaceOfSupply = () => {
    return (
      data.placeOfSupply ||
      data.to?.placeOfSupply ||
      data.to?.state ||
      profile?.location ||
      "—"
    );
  };

  const effectiveShipTo = () => {
    if (data.shipTo?.useSeparate) return data.shipTo || {};
    return {
      name: data.to?.name || "",
      phone: data.to?.phone || "",
      email: data.to?.email || "",
      address: data.to?.address || "",
      state: data.to?.state || "",
      gstin: data.to?.gstin || "",
    };
  };

  return (
    <div
      className={`template-default invoice-page ${previewOpen ? "preview" : "export"}`}
      style={{ color: '#000', background: '#fff', fontFamily: 'Arial, sans-serif' }}
    >
      <style>{style}</style>

      {/* Footer moved HERE - outside border-container */}
      <div className="footer-area">
        <div className="footer-text">
          <span>
            Create Invoice with <strong>Di Invoice</strong>
          </span>
          <img src="/footerlogo.png" alt="Di Invoice" className="footer-logo" />
        </div>
      </div>

      <div className="border-container">
        <div className="content-wrapper">
          {/* Show page number for multi-page */}
          {totalPages > 1 && (
            <div className="page-number">
              Page {pageIndex + 1} of {totalPages}
            </div>
          )}

          <div className="main-content">
            <div className="header">
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flex: 1 }}>
                {logo ? (
                  <div className="logo-box">
                    <img
                      src={logo}
                      alt="logo"
                      style={{ width: "100%", height: "100%", objectFit: "contain" }}
                    />
                  </div>
                ) : null}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="company-name">{displayName}</div>
                  <div
                    style={{
                      fontSize: 10,
                      marginTop: 2,
                      marginBottom: 4,
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.4,
                    }}
                  >
                    {displayAddress}
                  </div>
                  {profile?.gstin && (
                    <div
                      style={{
                        fontSize: 10,
                        marginTop: 2,
                        marginBottom: 4,
                      }}
                    >
                      GSTIN: {profile.gstin}
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: 10,
                      marginTop: 2,
                    }}
                  >
                    {profile?.email || ""}
                    {profile?.email && profile?.phone ? " • " : ""}
                    {profile?.phone || ""}
                  </div>
                </div>
              </div>

              <div className="meta-title">TAX INVOICE</div>
            </div>

            {/* Invoice Details + Place of Supply */}
            <div className="addresses">
              <div className="addr-box">
                <div className="label">Invoice Details</div>
                <div style={{ fontSize: 10, lineHeight: 1.4 }}>
                  <div style={{ marginBottom: 2 }}>
                    <strong>Invoice #:</strong>{" "}
                    <span style={{ fontWeight: 700 }}>{data.number}</span>
                  </div>
                  <div style={{ marginBottom: 2 }}>
                    <strong>Invoice Date:</strong>{" "}
                    <span style={{ fontWeight: 700 }}>{formatDateForDisplay(data.date)}</span>
                  </div>
                  <div>
                    <strong>Due Date:</strong>{" "}
                    <span style={{ fontWeight: 700 }}>{formatDateForDisplay(data.due)}</span>
                  </div>
                </div>
              </div>

              <div className="addr-box">
                <div className="label">Place Of Supply</div>
                <div style={{ fontSize: 10, lineHeight: 1.4, paddingTop: 4 }}>{displayPlaceOfSupply()}</div>
              </div>
            </div>

            {/* Bill To + Ship To */}
            <div className="two-col-box">
              <div className="col">
                <div className="label">Bill To</div>
                <div className="value name">{data.to.name || "—"}</div>
                {data.toCompany && (
                  <div className="value" style={{ marginBottom: 2 }}>{data.toCompany}</div>
                )}
                {data.to.address && (
                  <div className="value" style={{ marginTop: 4, marginBottom: 2 }}>
                    {data.to.address}
                  </div>
                )}
                <div className="value" style={{ marginTop: 4, marginBottom: 2 }}>
                  {data.to.phone && `Phone: ${data.to.phone}`}
                  {data.to.phone && data.to.email ? " • " : ""}
                  {data.to.email && `Email: ${data.to.email}`}
                </div>
                {data.to.gstin && (
                  <div className="value" style={{ marginTop: 4, marginBottom: 2 }}>
                    GSTIN: {data.to.gstin}
                  </div>
                )}
                {data.to.state && (
                  <div className="value" style={{ marginTop: 4 }}>
                    State: {data.to.state}
                  </div>
                )}
              </div>

              <div className="col">
                <div className="label">Ship To</div>
                {(() => {
                  const s = effectiveShipTo();
                  return (
                    <>
                      <div className="value name">{s.name || "—"}</div>
                      {s.address && (
                        <div className="value" style={{ marginTop: 4, marginBottom: 2 }}>
                          {s.address}
                        </div>
                      )}
                      <div className="value" style={{ marginTop: 4, marginBottom: 2 }}>
                        {s.phone && `Phone: ${s.phone}`}
                        {s.phone && s.email ? " • " : ""}
                        {s.email && `Email: ${s.email}`}
                      </div>
                      {s.gstin && (
                        <div className="value" style={{ marginTop: 4, marginBottom: 2 }}>
                          GSTIN: {s.gstin}
                        </div>
                      )}
                      {s.state && (
                        <div className="value" style={{ marginTop: 4 }}>
                          State: {s.state}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Items */}
            <div style={{ marginTop: 8, overflow: "visible" }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: "4%" }}>#</th>
                    <th style={{ width: "41%" }}>Item &amp; Description</th>
                    <th style={{ width: "6%", textAlign: "right" }}>Qty</th>
                    <th style={{ width: "8%", textAlign: "right" }}>Rate</th>

                    {data.taxTypes?.GST && (
                      <th style={{ width: "6%", textAlign: "center" }}>GST %</th>
                    )}
                    {taxTypes.CGST && (
                      <th style={{ width: "6%", textAlign: "center" }}>CGST %</th>
                    )}
                    {taxTypes.CGST && (
                      <th style={{ width: "8%", textAlign: "right" }}>CGST</th>
                    )}
                    {taxTypes.SGST && (
                      <th style={{ width: "6%", textAlign: "center" }}>SGST %</th>
                    )}
                    {taxTypes.SGST && (
                      <th style={{ width: "8%", textAlign: "right" }}>SGST</th>
                    )}
                    {taxTypes.IGST && (
                      <th style={{ width: "6%", textAlign: "center" }}>IGST %</th>
                    )}
                    {taxTypes.IGST && (
                      <th style={{ width: "8%", textAlign: "right" }}>IGST</th>
                    )}
                    {taxTypes.UTGST && (
                      <th style={{ width: "6%", textAlign: "center" }}>UTGST %</th>
                    )}
                    {taxTypes.UTGST && (
                      <th style={{ width: "8%", textAlign: "right" }}>UTGST</th>
                    )}

                    {!taxTypes.CGST &&
                      !taxTypes.SGST &&
                      !taxTypes.IGST &&
                      !taxTypes.UTGST &&
                      data.taxTypes?.GST && (
                        <th style={{ width: "10%", textAlign: "right" }}>GST</th>
                      )}

                    <th style={{ width: "10%", textAlign: "right" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((it, idx) => {
                    const serial = startIndex + idx + 1;
                    const base = (Number(it.qty) || 0) * (Number(it.price) || 0);
                    const cgstPct = Number(
                      it.cgstPct ?? (it.gstPct ? it.gstPct / 2 : 0)
                    );
                    const sgstPct = Number(
                      it.sgstPct ?? (it.gstPct ? it.gstPct / 2 : 0)
                    );
                    const igstPct = Number(it.igstPct ?? (it.gstPct || 0));
                    const utgstPct = Number(it.utgstPct ?? 0);
                    const gstPct = Number(it.gstPct || 0);
                    const cgst = taxTypes.CGST ? base * (cgstPct / 100) : 0;
                    const sgst = taxTypes.SGST ? base * (sgstPct / 100) : 0;
                    const igst = taxTypes.IGST ? base * (igstPct / 100) : 0;
                    const utgst = taxTypes.UTGST ? base * (utgstPct / 100) : 0;
                    const gstCombined =
                      !taxTypes.CGST &&
                        !taxTypes.SGST &&
                        !taxTypes.IGST &&
                        !taxTypes.UTGST &&
                        data.taxTypes?.GST
                        ? base * (gstPct / 100)
                        : 0;
                    const lineTotal = base + cgst + sgst + igst + utgst + gstCombined;

                    return (
                      <tr key={it.id}>
                        <td style={{ textAlign: "center" }}>{serial}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{it.name}</div>
                          {it.desc && (
                            <div
                              style={{
                                fontSize: 10,
                                marginTop: 4,
                                lineHeight: 1.3,
                              }}
                            >
                              {it.desc}
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {displayNum(it.qty)}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {fmt(it.price, data.currency)}
                        </td>

                        {data.taxTypes?.GST && (
                          <td style={{ textAlign: "center" }}>{it.gstPct || 0}</td>
                        )}
                        {taxTypes.CGST && (
                          <td style={{ textAlign: "center" }}>
                            {displayNum(cgstPct)}
                          </td>
                        )}
                        {taxTypes.CGST && (
                          <td style={{ textAlign: "right" }}>
                            {fmt(cgst, data.currency)}
                          </td>
                        )}
                        {taxTypes.SGST && (
                          <td style={{ textAlign: "center" }}>
                            {displayNum(sgstPct)}
                          </td>
                        )}
                        {taxTypes.SGST && (
                          <td style={{ textAlign: "right" }}>
                            {fmt(sgst, data.currency)}
                          </td>
                        )}
                        {taxTypes.IGST && (
                          <td style={{ textAlign: "center" }}>
                            {displayNum(igstPct)}
                          </td>
                        )}
                        {taxTypes.IGST && (
                          <td style={{ textAlign: "right" }}>
                            {fmt(igst, data.currency)}
                          </td>
                        )}
                        {taxTypes.UTGST && (
                          <td style={{ textAlign: "center" }}>
                            {displayNum(utgstPct)}
                          </td>
                        )}
                        {taxTypes.UTGST && (
                          <td style={{ textAlign: "right" }}>
                            {fmt(utgst, data.currency)}
                          </td>
                        )}

                        {!taxTypes.CGST &&
                          !taxTypes.SGST &&
                          !taxTypes.IGST &&
                          !taxTypes.UTGST &&
                          data.taxTypes?.GST && (
                            <td style={{ textAlign: "right" }}>
                              {fmt(gstCombined, data.currency)}
                            </td>
                          )}

                        <td style={{ textAlign: "right" }}>
                          {fmt(lineTotal, data.currency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom section */}
            {!showTotals ? (
              <div className="continued-note">Continued on next page...

              </div>
            ) : (
              <>
                <div className="bottom-block">
                  <div className="left-col">
                    <div className="amount-words-label">Amount (in words):</div>
                    <div className="amount-words">
                      {rupeesToWords(total)} Only
                    </div>

                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 11, paddingLeft: 4 }}>Notes</div>
                      <div className="notes">{data.notes}</div>
                    </div>

                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 11, paddingLeft: 4 }}>
                        Terms &amp; Conditions
                      </div>
                      <div className="terms">{data.terms}</div>
                    </div>
                  </div>

                  <div className="right-col">
                    <div className="totals">
                      <div className="row">
                        <div>Sub Total</div>
                        <div>{fmt(subtotal, data.currency)}</div>
                      </div>

                      {/* taxOverride: show backend tax directly, no per-line GST */}
                      {taxOverride !== null && Number(taxOverride) > 0 && (
                        <div className="row">
                          <div>{taxLabelOverride || 'Tax'}</div>
                          <div>{fmt(Number(taxOverride), data.currency)}</div>
                        </div>
                      )}

                      {/* perLineTax-derived GST rows (only when taxOverride not used) */}
                      {taxOverride === null && (() => {
                        const firstItem = data.items[0];
                        const gstRate = Number(firstItem?.gstPct || 0);
                        const halfRate = gstRate / 2;
                        return (
                          <>
                            {taxTypes.CGST && gstRate > 0 && (
                              <div className="row"><div>CGST ({halfRate}%)</div><div>{fmt(cgstTotal, data.currency)}</div></div>
                            )}
                            {taxTypes.SGST && gstRate > 0 && (
                              <div className="row"><div>SGST ({halfRate}%)</div><div>{fmt(sgstTotal, data.currency)}</div></div>
                            )}
                            {taxTypes.IGST && gstRate > 0 && (
                              <div className="row"><div>IGST ({gstRate}%)</div><div>{fmt(igstTotal, data.currency)}</div></div>
                            )}
                            {taxTypes.UTGST && gstRate > 0 && (
                              <div className="row"><div>UTGST ({gstRate}%)</div><div>{fmt(utgstTotal, data.currency)}</div></div>
                            )}
                            {!taxTypes.CGST && !taxTypes.SGST && !taxTypes.IGST && !taxTypes.UTGST && data.taxTypes?.GST && gstRate > 0 && (
                              <div className="row"><div>GST ({gstRate}%)</div><div>{fmt(gstTotal, data.currency)}</div></div>
                            )}
                          </>
                        );
                      })()}

                      {(Number(data.shipping) || 0) > 0 && (
                        <div className="row">
                          <div>Shipping</div>
                          <div>
                            {fmt(Number(data.shipping) || 0, data.currency)}
                          </div>
                        </div>
                      )}
                      {discountAmt > 0 && (
                        <div className="row">
                          <div>Discount</div>
                          <div>-{fmt(discountAmt, data.currency)}</div>
                        </div>
                      )}
                      <div className="row total">
                        <div>Total</div>
                        <div>{fmt(totalAmountOverride !== null ? Number(totalAmountOverride) : total, data.currency)}</div>
                      </div>
                      {paymentInfo?.paid_amount > 0 && (
                        <div className="row">
                          <div>Payment Made</div>
                          <div>(-) {fmt(paymentInfo.paid_amount, data.currency)}</div>
                        </div>
                      )}
                      {paymentInfo?.outstanding_amount > 0 ? (
                        <div className="row balance-due">
                          <div>Balance Due</div>
                          <div>{fmt(paymentInfo.outstanding_amount, data.currency)}</div>
                        </div>
                      ) : paymentInfo?.paid_amount > 0 ? (
                        <div className="row balance-due">
                          <div>Balance Due</div>
                          <div>{fmt(0, data.currency)}</div>
                        </div>
                      ) : (
                        <div className="row balance-due">
                          <div>Balance Due</div>
                          <div>{fmt(total, data.currency)}</div>
                        </div>
                      )}
                    </div>

                    {showConversion && (
                      <div className="row" style={{
                        paddingTop: '4px',
                        paddingRight: '10px',
                        paddingLeft: '8px',
                        borderTop: '1px solid #000'
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          width: '100%',
                          fontWeight: 700,
                          fontSize: '14px'
                        }}>
                          <div>Total in INR</div>
                          <div>{fmt(totalInINR, "INR")}</div>
                        </div>
                      </div>
                    )}
                    {showConversion && (
                      <div style={{
                        textAlign: 'right',
                        paddingRight: '10px',
                        fontSize: '9px',
                        color: '#666',
                        marginTop: '2px'
                      }}>
                        (Rate: 1 {data.currency} = ₹{exchangeRate.toFixed(2)})
                      </div>
                    )}

                    {data.settings?.digital_signature ? (
                      <div className="signature-box" style={{
                        border: '2px solid #1a56db',
                        borderRadius: '4px',
                        padding: '12px',
                        marginTop: '10px',
                        background: '#f8faff',
                        position: 'relative',
                        minHeight: '80px',
                        flexDirection: 'column',
                        borderStyle: 'dashed'
                      }}>
                        <div style={{ color: '#1a56db', fontWeight: 800, fontSize: '14px', marginBottom: '4px' }}>
                          DIGITALLY SIGNED
                        </div>
                        <div style={{ fontSize: '10px', color: '#666' }}>
                          By: {displayName}
                        </div>
                        <div className="signature-text" style={{ marginTop: '8px', color: '#1e40af' }}>
                          {data.settings?.signature_text || "Authorized Signatory"}
                        </div>
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%) rotate(-15deg)',
                          opacity: 0.1,
                          fontSize: '24px',
                          fontWeight: 900,
                          whiteSpace: 'nowrap',
                          pointerEvents: 'none'
                        }}>
                          VERIFIED
                        </div>
                      </div>
                    ) : (
                      <div className="signature-box">
                        <div className="signature-text">Authorized Signatory</div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DefaultTemplate;
