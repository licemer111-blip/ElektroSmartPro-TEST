import { logger } from "@/lib/logger";
import { jsPDF } from "jspdf";
import { fMoney, sanitize, getNettoLabel, getGrossLabel, getVatLineLabel, type PriceDisplay } from "@/lib/pdf-pricing";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TemplatePalette {
  primary: number[];
  primaryLight: number[];
  summaryBg: number[];
  summaryBorder: number[];
  accentSet: number[];
  accentSingle: number[];
  accentMat: number[];
  accentLab: number[];
  accentRg: number[];
  totalCol: number[];
}

export interface PdfNarzutyDisplay {
  kpAmount: number;
  kpPercent: number;
  zAmount: number;
  zPercent: number;
  kzAmount: number;
  kzPercent: number;
  totalNarzuty: number;
}

export interface PdfRow {
  index: string;
  name: string;
  knrCode: string;    // KNR code prefix (e.g. "KNR 5-08 0401-03") — empty string if none
  unit: string;
  qty: number;
  rg: string;
  mat: string;
  lab: string;
  combined: string;
  total: string;
  rawTotal: number;
  rowType: string;
  isParent: boolean;
  isChild: boolean;
}

export interface PdfProfile {
  company_name?: string | null;
  nip?: string | null;
  regon?: string | null;
  address?: string | null;
  street?: string | null;
  city?: string | null;
  postal_code?: string | null;
  phone?: string | null;
  email?: string | null;
  logo_url?: string | null;
  is_pro?: boolean | null;
}

export interface PdfProject {
  id: string;
  name: string;
  client_name?: string | null;
  client_address?: string | null;
  client_nip?: string | null;
  show_labor_hours_in_pdf?: boolean | null;
  regions?: { name?: string; price_modifier?: number } | null;
  object_types?: { name?: string } | null;
}

// ─── Logo aspect-ratio helpers ────────────────────────────────────────────────

/**
 * Reads pixel dimensions from raw base64-encoded PNG or JPEG.
 * Returns null if format is unrecognised or parsing fails.
 */
function _getImageDimensions(base64: string): { w: number; h: number } | null {
  try {
    const raw = base64.includes(",") ? base64.split(",")[1] : base64;
    const buf = Buffer.from(raw, "base64");
    // PNG: 8-byte signature then IHDR chunk — width at +16, height at +20
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
      return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
    }
    // JPEG: scan for SOF0/SOF1/SOF2 markers
    if (buf[0] === 0xff && buf[1] === 0xd8) {
      let offset = 2;
      while (offset < buf.length - 10) {
        if (buf[offset] !== 0xff) break;
        const marker = buf[offset + 1];
        if (marker >= 0xc0 && marker <= 0xc2) {
          return { w: buf.readUInt16BE(offset + 7), h: buf.readUInt16BE(offset + 5) };
        }
        offset += 2 + buf.readUInt16BE(offset + 2);
      }
    }
    return null;
  } catch { return null; }
}

/**
 * Returns jsPDF-compatible format string ("PNG" | "JPEG") from a data URI or raw base64.
 */
function _getImageFormat(base64: string): string {
  if (base64.startsWith("data:image/jpeg") || base64.startsWith("data:image/jpg")) return "JPEG";
  return "PNG";
}

/**
 * Returns { w, h } in mm for a logo constrained to maxH mm, preserving aspect ratio.
 * maxW caps the width (default 48mm) to prevent very wide logos overflowing.
 */
function _fitLogo(base64: string, maxH: number, maxW = 48): { w: number; h: number } {
  const dims = _getImageDimensions(base64);
  if (!dims || dims.h === 0) return { w: maxH * 2, h: maxH };
  const ratio = dims.w / dims.h;
  const h = maxH;
  const w = Math.min(h * ratio, maxW);
  return { w, h };
}

// ─── Shared drawing primitives ────────────────────────────────────────────────

function _addr(profile: PdfProfile | null): string {
  return [
    profile?.street,
    (profile?.postal_code && profile?.city)
      ? `${profile.postal_code} ${profile.city}`
      : (profile?.city || profile?.postal_code),
  ].filter(Boolean).join(", ") || profile?.address || "";
}

function _companyBlock(
  doc: jsPDF, font: string, hasFont: boolean,
  profile: PdfProfile | null,
  x: number, y: number, maxW: number,
  nameColor: [number,number,number] = [20, 20, 30],
  infoColor: [number,number,number] = [70, 80, 100],
): number {
  doc.setFontSize(9.5); doc.setFont(font, "bold"); doc.setTextColor(...nameColor);
  doc.text(sanitize(profile?.company_name || "ElektroSmart PRO", hasFont), x, y);
  y += 5;
  doc.setFont(font, "normal"); doc.setFontSize(7.5); doc.setTextColor(...infoColor);
  const addr = _addr(profile);
  if (addr) { const l = doc.splitTextToSize(sanitize(addr, hasFont), maxW) as string[]; doc.text(l, x, y); y += l.length * 3.8; }
  const ids = [profile?.nip ? `NIP: ${profile.nip}` : "", profile?.regon ? `REGON: ${profile.regon}` : ""].filter(Boolean).join("   ");
  if (ids) { doc.text(sanitize(ids, hasFont), x, y); y += 3.8; }
  const contact = [profile?.phone ? `Tel: ${profile.phone}` : "", profile?.email ? `Email: ${profile.email}` : ""].filter(Boolean).join("   ");
  if (contact) { doc.text(sanitize(contact, hasFont), x, y); y += 3.8; }
  return y;
}

function _docBlock(
  doc: jsPDF, font: string, hasFont: boolean,
  project: PdfProject,
  x: number, y: number,
  labelColor: [number,number,number] = [100, 116, 139],
  valueColor: [number,number,number] = [20, 20, 30],
): number {
  const docNum = `KO/${new Date().getFullYear()}/${project.id.substring(0, 8).toUpperCase()}`;
  doc.setFontSize(6); doc.setFont(font, "normal"); doc.setTextColor(...labelColor);
  doc.text("NR DOKUMENTU:", x, y);
  doc.text("DATA:", x + 46, y);
  y += 3.5;
  doc.setFontSize(8.5); doc.setFont(font, "bold"); doc.setTextColor(...valueColor);
  doc.text(sanitize(docNum, hasFont), x, y);
  doc.text(new Date().toLocaleDateString("pl-PL"), x + 46, y);
  return y + 6;
}

function _clientBlock(
  doc: jsPDF, font: string, hasFont: boolean,
  project: PdfProject,
  x: number, y: number, maxW: number,
  labelColor: [number,number,number] = [100, 116, 139],
  nameColor: [number,number,number] = [20, 20, 30],
  infoColor: [number,number,number] = [70, 80, 100],
): number {
  if (!project.client_name) return y;
  doc.setFontSize(6); doc.setFont(font, "normal"); doc.setTextColor(...labelColor);
  doc.text("NABYWCA / INWESTOR:", x, y);
  y += 3.5;
  doc.setFontSize(9); doc.setFont(font, "bold"); doc.setTextColor(...nameColor);
  doc.text(sanitize(project.client_name, hasFont), x, y);
  y += 4.5;
  doc.setFont(font, "normal"); doc.setFontSize(7.5); doc.setTextColor(...infoColor);
  if (project.client_address) {
    const l = doc.splitTextToSize(sanitize(project.client_address, hasFont), maxW) as string[];
    doc.text(l, x, y); y += l.length * 3.8;
  }
  if (project.client_nip) { doc.text(`NIP: ${project.client_nip}`, x, y); y += 3.8; }
  return y;
}

function _projectStrip(
  doc: jsPDF, font: string, hasFont: boolean,
  primary: [number,number,number],
  project: PdfProject,
  y: number, pageWidth: number, margin: number,
  bgColor: [number,number,number] = [248, 250, 252],
  textColor: [number,number,number] = [20, 20, 30],
  labelColor: [number,number,number] = [100, 116, 139],
  h = 14,
): number {
  const W = pageWidth - 2 * margin;
  doc.setFillColor(...bgColor); doc.roundedRect(margin, y, W, h, 1.5, 1.5, "F");
  doc.setFillColor(...primary); doc.roundedRect(margin, y, 3, h, 1, 1, "F");
  doc.setFontSize(6.5); doc.setFont(font, "normal"); doc.setTextColor(...labelColor);
  doc.text("PROJEKT / INWESTYCJA:", margin + 6, y + 4.5);
  doc.setFontSize(10); doc.setFont(font, "bold"); doc.setTextColor(...textColor);
  const projLines = doc.splitTextToSize(sanitize(project.name, hasFont), W - 60) as string[];
  doc.text(projLines[0] || "", margin + 6, y + 10.5);
  const meta = [
    sanitize(project.object_types?.name || "", hasFont),
    sanitize((project.regions as { name?: string } | null)?.name || "", hasFont),
  ].filter(Boolean).join("  |  ");
  if (meta) {
    doc.setFontSize(7.5); doc.setFont(font, "normal"); doc.setTextColor(...labelColor);
    doc.text(meta, pageWidth - margin - 4, y + 10.5, { align: "right" });
  }
  return y + h + 5;
}

// ─── Template 1: Klasyczny ─────────────────────────────────────────────────────

function renderHeaderKlasyczny(
  doc: jsPDF, hasFont: boolean, showColors: boolean, TPL: TemplatePalette,
  profile: PdfProfile | null, project: PdfProject, logoBase64: string | null,
): { headerEndY: number } {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const font = hasFont ? "Roboto" : "helvetica";
  const primary: [number,number,number] = showColors ? [TPL.primary[0], TPL.primary[1], TPL.primary[2]] : [30, 41, 59];

  // ─── Power Header (2-column) ────────────────────────────────────────
  const headerH = 20;
  doc.setFillColor(...primary);
  doc.rect(0, 0, pageWidth, headerH, "F");

  // Left: Logo
  let logoEndX = margin;
  if (logoBase64 && profile?.logo_url) {
    try { const ls = _fitLogo(logoBase64, 14); doc.addImage(logoBase64, _getImageFormat(logoBase64), margin, 3, ls.w, ls.h); logoEndX = margin + ls.w + 4; }
    catch (e) { logger.error("Logo error", {}, e); }
  }

  // Center: Document Title
  doc.setFontSize(15); doc.setFont(font, "bold"); doc.setTextColor(255, 255, 255);
  doc.text(`KOSZTORYS ELEKTRYCZNY NR ${project.id.substring(0, 8).toUpperCase()}`, pageWidth / 2, 13, { align: "center" });

  // Right: Company Details (Wykonawca)
  const rightX = pageWidth - margin;
  doc.setFontSize(8); doc.setFont(font, "normal"); doc.setTextColor(255, 255, 255);
  const companyLines = [
    profile?.company_name || "ElektroSmart PRO",
    profile?.nip ? `NIP: ${profile.nip}` : "",
    profile?.address || "",
    profile?.phone || "",
    profile?.email || "",
  ].filter(Boolean);
  companyLines.forEach((line, i) => {
    doc.text(sanitize(line, hasFont), rightX, 5 + i * 3.2, { align: "right" });
  });

  // ─── Context Grid (2x2) ───────────────────────────────────────────────
  const gridY = headerH + 6;
  const gridCols = [pageWidth / 2 - margin, pageWidth / 2];
  const gridRows = [gridY, gridY + 14];
  const gridLabels = [
    { x: gridCols[0] + 4, y: gridRows[0] - 3, label: "Inwestor:" },
    { x: gridCols[1] + 4, y: gridRows[0] - 3, label: "Adres inwestycji:" },
    { x: gridCols[0] + 4, y: gridRows[1] - 3, label: "Typ obiektu:" },
    { x: gridCols[1] + 4, y: gridRows[1] - 3, label: "Województwo:" },
  ];
  const gridValues = [
    project.client_name || "—",
    project.client_address || "—",
    project.object_types?.name || "—",
    project.regions?.name || "—",
  ];

  // Grid background & borders
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, gridY - 5, pageWidth - 2 * margin, 24, "F");
  doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.3);
  doc.rect(margin, gridY - 5, pageWidth - 2 * margin, 24, "S");
  // Vertical divider
  doc.line(pageWidth / 2, gridY - 5, pageWidth / 2, gridY + 19);
  // Horizontal divider
  doc.line(margin, gridY + 7, pageWidth - margin, gridY + 7);

  // Grid content
  doc.setFontSize(7); doc.setFont(font, "normal"); doc.setTextColor(100, 116, 139);
  gridLabels.forEach(({ x, y, label }) => doc.text(label, x, y));
  doc.setFontSize(8.5); doc.setFont(font, "bold"); doc.setTextColor(20, 20, 30);
  gridValues.forEach((value, i) => {
    const { x, y } = gridLabels[i];
    doc.text(sanitize(value, hasFont), x, y + 3.5);
  });

  // Date below grid
  doc.setFontSize(7); doc.setFont(font, "italic"); doc.setTextColor(120, 120, 120);
  doc.text(`Data sporządzenia: ${new Date().toLocaleDateString("pl-PL")}`, margin, gridY + 26);

  // Separator line
  doc.setDrawColor(...primary); doc.setLineWidth(0.8);
  doc.line(margin, gridY + 30, pageWidth - margin, gridY + 30);

  return { headerEndY: gridY + 34 };
}

// ─── Template 2: Elegancki ────────────────────────────────────────────────────

function renderHeaderElegancki(
  doc: jsPDF, hasFont: boolean, showColors: boolean, TPL: TemplatePalette,
  profile: PdfProfile | null, project: PdfProject, logoBase64: string | null,
): { headerEndY: number } {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const font = hasFont ? "Roboto" : "helvetica";
  const navy: [number,number,number] = showColors ? [TPL.primary[0], TPL.primary[1], TPL.primary[2]] : [15, 23, 42];
  const gold: [number,number,number] = showColors ? [TPL.accentSet[0], TPL.accentSet[1], TPL.accentSet[2]] : [160, 130, 60];

  // Gold top accent line
  doc.setFillColor(...gold); doc.rect(0, 0, pageWidth, 2.5, "F");

  let topLogoEndX = margin;
  if (logoBase64 && profile?.logo_url) {
    try { const ls = _fitLogo(logoBase64, 13); doc.addImage(logoBase64, _getImageFormat(logoBase64), margin, 5, ls.w, ls.h); topLogoEndX = margin + ls.w + 3; }
    catch (e) { logger.error("Logo error", {}, e); }
  }

  // Company name — large, navy, elegant
  doc.setFontSize(12); doc.setFont(font, "bold"); doc.setTextColor(...navy);
  doc.text(sanitize(profile?.company_name || "ElektroSmart PRO", hasFont), topLogoEndX, 13);

  // Document title — right
  doc.setFontSize(15); doc.setFont(font, "bold"); doc.setTextColor(...navy);
  doc.text("KOSZTORYS OFERTOWY", pageWidth - margin, 13, { align: "right" });

  // Company info (below name)
  let companyY = 18.5;
  doc.setFont(font, "normal"); doc.setFontSize(7.5); doc.setTextColor(70, 80, 100);
  const addr = _addr(profile);
  if (addr) { const l = doc.splitTextToSize(sanitize(addr, hasFont), 88) as string[]; doc.text(l, topLogoEndX, companyY); companyY += l.length * 3.8; }
  const ids = [profile?.nip ? `NIP: ${profile.nip}` : "", profile?.regon ? `REGON: ${profile.regon}` : ""].filter(Boolean).join("   ");
  if (ids) { doc.text(sanitize(ids, hasFont), topLogoEndX, companyY); companyY += 3.8; }
  const contact = [profile?.phone ? `Tel: ${profile.phone}` : "", profile?.email ? `Email: ${profile.email}` : ""].filter(Boolean).join("   ");
  if (contact) { doc.text(sanitize(contact, hasFont), topLogoEndX, companyY); companyY += 3.8; }

  // Doc info + client (right column)
  const rightX = 110;
  let rightY = 18.5;
  rightY = _docBlock(doc, font, hasFont, project, rightX, rightY, [100, 116, 139] as [number,number,number], [15,23,42] as [number,number,number]);
  rightY = _clientBlock(doc, font, hasFont, project, rightX, rightY, pageWidth - rightX - margin, [100,116,139] as [number,number,number], [15,23,42] as [number,number,number], [70,80,100] as [number,number,number]);

  // Vertical divider (gold)
  const bottom = Math.max(companyY, rightY) + 4;
  doc.setDrawColor(...gold); doc.setLineWidth(0.3);
  doc.line(106, 8, 106, bottom);

  // Elegant DOUBLE horizontal rule
  const ruleY = bottom + 3;
  doc.setDrawColor(...navy); doc.setLineWidth(1.8);
  doc.line(margin, ruleY, pageWidth - margin, ruleY);
  doc.setDrawColor(...gold); doc.setLineWidth(0.5);
  doc.line(margin, ruleY + 3.5, pageWidth - margin, ruleY + 3.5);

  // Project strip — cream, gold accent bar
  const stripY = ruleY + 8;
  return { headerEndY: _projectStrip(doc, font, hasFont, gold, project, stripY, pageWidth, margin, [250, 249, 244], [15,23,42], [140, 115, 55]) };
}

// ─── Template 3: Nowoczesny ───────────────────────────────────────────────────

function renderHeaderNowoczesny(
  doc: jsPDF, hasFont: boolean, showColors: boolean, TPL: TemplatePalette,
  profile: PdfProfile | null, project: PdfProject, logoBase64: string | null,
): { headerEndY: number } {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const font = hasFont ? "Roboto" : "helvetica";
  const teal: [number,number,number] = showColors ? [TPL.primary[0], TPL.primary[1], TPL.primary[2]] : [30, 41, 59];
  const tealLight: [number,number,number] = showColors ? [TPL.primaryLight[0], TPL.primaryLight[1], TPL.primaryLight[2]] : [226, 232, 240];

  // Teal banner
  const bannerH = 18;
  doc.setFillColor(...teal); doc.rect(0, 0, pageWidth, bannerH, "F");

  let logoEndX = margin;
  if (logoBase64 && profile?.logo_url) {
    try { const ls = _fitLogo(logoBase64, 12); doc.addImage(logoBase64, _getImageFormat(logoBase64), margin, 3, ls.w, ls.h); logoEndX = margin + ls.w + 3; }
    catch (e) { logger.error("Logo error", {}, e); }
  }
  doc.setFontSize(9); doc.setFont(font, "bold"); doc.setTextColor(255, 255, 255);
  doc.text(sanitize(profile?.company_name || "ElektroSmart PRO", hasFont), logoEndX, 11.5);
  doc.setFontSize(12); doc.setFont(font, "bold"); doc.setTextColor(255, 255, 255);
  doc.text("KOSZTORYS OFERTOWY", pageWidth - margin, 11.5, { align: "right" });

  // White-then-teal stripe at bottom of banner (contrast effect)
  doc.setFillColor(255, 255, 255); doc.rect(0, bannerH, pageWidth, 1, "F");
  doc.setFillColor(...tealLight); doc.rect(0, bannerH + 1, pageWidth, 2.5, "F");

  // Clean info block
  const colSplit = 107; const rightX = colSplit + 6;
  let leftY = bannerH + 10; let rightY = bannerH + 10;
  leftY = _companyBlock(doc, font, hasFont, profile, margin, leftY, colSplit - margin - 4, [20,40,50], [60,90,100]);
  rightY = _docBlock(doc, font, hasFont, project, rightX, rightY, teal, [20,40,50]);
  rightY = _clientBlock(doc, font, hasFont, project, rightX, rightY, pageWidth - rightX - margin, teal, [20,40,50], [60,90,100]);

  const infoBottom = Math.max(leftY, rightY) + 3;
  doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.25);
  doc.line(colSplit, bannerH + 6, colSplit, infoBottom);
  doc.setDrawColor(...teal); doc.setLineWidth(1.5);
  doc.line(margin, infoBottom, pageWidth - margin, infoBottom);

  return { headerEndY: _projectStrip(doc, font, hasFont, teal, project, infoBottom + 4, pageWidth, margin, [240, 253, 250], [20, 40, 40], teal) };
}

// ─── Template 4: Korporacyjny ──────────────────────────────────────────────────

function renderHeaderKorporacyjny(
  doc: jsPDF, hasFont: boolean, showColors: boolean, TPL: TemplatePalette,
  profile: PdfProfile | null, project: PdfProject, logoBase64: string | null,
): { headerEndY: number } {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const font = hasFont ? "Roboto" : "helvetica";
  const dark: [number,number,number] = showColors ? [TPL.primary[0], TPL.primary[1], TPL.primary[2]] : [40, 50, 65];
  const red: [number,number,number] = showColors ? [TPL.accentSet[0], TPL.accentSet[1], TPL.accentSet[2]] : [185, 28, 28];

  // Tall dark banner (22mm)
  const bannerH = 22;
  doc.setFillColor(...dark); doc.rect(0, 0, pageWidth, bannerH, "F");

  let logoEndX = margin;
  if (logoBase64 && profile?.logo_url) {
    try { const ls = _fitLogo(logoBase64, 14); doc.addImage(logoBase64, _getImageFormat(logoBase64), margin, 4, ls.w, ls.h); logoEndX = margin + ls.w + 3; }
    catch (e) { logger.error("Logo error", {}, e); }
  }
  doc.setFontSize(11); doc.setFont(font, "bold"); doc.setTextColor(255, 255, 255);
  doc.text(sanitize(profile?.company_name || "ElektroSmart PRO", hasFont), logoEndX, 13.5);
  doc.setFontSize(13); doc.setFont(font, "bold"); doc.setTextColor(255, 255, 255);
  doc.text("KOSZTORYS OFERTOWY", pageWidth - margin, 13.5, { align: "right" });

  // Red accent bar under banner
  doc.setFillColor(...red); doc.rect(0, bannerH, pageWidth, 3, "F");

  // Gray info section bg
  const infoSectionStart = bannerH + 3;
  const infoSectionH = 26;
  doc.setFillColor(246, 247, 249); doc.rect(0, infoSectionStart, pageWidth, infoSectionH, "F");

  const colSplit = 108; const rightX = colSplit + 6;
  let leftY = infoSectionStart + 8; let rightY = infoSectionStart + 8;
  leftY = _companyBlock(doc, font, hasFont, profile, margin, leftY, colSplit - margin - 4, [40, 50, 65], [80, 90, 110]);
  rightY = _docBlock(doc, font, hasFont, project, rightX, rightY, red, [40, 50, 65]);
  rightY = _clientBlock(doc, font, hasFont, project, rightX, rightY, pageWidth - rightX - margin, red, [40, 50, 65], [80, 90, 110]);

  // Vertical divider inside info section
  doc.setDrawColor(226, 230, 236); doc.setLineWidth(0.3);
  doc.line(colSplit, infoSectionStart + 4, colSplit, infoSectionStart + infoSectionH - 4);

  // Red rule after info section
  const infoBottom = infoSectionStart + infoSectionH;
  doc.setDrawColor(...red); doc.setLineWidth(2);
  doc.line(0, infoBottom, pageWidth, infoBottom);

  return { headerEndY: _projectStrip(doc, font, hasFont, red, project, infoBottom + 4, pageWidth, margin, [245, 246, 248], [40, 50, 65], [140, 30, 30]) };
}

// ─── Template 5: Premium ───────────────────────────────────────────────────────

function renderHeaderPremium(
  doc: jsPDF, hasFont: boolean, showColors: boolean, TPL: TemplatePalette,
  profile: PdfProfile | null, project: PdfProject, logoBase64: string | null,
): { headerEndY: number } {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const font = hasFont ? "Roboto" : "helvetica";
  const purple: [number,number,number] = showColors ? [TPL.primary[0], TPL.primary[1], TPL.primary[2]] : [76, 29, 149];
  const lavender: [number,number,number] = showColors ? [TPL.accentSingle[0], TPL.accentSingle[1], TPL.accentSingle[2]] : [167, 139, 250];
  const lavText: [number,number,number] = [210, 195, 255];
  const white: [number,number,number] = [255, 255, 255];

  // Tall premium banner — contains ALL info (38mm)
  const bannerH = 38;
  doc.setFillColor(...purple); doc.rect(0, 0, pageWidth, bannerH, "F");

  // Logo
  let logoEndX = margin;
  if (logoBase64 && profile?.logo_url) {
    try { const ls = _fitLogo(logoBase64, 13); doc.addImage(logoBase64, _getImageFormat(logoBase64), margin, 4, ls.w, ls.h); logoEndX = margin + ls.w + 3; }
    catch (e) { logger.error("Logo error", {}, e); }
  }

  // Company name + KOSZTORYS (top of banner)
  doc.setFontSize(10.5); doc.setFont(font, "bold"); doc.setTextColor(...white);
  doc.text(sanitize(profile?.company_name || "ElektroSmart PRO", hasFont), logoEndX, 12);
  doc.setFontSize(13); doc.setFont(font, "bold"); doc.setTextColor(...white);
  doc.text("KOSZTORYS OFERTOWY", pageWidth - margin, 12, { align: "right" });

  // White separator inside banner
  doc.setDrawColor(...lavender); doc.setLineWidth(0.5);
  doc.line(margin, 18, pageWidth - margin, 18);

  // Company info inside banner (small, white)
  doc.setFontSize(6.5); doc.setFont(font, "normal"); doc.setTextColor(...lavText);
  let bannerInfoY = 23;
  const addr = _addr(profile);
  if (addr) { doc.text(sanitize(addr, hasFont), margin, bannerInfoY); bannerInfoY += 4; }
  const contactStr = [
    profile?.phone ? `Tel: ${profile.phone}` : "",
    profile?.email ? `Email: ${profile.email}` : "",
    profile?.nip ? `NIP: ${profile.nip}` : "",
  ].filter(Boolean).join("   ");
  if (contactStr) { doc.text(sanitize(contactStr, hasFont), margin, bannerInfoY); }

  // Doc number + date inside banner (right side)
  const docNum = `KO/${new Date().getFullYear()}/${project.id.substring(0, 8).toUpperCase()}`;
  doc.setFontSize(6); doc.setFont(font, "normal"); doc.setTextColor(...lavText);
  doc.text("NR DOKUMENTU:", pageWidth - margin - 70, 22);
  doc.text("DATA:", pageWidth - margin - 20, 22);
  doc.setFontSize(7); doc.setFont(font, "bold"); doc.setTextColor(...white);
  doc.text(sanitize(docNum, hasFont), pageWidth - margin - 70, 26.5);
  doc.text(new Date().toLocaleDateString("pl-PL"), pageWidth - margin - 20, 26.5);

  // Client inside banner (if available)
  if (project.client_name) {
    doc.setFontSize(6); doc.setFont(font, "normal"); doc.setTextColor(...lavText);
    doc.text("NABYWCA:", pageWidth - margin - 70, 32);
    doc.setFontSize(7.5); doc.setFont(font, "bold"); doc.setTextColor(...white);
    doc.text(sanitize(project.client_name, hasFont), pageWidth - margin - 70, 36.5);
  }

  // Lavender accent strip below banner
  doc.setFillColor(...lavender); doc.rect(0, bannerH, pageWidth, 2.5, "F");

  // Project strip — lavender bg, purple accent
  return { headerEndY: _projectStrip(doc, font, hasFont, purple, project, bannerH + 7, pageWidth, margin, [248, 245, 255], [50, 20, 90], [120, 90, 180]) };
}

// ─── Header dispatcher ────────────────────────────────────────────────────────

export function renderPdfHeader(
  doc: jsPDF,
  hasFont: boolean,
  showColors: boolean,
  TPL: TemplatePalette,
  profile: PdfProfile | null,
  project: PdfProject,
  logoBase64: string | null,
  templateId: string = "klasyczny",
): { headerEndY: number } {
  switch (templateId) {
    case "elegancki":    return renderHeaderElegancki(doc, hasFont, showColors, TPL, profile, project, logoBase64);
    case "nowoczesny":   return renderHeaderNowoczesny(doc, hasFont, showColors, TPL, profile, project, logoBase64);
    case "korporacyjny": return renderHeaderKorporacyjny(doc, hasFont, showColors, TPL, profile, project, logoBase64);
    case "premium":      return renderHeaderPremium(doc, hasFont, showColors, TPL, profile, project, logoBase64);
    default:             return renderHeaderKlasyczny(doc, hasFont, showColors, TPL, profile, project, logoBase64);
  }
}

// ─── Summary renderer ─────────────────────────────────────────────────────────

interface PricingOverrides {
  coeff_height?: boolean | null;
  coeff_difficulty?: boolean | null;
  coeff_surface?: boolean | null;
}

export function renderPdfSummary(
  doc: jsPDF,
  hasFont: boolean,
  showColors: boolean,
  showRg: boolean,
  maskPrices: boolean,
  TPL: TemplatePalette,
  startY: number,
  totalMatSum: number,
  totalLabSum: number,
  totalLaborHours: number,
  totalNet: number,
  vatAmount: number,
  totalGross: number,
  priceDisplay: PriceDisplay,
  vatMode: number,
  notes: string,
  adjustmentPercentage: number = 0,
  narzuty?: PdfNarzutyDisplay,
  templateId: string = "klasyczny",
  showKnrCoeffs: boolean = false,
  pricingOverrides?: PricingOverrides,
): void {
  const font = hasFont ? "Roboto" : "helvetica";
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const W = pageWidth - 2 * margin;
  const lbl: [number, number, number] = [100, 116, 139];

  // ── Notes ──────────────────────────────────────────────────────────────────
  if (notes && notes.trim()) {
    doc.setFontSize(8.5);
    doc.setFont(font, "bold");
    doc.setTextColor(40, 40, 40);
    doc.text(sanitize("UWAGI I ZALOZENIA:", hasFont), margin, startY);
    doc.setFontSize(8);
    doc.setFont(font, "normal");
    doc.setTextColor(70, 70, 70);
    const noteLines = doc.splitTextToSize(sanitize(notes, hasFont), W);
    doc.text(noteLines, margin, startY + 5);
    startY += 5 + (noteLines as string[]).length * 4 + 5;
  }

  // ── Separator ─────────────────────────────────────────────────────────────
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, startY, pageWidth - margin, startY);
  startY += 6;

  // ── Stats bar: Materialy | Robocizna | [r-g] ──────────────────────────────
  const numStats = showRg && totalLaborHours > 0 ? 3 : 2;
  const statW = W / numStats;
  const statsH = 22;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, startY, W, statsH, 2, 2, "F");
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, startY, W, statsH, 2, 2, "S");
  for (let i = 1; i < numStats; i++) {
    doc.line(margin + statW * i, startY + 4, margin + statW * i, startY + statsH - 4);
  }

  // Stat 1 — Materialy
  let sx = margin + 6;
  doc.setFontSize(6.5); doc.setFont(font, "normal"); doc.setTextColor(...lbl);
  doc.text(sanitize("Suma Materialow", hasFont), sx, startY + 7);
  doc.setFontSize(10); doc.setFont(font, "bold");
  doc.setTextColor(showColors ? TPL.accentMat[0] : 30, showColors ? TPL.accentMat[1] : 30, showColors ? TPL.accentMat[2] : 30);
  doc.text(maskPrices ? "*** zl" : fMoney(totalMatSum), sx, startY + 16);

  // Stat 2 — Robocizna
  sx = margin + statW + 6;
  doc.setFontSize(6.5); doc.setFont(font, "normal"); doc.setTextColor(...lbl);
  doc.text(sanitize("Suma Robocizny", hasFont), sx, startY + 7);
  doc.setFontSize(10); doc.setFont(font, "bold");
  doc.setTextColor(showColors ? TPL.accentLab[0] : 30, showColors ? TPL.accentLab[1] : 30, showColors ? TPL.accentLab[2] : 30);
  doc.text(maskPrices ? "*** zl" : fMoney(totalLabSum), sx, startY + 16);

  // Stat 3 — r-g hours
  if (numStats === 3) {
    sx = margin + statW * 2 + 6;
    doc.setFontSize(6.5); doc.setFont(font, "normal"); doc.setTextColor(...lbl);
    doc.text(sanitize("Naklady r-g", hasFont), sx, startY + 7);
    doc.setFontSize(10); doc.setFont(font, "bold"); doc.setTextColor(14, 116, 144);
    doc.text(`${totalLaborHours.toFixed(2)} rbh`, sx, startY + 16);
  }

  startY += statsH + 7;

  // ── Adjustment ────────────────────────────────────────────────────────────
  if (adjustmentPercentage !== 0) {
    const amount = (totalMatSum + totalLabSum) * (adjustmentPercentage / 100);
    const label = adjustmentPercentage < 0
      ? sanitize(`Rabat (${adjustmentPercentage.toFixed(1)}%):`, hasFont)
      : sanitize(`Korekta (+${adjustmentPercentage.toFixed(1)}%):`, hasFont);
    const kCol: [number, number, number] = adjustmentPercentage < 0 ? [22, 163, 74] : [37, 99, 235];
    doc.setFontSize(9); doc.setFont(font, "bold"); doc.setTextColor(...kCol);
    doc.text(label, margin + 5, startY);
    doc.text((amount >= 0 ? "+" : "") + (maskPrices ? "*** zl" : fMoney(amount)), pageWidth - margin, startY, { align: "right" });
    startY += 6;
  }

  // ── KNR Coefficients ──────────────────────────────────────────────────────
  if (showKnrCoeffs && pricingOverrides) {
    const activeCoeffs: Array<{ label: string; mult: string }> = [];
    if (pricingOverrides.coeff_height)     activeCoeffs.push({ label: sanitize("Na wysokosci (>3m)", hasFont), mult: "x1.25" });
    if (pricingOverrides.coeff_difficulty) activeCoeffs.push({ label: sanitize("Utrudnienia", hasFont),          mult: "x1.22" });
    if (pricingOverrides.coeff_surface)    activeCoeffs.push({ label: sanitize("Trudne podloze", hasFont),       mult: "+15%" });
    if (activeCoeffs.length > 0) {
      doc.setFontSize(7); doc.setFont(font, "bold");
      doc.setTextColor(30, 64, 175);
      doc.text(sanitize("WSPOLCZYNNIKI KNR:", hasFont), margin + 5, startY);
      startY += 4;
      doc.setFontSize(7.5); doc.setFont(font, "normal"); doc.setTextColor(55, 65, 81);
      for (const c of activeCoeffs) {
        doc.text(`• ${c.label}`, margin + 8, startY);
        doc.setFont(font, "bold"); doc.setTextColor(30, 64, 175);
        doc.text(c.mult, pageWidth - margin, startY, { align: "right" });
        doc.setFont(font, "normal"); doc.setTextColor(55, 65, 81);
        startY += 4.5;
      }
      startY += 1.5;
    }
  }

  // ── Narzuty ───────────────────────────────────────────────────────────────
  if (narzuty && narzuty.totalNarzuty > 0) {
    const nLines: Array<{ label: string; amount: number }> = [];
    if (narzuty.kpAmount > 0) nLines.push({ label: `Kp (${narzuty.kpPercent}%):`, amount: narzuty.kpAmount });
    if (narzuty.zAmount > 0)  nLines.push({ label: `Z (${narzuty.zPercent}%):`,  amount: narzuty.zAmount });
    if (narzuty.kzAmount > 0) nLines.push({ label: `Kz (${narzuty.kzPercent}%):`, amount: narzuty.kzAmount });
    doc.setFontSize(8.5); doc.setFont(font, "normal"); doc.setTextColor(100, 116, 139);
    for (const line of nLines) {
      doc.text(sanitize(line.label, hasFont), margin + 5, startY);
      doc.text(maskPrices ? "*** zl" : fMoney(line.amount), pageWidth - margin, startY, { align: "right" });
      startY += 5;
    }
    startY += 2;
  }

  // ── Separator ─────────────────────────────────────────────────────────────
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, startY - 2, pageWidth - margin, startY - 2);
  startY += 3;

  // ── Razem netto ───────────────────────────────────────────────────────────
  doc.setFontSize(10.5); doc.setFont(font, "bold"); doc.setTextColor(30, 41, 59);
  doc.text(sanitize(getNettoLabel(priceDisplay), hasFont), margin + 5, startY);
  doc.text(maskPrices ? "*** zl" : fMoney(totalNet), pageWidth - margin, startY, { align: "right" });
  startY += 7;

  // ── VAT ───────────────────────────────────────────────────────────────────
  if (priceDisplay === "netto") {
    doc.setFontSize(8.5); doc.setFont(font, "normal"); doc.setTextColor(...lbl);
    doc.text(sanitize(getVatLineLabel(priceDisplay, vatMode), hasFont), margin + 5, startY);
    doc.text(maskPrices ? "*** zl" : fMoney(vatAmount), pageWidth - margin, startY, { align: "right" });
    startY += 8;
  } else {
    startY += 4;
  }

  // ── WARTOSC BRUTTO (template-specific style) ──────────────────────────────
  const bruttoH = 15;
  if (templateId === "elegancki") {
    // Elegant: no box — just large text + gold underline
    const gold: [number,number,number] = showColors ? [TPL.accentSet[0], TPL.accentSet[1], TPL.accentSet[2]] : [160, 130, 60];
    const navy: [number,number,number] = showColors ? [TPL.primary[0], TPL.primary[1], TPL.primary[2]] : [15, 23, 42];
    doc.setFontSize(11); doc.setFont(font, "normal"); doc.setTextColor(...navy);
    doc.text(sanitize(getGrossLabel(), hasFont), margin + 4, startY + 10);
    doc.setFontSize(14); doc.setFont(font, "bold"); doc.setTextColor(...navy);
    doc.text(maskPrices ? "*** zl" : fMoney(totalGross), pageWidth - margin - 4, startY + 10, { align: "right" });
    doc.setDrawColor(...gold); doc.setLineWidth(1.5);
    doc.line(margin, startY + 13, pageWidth - margin, startY + 13);
  } else if (templateId === "premium") {
    // Premium: full-width box + larger text
    const purple: [number,number,number] = showColors ? [TPL.primary[0], TPL.primary[1], TPL.primary[2]] : [76, 29, 149];
    const lavender: [number,number,number] = showColors ? [TPL.accentSingle[0], TPL.accentSingle[1], TPL.accentSingle[2]] : [167, 139, 250];
    doc.setFillColor(...purple); doc.roundedRect(margin, startY, W, bruttoH + 2, 2, 2, "F");
    doc.setFillColor(...lavender); doc.roundedRect(margin, startY, 4, bruttoH + 2, 2, 2, "F");
    doc.setFontSize(12); doc.setFont(font, "bold"); doc.setTextColor(255, 255, 255);
    doc.text(sanitize(getGrossLabel(), hasFont), margin + 10, startY + 11);
    doc.setFontSize(13);
    doc.text(maskPrices ? "*** zl" : fMoney(totalGross), pageWidth - margin - 5, startY + 11, { align: "right" });
  } else if (templateId === "korporacyjny") {
    // Korporacyjny: dark box + red accent on left
    const dark: [number,number,number] = showColors ? [TPL.primary[0], TPL.primary[1], TPL.primary[2]] : [40, 50, 65];
    const red: [number,number,number] = showColors ? [TPL.accentSet[0], TPL.accentSet[1], TPL.accentSet[2]] : [185, 28, 28];
    doc.setFillColor(...dark); doc.roundedRect(margin, startY, W, bruttoH, 2, 2, "F");
    doc.setFillColor(...red); doc.roundedRect(margin, startY, 4, bruttoH, 2, 2, "F");
    doc.setFontSize(12); doc.setFont(font, "bold"); doc.setTextColor(255, 255, 255);
    doc.text(sanitize(getGrossLabel(), hasFont), margin + 10, startY + 10);
    doc.text(maskPrices ? "*** zl" : fMoney(totalGross), pageWidth - margin - 5, startY + 10, { align: "right" });
  } else {
    // Default (klasyczny, nowoczesny): full-width colored box
    doc.setFillColor(showColors ? TPL.primary[0] : 30, showColors ? TPL.primary[1] : 41, showColors ? TPL.primary[2] : 59);
    doc.roundedRect(margin, startY, W, bruttoH, 2, 2, "F");
    doc.setFontSize(12); doc.setFont(font, "bold"); doc.setTextColor(255, 255, 255);
    doc.text(sanitize(getGrossLabel(), hasFont), margin + 8, startY + 10);
    doc.text(maskPrices ? "*** zl" : fMoney(totalGross), pageWidth - margin - 5, startY + 10, { align: "right" });
  }
}

// ─── Footer renderer ──────────────────────────────────────────────────────────

export function renderPdfFooter(
  doc: jsPDF,
  hasFont: boolean,
  isPro: boolean,
  modeFooterNote: string,
  TPL?: TemplatePalette,
  showColors: boolean = false,
  templateId: string = "klasyczny",
): void {
  const font = hasFont ? "Roboto" : "helvetica";
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageCount = (doc as unknown as { internal: { getNumberOfPages(): number } }).internal.getNumberOfPages();

  // Determine footer accent color per template
  const footerAccent: [number,number,number] = TPL && showColors
    ? [TPL.primary[0], TPL.primary[1], TPL.primary[2]]
    : templateId === "korporacyjny" ? [185, 28, 28]
    : templateId === "premium" ? [76, 29, 149]
    : templateId === "elegancki" ? [160, 130, 60]
    : templateId === "nowoczesny" ? [13, 148, 136]
    : [37, 99, 235];

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    if (!isPro) {
      doc.saveGraphicsState();
      doc.setGState(new (doc as unknown as { GState: new (opts: { opacity: number }) => object }).GState({ opacity: 0.08 }));
      doc.setFontSize(60);
      doc.setFont(font, "bold");
      doc.setTextColor(220, 38, 38);
      doc.text(sanitize("WERSJA DEMO", hasFont), 105, 148, { align: "center", angle: 45 });
      doc.restoreGraphicsState();
    }
    // Footer accent line
    doc.setDrawColor(...footerAccent); doc.setLineWidth(0.5);
    doc.line(14, 285, pageWidth - 14, 285);
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.setFont(font, "italic");
    doc.text(modeFooterNote, 14, 289);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont(font, "normal");
    doc.text(
      `Strona ${i} z ${pageCount} | ${sanitize("Wygenerowano w systemie ElektroSmart PRO – Eksperckie systemy kosztorysowe", hasFont)}`,
      105, 290, { align: "center" }
    );
  }
}

// ─── Table config builder ─────────────────────────────────────────────────────

export function buildTableConfig(
  rows: PdfRow[],
  hasFont: boolean,
  showRg: boolean,
  matOwnedByClient: boolean = false,
  showKnr: boolean = false,
): {
  tableHead: string[];
  tableBody: (string | number)[][];
  colStyles: Record<number, Record<string, unknown>>;
  totalColIdx: number;
} {
  if (showRg) {
    if (matOwnedByClient && showKnr) {
      return {
        tableHead: ["Lp.", sanitize("Nazwa", hasFont), sanitize("Kod KNR", hasFont), sanitize("Jedn.", hasFont), sanitize("Ilość", hasFont), sanitize("Naklady r-g (rbh)", hasFont), sanitize("Robocizna", hasFont), "Suma"],
        tableBody: rows.map(r => [r.index, r.name, r.knrCode, r.unit, r.qty, r.rg, r.lab, r.total]),
        colStyles: {
          0: { cellWidth: 10, halign: "center" },
          1: { cellWidth: "auto" },
          2: { cellWidth: 22, halign: "left", fontSize: 7 },
          3: { cellWidth: 13, halign: "center" },
          4: { cellWidth: 11, halign: "center" },
          5: { cellWidth: 22, halign: "right" },
          6: { cellWidth: 24, halign: "right" },
          7: { cellWidth: 25, halign: "right", fontStyle: "bold" },
        },
        totalColIdx: 7,
      };
    }
    if (matOwnedByClient) {
      // No Material column — client provides materials
      return {
        tableHead: ["Lp.", sanitize("Nazwa", hasFont), sanitize("Jedn.", hasFont), sanitize("Ilość", hasFont), sanitize("Naklady r-g (rbh)", hasFont), sanitize("Robocizna", hasFont), "Suma"],
        tableBody: rows.map(r => [r.index, r.name, r.unit, r.qty, r.rg, r.lab, r.total]),
        colStyles: {
          0: { cellWidth: 10, halign: "center" },
          1: { cellWidth: "auto" },
          2: { cellWidth: 16, halign: "center" },
          3: { cellWidth: 13, halign: "center" },
          4: { cellWidth: 25, halign: "right" },
          5: { cellWidth: 27, halign: "right" },
          6: { cellWidth: 28, halign: "right", fontStyle: "bold" },
        },
        totalColIdx: 6,
      };
    }
    if (showKnr) {
      return {
        tableHead: ["Lp.", sanitize("Nazwa", hasFont), sanitize("Kod KNR", hasFont), sanitize("Jedn.", hasFont), sanitize("Ilość", hasFont), sanitize("Naklady r-g (rbh)", hasFont), sanitize("Material", hasFont), sanitize("Robocizna", hasFont), "Suma"],
        tableBody: rows.map(r => [r.index, r.name, r.knrCode, r.unit, r.qty, r.rg, r.mat, r.lab, r.total]),
        colStyles: {
          0: { cellWidth: 10, halign: "center" },
          1: { cellWidth: "auto" },
          2: { cellWidth: 22, halign: "left", fontSize: 7 },
          3: { cellWidth: 13, halign: "center" },
          4: { cellWidth: 11, halign: "center" },
          5: { cellWidth: 19, halign: "right" },
          6: { cellWidth: 19, halign: "right" },
          7: { cellWidth: 19, halign: "right" },
          8: { cellWidth: 22, halign: "right", fontStyle: "bold" },
        },
        totalColIdx: 8,
      };
    }
    return {
      tableHead: ["Lp.", sanitize("Nazwa", hasFont), sanitize("Jedn.", hasFont), sanitize("Ilość", hasFont), sanitize("Naklady r-g (rbh)", hasFont), sanitize("Material", hasFont), sanitize("Robocizna", hasFont), "Suma"],
      tableBody: rows.map(r => [r.index, r.name, r.unit, r.qty, r.rg, r.mat, r.lab, r.total]),
      colStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: "auto" },
        2: { cellWidth: 16, halign: "center" },
        3: { cellWidth: 13, halign: "center" },
        4: { cellWidth: 22, halign: "right" },
        5: { cellWidth: 22, halign: "right" },
        6: { cellWidth: 22, halign: "right" },
        7: { cellWidth: 25, halign: "right", fontStyle: "bold" },
      },
      totalColIdx: 7,
    };
  } else {
    if (matOwnedByClient && showKnr) {
      return {
        tableHead: ["Lp.", sanitize("Nazwa", hasFont), sanitize("Kod KNR", hasFont), sanitize("Jednostka", hasFont), sanitize("Ilość", hasFont), sanitize("Robocizna", hasFont), "Suma"],
        tableBody: rows.map(r => [r.index, r.name, r.knrCode, r.unit, r.qty, r.lab, r.total]),
        colStyles: {
          0: { cellWidth: 10, halign: "center" },
          1: { cellWidth: "auto" },
          2: { cellWidth: 25, halign: "left", fontSize: 7 },
          3: { cellWidth: 18, halign: "center" },
          4: { cellWidth: 13, halign: "center" },
          5: { cellWidth: 30, halign: "right" },
          6: { cellWidth: 30, halign: "right", fontStyle: "bold" },
        },
        totalColIdx: 6,
      };
    }
    if (matOwnedByClient) {
      // No Material column — client provides materials
      return {
        tableHead: ["Lp.", sanitize("Nazwa", hasFont), sanitize("Jednostka", hasFont), sanitize("Ilość", hasFont), sanitize("Robocizna", hasFont), "Suma"],
        tableBody: rows.map(r => [r.index, r.name, r.unit, r.qty, r.lab, r.total]),
        colStyles: {
          0: { cellWidth: 10, halign: "center" },
          1: { cellWidth: "auto" },
          2: { cellWidth: 23, halign: "center" },
          3: { cellWidth: 15, halign: "center" },
          4: { cellWidth: 35, halign: "right" },
          5: { cellWidth: 35, halign: "right", fontStyle: "bold" },
        },
        totalColIdx: 5,
      };
    }
    if (showKnr) {
      return {
        tableHead: ["Lp.", sanitize("Nazwa", hasFont), sanitize("Kod KNR", hasFont), sanitize("Jednostka", hasFont), sanitize("Ilość", hasFont), sanitize("Material", hasFont), sanitize("Robocizna", hasFont), "Suma"],
        tableBody: rows.map(r => [r.index, r.name, r.knrCode, r.unit, r.qty, r.mat, r.lab, r.total]),
        colStyles: {
          0: { cellWidth: 10, halign: "center" },
          1: { cellWidth: "auto" },
          2: { cellWidth: 25, halign: "left", fontSize: 7 },
          3: { cellWidth: 18, halign: "center" },
          4: { cellWidth: 13, halign: "center" },
          5: { cellWidth: 22, halign: "right" },
          6: { cellWidth: 22, halign: "right" },
          7: { cellWidth: 25, halign: "right", fontStyle: "bold" },
        },
        totalColIdx: 7,
      };
    }
    return {
      tableHead: ["Lp.", sanitize("Nazwa", hasFont), sanitize("Jednostka", hasFont), sanitize("Ilość", hasFont), sanitize("Material", hasFont), sanitize("Robocizna", hasFont), "Suma"],
      tableBody: rows.map(r => [r.index, r.name, r.unit, r.qty, r.mat, r.lab, r.total]),
      colStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: "auto" },
        2: { cellWidth: 23, halign: "center" },
        3: { cellWidth: 15, halign: "center" },
        4: { cellWidth: 25, halign: "right" },
        5: { cellWidth: 25, halign: "right" },
        6: { cellWidth: 28, halign: "right", fontStyle: "bold" },
      },
      totalColIdx: 6,
    };
  }
}
