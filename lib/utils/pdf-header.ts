import jsPDF from "jspdf";
import type { ProjectWithRelations, Profile } from "@/lib/types/database";
import { processTextForPDF } from "./pdf-utils";
import { PDF_COLORS, PDF_FONT, renderProjectMetaBlock } from "./pdf-shared-styles";

interface RenderHeaderOptions {
  doc: jsPDF;
  project: ProjectWithRelations;
  profile?: Profile | null;
  pageWidth: number;
  margin: number;
  startY: number;
}

/**
 * Renders company logo or fallback branding block
 * Returns true if logo was rendered from URL
 */
async function renderLogo(
  doc: jsPDF,
  profile: Profile | null | undefined,
  companyName: string,
  margin: number,
  currentY: number
): Promise<boolean> {
  if (profile?.logo_url) {
    try {
      const response = await fetch(profile.logo_url);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      doc.addImage(base64, "PNG", margin, currentY, 40, 20, undefined, "FAST");
      return true;
    } catch {
      // fallthrough to text logo
    }
  }

  if (!profile?.company_name) {
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(margin, currentY, 40, 20, 2, 2, "F");
    doc.setFontSize(10);
    doc.setFont("Roboto", "bold");
    doc.setTextColor(150, 150, 150);
    doc.text("LOGO", margin + 20, currentY + 11, { align: "center" });
  } else {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, currentY, 45, 20, 2, 2, "F");
    doc.setFontSize(9);
    doc.setFont("Roboto", "bold");
    doc.setTextColor(37, 99, 235);
    const maxWidth = 40;
    const lines = doc.splitTextToSize(companyName, maxWidth);
    const startY = currentY + 10 - lines.length * 1.5;
    lines.forEach((line: string, index: number) => {
      doc.text(line, margin + 22.5, startY + index * 3.5, { align: "center" });
    });
  }
  return false;
}

/**
 * Renders company details to the right of the logo
 * Returns final Y position after rendering
 */
function renderCompanyDetails(
  doc: jsPDF,
  profile: Profile | null | undefined,
  companyName: string,
  margin: number,
  startY: number
): number {
  let headerY = startY + 4;

  doc.setFontSize(PDF_FONT.display);
  doc.setFont("Roboto", "bold");
  doc.setTextColor(...PDF_COLORS.blueDeep);
  doc.text(companyName, margin + 50, headerY);
  headerY += 6;

  const companyNIP = profile?.nip ? processTextForPDF(`NIP: ${profile.nip}`) : "";
  const rawAddress = [
    profile?.street,
    profile?.postal_code && profile?.city ? `${profile.postal_code} ${profile.city}` : (profile?.city || profile?.postal_code),
  ].filter(Boolean).join(", ") || profile?.address || "";
  const companyAddress = rawAddress ? processTextForPDF(rawAddress) : "";
  const companyPhone = profile?.phone ? processTextForPDF(`Tel: ${profile.phone}`) : "";

  if (companyNIP) {
    doc.setFontSize(8);
    doc.setFont("Roboto", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(companyNIP, margin + 50, headerY);
    headerY += 4;
  }

  if (companyAddress) {
    doc.setFontSize(8);
    doc.setFont("Roboto", "normal");
    doc.setTextColor(100, 100, 100);
    const addressLines = doc.splitTextToSize(companyAddress, 140);
    addressLines.forEach((line: string) => {
      doc.text(line, margin + 50, headerY);
      headerY += 4;
    });
  }

  if (companyPhone) {
    doc.setFontSize(8);
    doc.setFont("Roboto", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(companyPhone, margin + 50, headerY);
    headerY += 4;
  }

  if (!companyNIP && !companyAddress && !companyPhone) {
    doc.setFontSize(8);
    doc.setFont("Roboto", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(
      processTextForPDF("Profesjonalne kosztorysowanie instalacji elektrycznych"),
      margin + 50,
      headerY
    );
    headerY += 4;
  }

  return headerY;
}

/**
 * Renders client block (right-aligned, below document title)
 * Returns final Y position after rendering
 */
function renderClientBlock(
  doc: jsPDF,
  project: ProjectWithRelations,
  pageWidth: number,
  margin: number,
  startY: number
): number {
  if (!project.client_name) return startY;

  let currentY = startY + 5;

  doc.setFontSize(8);
  doc.setFont("Roboto", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("NABYWCA / INWESTOR:", pageWidth - margin, currentY, { align: "right" });
  currentY += 5;

  doc.setFontSize(10);
  doc.setFont("Roboto", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(processTextForPDF(project.client_name), pageWidth - margin, currentY, { align: "right" });
  currentY += 4;

  if (project.client_address) {
    doc.setFontSize(9);
    doc.setFont("Roboto", "normal");
    doc.setTextColor(60, 60, 60);
    const addressLines = doc.splitTextToSize(processTextForPDF(project.client_address), 80);
    addressLines.forEach((line: string) => {
      doc.text(line, pageWidth - margin, currentY, { align: "right" });
      currentY += 4;
    });
  }

  if (project.client_nip) {
    doc.setFontSize(9);
    doc.setFont("Roboto", "normal");
    doc.setTextColor(60, 60, 60);
    doc.text(`NIP: ${project.client_nip}`, pageWidth - margin, currentY, { align: "right" });
    currentY += 4;
  }

  return currentY + 3;
}

/**
 * Renders the project info block using the unified shared meta renderer.
 * Delegates to renderProjectMetaBlock from pdf-shared-styles.
 */
function renderProjectBlock(
  doc: jsPDF,
  project: ProjectWithRelations,
  pageWidth: number,
  margin: number,
  startY: number,
  showColors: boolean
): number {
  return renderProjectMetaBlock(
    doc,
    {
      name:           processTextForPDF(project.name || "Bez nazwy"),
      status:         project.status,
      objectTypeName: project.object_types?.name ? processTextForPDF(project.object_types.name) : null,
      vatRate:        project.vat_rate ?? null,
    },
    margin,
    pageWidth,
    startY,
    showColors,
  );
}

/**
 * Renders the full PDF header section (logo, company, document title, client, project block)
 * Returns the Y position after all header content
 */
export async function renderPdfHeader({
  doc,
  project,
  profile,
  pageWidth,
  margin,
  startY,
}: RenderHeaderOptions): Promise<number> {
  const companyName = profile?.company_name
    ? processTextForPDF(profile.company_name)
    : "ELEKTROSMART PRO";

  await renderLogo(doc, profile, companyName, margin, startY);
  const headerY = renderCompanyDetails(doc, profile, companyName, margin, startY);

  let currentY = Math.max(startY + 25, headerY + 2);

  const docNumber = `${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, "0")}/${String(new Date().getDate()).padStart(2, "0")}`;
  doc.setFontSize(PDF_FONT.h2);
  doc.setFont("Roboto", "bold");
  doc.setTextColor(...PDF_COLORS.slate);
  doc.text(
    processTextForPDF(`KOSZTORYS OFERTOWY nr ${docNumber}`),
    pageWidth - margin, currentY, { align: "right" },
  );
  currentY += 3;

  currentY = renderClientBlock(doc, project, pageWidth, margin, currentY);

  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 10;

  return currentY;
}

export { renderProjectBlock };
