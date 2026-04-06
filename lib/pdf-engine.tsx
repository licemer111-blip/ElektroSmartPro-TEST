import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

// ─── Font Registration ─────────────────────────────────────────────────────────
// pdfmake Roboto TTF — full Latin Extended support (Polish: ą ć ę ł ń ó ś ź ż)
Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf',
      fontWeight: 'normal',
      fontStyle: 'normal',
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf',
      fontWeight: 'bold',
      fontStyle: 'normal',
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Italic.ttf',
      fontWeight: 'normal',
      fontStyle: 'italic',
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-MediumItalic.ttf',
      fontWeight: 'bold',
      fontStyle: 'italic',
    },
  ],
});
// Disable hyphenation — Polish words must never be broken mid-word
Font.registerHyphenationCallback(word => [word]);

// ─── Theme System ──────────────────────────────────────────────────────────────

export type ThemeName = 'klasyczny' | 'elegancki' | 'nowoczesny' | 'korporacyjny' | 'premium';

interface ThemePalette {
  // Header / cover page
  headerBg: string;
  headerText: string;
  // Accent (lines, borders, totals)
  accentPrimary: string;
  accentLight: string;
  // Table
  tableHeaderBg: string;
  tableHeaderText: string;
  rowOdd: string;
  rowEven: string;
  // Row type colors
  sectionHeaderBg: string;
  sectionHeaderText: string;
  setParentBg: string;
  setParentBorder: string;
  childMatBg: string;
  childLabBg: string;
  subtotalBg: string;
  warningBg: string;
  warningText: string;
  // Total / summary
  totalBg: string;
  totalText: string;
  // Text
  textPrimary: string;
  textSecondary: string;
  borderColor: string;
}

const THEMES: Record<ThemeName, ThemePalette> = {
  klasyczny: {
    headerBg: '#111827',
    headerText: '#ffffff',
    accentPrimary: '#111827',
    accentLight: '#f3f4f6',
    tableHeaderBg: '#111827',
    tableHeaderText: '#ffffff',
    rowOdd: '#f9fafb',
    rowEven: '#ffffff',
    sectionHeaderBg: '#1f2937',
    sectionHeaderText: '#ffffff',
    setParentBg: '#fde68a',
    setParentBorder: '#d97706',
    childMatBg: '#fef3c7',
    childLabBg: '#dcfce7',
    subtotalBg: '#f3f4f6',
    warningBg: '#fef2f2',
    warningText: '#dc2626',
    totalBg: '#111827',
    totalText: '#ffffff',
    textPrimary: '#111827',
    textSecondary: '#6b7280',
    borderColor: '#e5e7eb',
  },
  elegancki: {
    headerBg: '#374151',
    headerText: '#ffffff',
    accentPrimary: '#b45309',
    accentLight: '#fffbeb',
    tableHeaderBg: '#374151',
    tableHeaderText: '#ffffff',
    rowOdd: '#fafaf8',
    rowEven: '#ffffff',
    sectionHeaderBg: '#1f2937',
    sectionHeaderText: '#fde68a',
    setParentBg: '#fde68a',
    setParentBorder: '#b45309',
    childMatBg: '#fef3c7',
    childLabBg: '#dcfce7',
    subtotalBg: '#f9f7f2',
    warningBg: '#fef2f2',
    warningText: '#dc2626',
    totalBg: '#374151',
    totalText: '#fde68a',
    textPrimary: '#1f2937',
    textSecondary: '#6b7280',
    borderColor: '#b4530940',
  },
  nowoczesny: {
    headerBg: '#475569',
    headerText: '#ffffff',
    accentPrimary: '#2563eb',
    accentLight: '#eff6ff',
    tableHeaderBg: '#2563eb',
    tableHeaderText: '#ffffff',
    rowOdd: '#f8fafc',
    rowEven: '#ffffff',
    sectionHeaderBg: '#1e40af',
    sectionHeaderText: '#ffffff',
    setParentBg: '#fde68a',
    setParentBorder: '#d97706',
    childMatBg: '#fef9c3',
    childLabBg: '#dcfce7',
    subtotalBg: '#f1f5f9',
    warningBg: '#fef2f2',
    warningText: '#dc2626',
    totalBg: '#2563eb',
    totalText: '#ffffff',
    textPrimary: '#0f172a',
    textSecondary: '#64748b',
    borderColor: '#cbd5e1',
  },
  korporacyjny: {
    headerBg: '#1e3a8a',
    headerText: '#ffffff',
    accentPrimary: '#1e3a8a',
    accentLight: '#eff6ff',
    tableHeaderBg: '#1e3a8a',
    tableHeaderText: '#ffffff',
    rowOdd: '#f0f4ff',
    rowEven: '#ffffff',
    sectionHeaderBg: '#1e3a8a',
    sectionHeaderText: '#bfdbfe',
    setParentBg: '#fde68a',
    setParentBorder: '#d97706',
    childMatBg: '#fef9c3',
    childLabBg: '#dcfce7',
    subtotalBg: '#e8edf8',
    warningBg: '#fef2f2',
    warningText: '#dc2626',
    totalBg: '#1e3a8a',
    totalText: '#ffffff',
    textPrimary: '#0f172a',
    textSecondary: '#4b5563',
    borderColor: '#bfdbfe',
  },
  premium: {
    headerBg: '#4c1d95',
    headerText: '#ffffff',
    accentPrimary: '#4c1d95',
    accentLight: '#faf5ff',
    tableHeaderBg: '#4c1d95',
    tableHeaderText: '#ffffff',
    rowOdd: '#faf5ff',
    rowEven: '#ffffff',
    sectionHeaderBg: '#3b0764',
    sectionHeaderText: '#e9d5ff',
    setParentBg: '#fde68a',
    setParentBorder: '#d97706',
    childMatBg: '#fef9c3',
    childLabBg: '#dcfce7',
    subtotalBg: '#f2eeff',
    warningBg: '#fef2f2',
    warningText: '#dc2626',
    totalBg: '#4c1d95',
    totalText: '#ffffff',
    textPrimary: '#1e1b4b',
    textSecondary: '#6b7280',
    borderColor: '#c4b5fd',
  },
};

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface PdfRow {
  index: string;
  name: string;
  knrCode: string;
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
  isInvestorMat?: boolean;
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
}

export interface PdfProject {
  id: string;
  name: string;
  client_name?: string | null;
  client_address?: string | null;
  client_nip?: string | null;
  vat_rate?: number | null;
  regions?: { name?: string; price_modifier?: number } | null;
  object_types?: { name?: string } | null;
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

export interface PdfEngineData {
  theme: ThemeName;
  profile: PdfProfile | null;
  project: PdfProject;
  rows: PdfRow[];
  logoBase64: string | null;
  maskPrices: boolean;
  blindMode: boolean;
  showRg: boolean;
  showKnr: boolean;
  showKnrCoeffsInPdf?: boolean;
  matOwnedByClient: boolean;
  totalMatSum: number;
  totalLabSum: number;
  totalLaborHours: number;
  totalNet: number;
  vatRate: number;
  vatAmount: number;
  totalGross: number;
  pdfNarzuty?: PdfNarzutyDisplay;
  priceDisplay: string;
  notes: string;
}

// ─── Column Width Calculator ───────────────────────────────────────────────────

interface ColWidths {
  lp: string;
  name: string;
  knr?: string;
  unit: string;
  qty: string;
  rg?: string;
  mat: string;
  lab: string;
  total: string;
}

function calcColWidths(showKnr: boolean, showRg: boolean, matOwned: boolean): ColWidths {
  const base = {
    lp: 5,
    name: 30,
    knr: 10,
    unit: 5,
    qty: 5,
    rg: 10,
    mat: matOwned ? 0 : 11,
    lab: 11,
    total: matOwned ? 24 : 13,
  };
  const activeSum =
    base.lp + base.name +
    (showKnr ? base.knr : 0) +
    base.unit + base.qty +
    (showRg ? base.rg : 0) +
    base.mat + base.lab + base.total;

  const s = 100 / activeSum;
  const p = (v: number) => `${(v * s).toFixed(2)}%`;

  return {
    lp: p(base.lp),
    name: p(base.name),
    ...(showKnr ? { knr: p(base.knr) } : {}),
    unit: p(base.unit),
    qty: p(base.qty),
    ...(showRg ? { rg: p(base.rg) } : {}),
    mat: p(base.mat),
    lab: p(base.lab),
    total: p(base.total),
  };
}

// ─── Money Formatter ──────────────────────────────────────────────────────────

function fMoney(val: number): string {
  return new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val) + ' zł';
}

// ─── Base Styles ──────────────────────────────────────────────────────────────

const base = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    fontSize: 9,
    backgroundColor: '#ffffff',
    paddingTop: 25,
    paddingRight: 25,
    paddingBottom: 50,
    paddingLeft: 25,
  },
  pageFooter: {
    position: 'absolute',
    bottom: 15,
    left: 25,
    right: 25,
    fontSize: 7,
    color: '#9ca3af',
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 5,
  },
  // Header layout
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  companyBlock: { flex: 1, maxWidth: '55%' },
  docMetaBlock: { flex: 1, maxWidth: '40%', alignItems: 'flex-end' },
  logo: { maxWidth: 100, maxHeight: 40, marginBottom: 6, objectFit: 'contain' },
  companyName: { fontSize: 11, fontWeight: 'bold', marginBottom: 3 },
  companyDetail: { fontSize: 7.5, color: '#6b7280', marginBottom: 1.5 },
  docTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 4, textAlign: 'right' },
  docSubtitle: { fontSize: 8, color: '#6b7280', textAlign: 'right', marginBottom: 2 },
  docNumber: { fontSize: 8, textAlign: 'right' },
  headerDivider: { borderBottomWidth: 1, marginBottom: 12 },
  // Project strip
  projectStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderLeftWidth: 3,
    paddingLeft: 8,
    paddingVertical: 5,
    marginBottom: 10,
    borderRadius: 1,
  },
  projectName: { fontSize: 10, fontWeight: 'bold', marginBottom: 2 },
  projectMeta: { fontSize: 7.5, color: '#6b7280' },
  // Table
  tableHeaderRow: { flexDirection: 'row' },
  tableHeaderCell: { paddingVertical: 5, paddingHorizontal: 4, fontSize: 7.5, fontWeight: 'bold' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb' },
  tableCell: { paddingVertical: 4, paddingHorizontal: 4, fontSize: 8 },
  // Summary
  summaryContainer: { marginTop: 10, alignItems: 'flex-end' },
  summaryBox: {
    width: '58%',
    borderWidth: 1,
    borderRadius: 3,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  summaryLabel: { fontSize: 8, color: '#6b7280' },
  summaryValue: { fontSize: 8, textAlign: 'right' },
  summaryGrossRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, paddingTop: 6, marginTop: 4 },
  summaryGrossLabel: { fontSize: 10, fontWeight: 'bold' },
  summaryGrossValue: { fontSize: 10, fontWeight: 'bold', textAlign: 'right' },
  // Signatures
  signaturesRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  signatureBlock: { width: '44%' },
  signatureLine: { borderBottomWidth: 1, borderBottomColor: '#374151', marginBottom: 4 },
  signatureLabel: { fontSize: 7.5, color: '#6b7280' },
  disclaimer: { fontSize: 6.5, fontStyle: 'italic', color: '#9ca3af', textAlign: 'center', marginTop: 10 },
  // Cover page
  coverPage: {
    fontFamily: 'Roboto',
    fontSize: 9,
    backgroundColor: '#ffffff',
    paddingTop: 0,
    paddingRight: 0,
    paddingBottom: 40,
    paddingLeft: 0,
  },
  coverBanner: {
    paddingHorizontal: 35,
    paddingVertical: 30,
    marginBottom: 40,
  },
  coverLogoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  coverLogo: { maxWidth: 120, maxHeight: 50, objectFit: 'contain' },
  coverDocNumber: { fontSize: 9, color: 'rgba(255,255,255,0.7)' },
  coverCompanyName: { fontSize: 13, fontWeight: 'bold', color: '#ffffff', marginBottom: 3 },
  coverCompanyDetail: { fontSize: 8, color: 'rgba(255,255,255,0.75)', marginBottom: 1 },
  coverBody: { paddingHorizontal: 35 },
  coverTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 6 },
  coverSubtitle: { fontSize: 12, textAlign: 'center', marginBottom: 40 },
  coverClientLabel: { fontSize: 9, color: '#6b7280', textAlign: 'center', marginBottom: 4 },
  coverClientName: { fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginBottom: 3 },
  coverClientAddr: { fontSize: 9, color: '#6b7280', textAlign: 'center', marginBottom: 2 },
  coverTotalBox: { borderRadius: 6, padding: 20, marginTop: 40, alignSelf: 'center', width: '70%' },
  coverTotalLabel: { fontSize: 10, textAlign: 'center', marginBottom: 8 },
  coverTotalAmount: { fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  coverDate: { fontSize: 8, color: '#9ca3af', textAlign: 'center', position: 'absolute', bottom: 55, left: 0, right: 0 },
});

// ─── Page Footer (fixed, every page) ─────────────────────────────────────────

const PageFooter = ({ companyName, palette }: { companyName: string; palette: ThemePalette }) => (
  <Text
    style={[base.pageFooter, { borderTopColor: palette.borderColor, color: palette.textSecondary }]}
    render={({ pageNumber, totalPages }) =>
      `${companyName}  ·  ElektroSmart PRO  ·  Strona ${pageNumber} z ${totalPages}`
    }
    fixed
  />
);

// ─── Cover Page ───────────────────────────────────────────────────────────────

const CoverPage = ({
  data,
  palette,
}: {
  data: PdfEngineData;
  palette: ThemePalette;
}) => {
  const { profile, project, logoBase64, totalGross, maskPrices } = data;
  const companyName = profile?.company_name || 'ElektroSmart PRO';
  const companyLine = [
    profile?.street || profile?.address,
    [profile?.postal_code, profile?.city].filter(Boolean).join(' '),
  ].filter(Boolean).join(', ');
  const docNumber = `KO/${new Date().getFullYear()}/${project.id.slice(0, 8).toUpperCase()}`;

  return (
    <Page size="A4" style={base.coverPage}>
      {/* Colored banner */}
      <View style={[base.coverBanner, { backgroundColor: palette.headerBg }]}>
        <View style={base.coverLogoRow}>
          <View>
            {logoBase64 && (
              <Image src={logoBase64} style={base.coverLogo} />
            )}
            {!logoBase64 && (
              <Text style={base.coverCompanyName}>{companyName}</Text>
            )}
            {logoBase64 && (
              <Text style={[base.coverCompanyName, { marginTop: 4 }]}>{companyName}</Text>
            )}
            {companyLine ? <Text style={base.coverCompanyDetail}>{companyLine}</Text> : null}
            {profile?.nip ? <Text style={base.coverCompanyDetail}>NIP: {profile.nip}</Text> : null}
            {profile?.phone ? <Text style={base.coverCompanyDetail}>{profile.phone}</Text> : null}
            {profile?.email ? <Text style={base.coverCompanyDetail}>{profile.email}</Text> : null}
          </View>
          <View>
            <Text style={base.coverDocNumber}>NR DOKUMENTU</Text>
            <Text style={[base.coverDocNumber, { fontWeight: 'bold', fontSize: 11, color: '#ffffff', marginTop: 2 }]}>
              {docNumber}
            </Text>
          </View>
        </View>
      </View>

      {/* Body */}
      <View style={base.coverBody}>
        <Text style={[base.coverTitle, { color: palette.textPrimary }]}>KOSZTORYS OFERTOWY</Text>
        <Text style={[base.coverSubtitle, { color: palette.textSecondary }]}>
          {project.object_types?.name || 'Kosztorys elektryczny'} · {project.regions?.name || ''}
        </Text>

        {/* Client block */}
        <Text style={base.coverClientLabel}>NABYWCA / INWESTOR</Text>
        <Text style={[base.coverClientName, { color: palette.textPrimary }]}>
          {project.client_name || '—'}
        </Text>
        {project.client_address ? (
          <Text style={base.coverClientAddr}>{project.client_address}</Text>
        ) : null}
        {project.client_nip ? (
          <Text style={base.coverClientAddr}>NIP: {project.client_nip}</Text>
        ) : null}

        {/* Grand Total Box */}
        <View style={[base.coverTotalBox, { backgroundColor: palette.accentPrimary }]}>
          <Text style={[base.coverTotalLabel, { color: 'rgba(255,255,255,0.8)' }]}>
            WARTOŚĆ BRUTTO KOSZTORYSU
          </Text>
          <Text style={[base.coverTotalAmount, { color: '#ffffff' }]}>
            {maskPrices ? '*** zł' : fMoney(totalGross)}
          </Text>
        </View>
      </View>

      <Text style={base.coverDate}>
        {`Data sporządzenia: ${new Date().toLocaleDateString('pl-PL')}`}
      </Text>

      <PageFooter companyName={companyName} palette={palette} />
    </Page>
  );
};

// ─── Table Header Row ─────────────────────────────────────────────────────────

const TableHeaderRow = ({
  palette,
  cols,
  showKnr,
  showRg,
  matOwned,
}: {
  palette: ThemePalette;
  cols: ColWidths;
  showKnr: boolean;
  showRg: boolean;
  matOwned: boolean;
}) => (
  <View
    style={[
      base.tableHeaderRow,
      { backgroundColor: palette.tableHeaderBg },
    ]}
  >
    <View style={[base.tableHeaderCell, { width: cols.lp, color: palette.tableHeaderText }]}>
      <Text>LP</Text>
    </View>
    <View style={[base.tableHeaderCell, { width: cols.name, color: palette.tableHeaderText }]}>
      <Text>Nazwa pozycji</Text>
    </View>
    {showKnr && cols.knr ? (
      <View style={[base.tableHeaderCell, { width: cols.knr, color: palette.tableHeaderText, textAlign: 'center' }]}>
        <Text>Kod KNR</Text>
      </View>
    ) : null}
    <View style={[base.tableHeaderCell, { width: cols.unit, color: palette.tableHeaderText, textAlign: 'center' }]}>
      <Text>Jedn.</Text>
    </View>
    <View style={[base.tableHeaderCell, { width: cols.qty, color: palette.tableHeaderText, textAlign: 'right' }]}>
      <Text>Ilość</Text>
    </View>
    {showRg && cols.rg ? (
      <View style={[base.tableHeaderCell, { width: cols.rg, color: palette.tableHeaderText, textAlign: 'right' }]}>
        <Text>Nakł. r-g</Text>
      </View>
    ) : null}
    {!matOwned ? (
      <View style={[base.tableHeaderCell, { width: cols.mat, color: palette.tableHeaderText, textAlign: 'right' }]}>
        <Text>Materiał</Text>
      </View>
    ) : null}
    <View style={[base.tableHeaderCell, { width: cols.lab, color: palette.tableHeaderText, textAlign: 'right' }]}>
      <Text>Robocizna</Text>
    </View>
    <View style={[base.tableHeaderCell, { width: cols.total, color: palette.tableHeaderText, textAlign: 'right' }]}>
      <Text>Suma</Text>
    </View>
  </View>
);

// ─── Table Data Row ───────────────────────────────────────────────────────────

const TableDataRow = ({
  row,
  rowIndex,
  palette,
  cols,
  showKnr,
  showRg,
  matOwned,
}: {
  row: PdfRow;
  rowIndex: number;
  palette: ThemePalette;
  cols: ColWidths;
  showKnr: boolean;
  showRg: boolean;
  matOwned: boolean;
}) => {
  // Determine row background and text color based on rowType
  let rowBg = rowIndex % 2 === 0 ? palette.rowEven : palette.rowOdd;
  let textColor = palette.textPrimary;
  let fontStyle: 'normal' | 'italic' = 'normal';
  let fontWeight: 'normal' | 'bold' = 'normal';
  let borderLeftWidth = 0;
  let borderLeftColor = 'transparent';

  switch (row.rowType) {
    case 'section_header':
      rowBg = palette.sectionHeaderBg;
      textColor = palette.sectionHeaderText;
      fontWeight = 'bold';
      break;
    case 'set_parent':
      rowBg = palette.setParentBg;
      textColor = '#78350f';
      fontWeight = 'bold';
      borderLeftWidth = 4;
      borderLeftColor = palette.setParentBorder;
      break;
    case 'child_mat':
      rowBg = palette.childMatBg;
      textColor = '#92400e';
      fontStyle = 'italic';
      borderLeftWidth = 3;
      borderLeftColor = '#f59e0b';
      break;
    case 'child_lab':
      rowBg = palette.childLabBg;
      textColor = '#166534';
      fontStyle = 'italic';
      borderLeftWidth = 3;
      borderLeftColor = '#22c55e';
      break;
    case 'section_subtotal':
      rowBg = palette.subtotalBg;
      textColor = palette.textSecondary;
      fontStyle = 'italic';
      break;
    case 'warning':
      rowBg = palette.warningBg;
      textColor = palette.warningText;
      fontWeight = 'bold';
      break;
    default:
      break;
  }

  const cellStyle = {
    ...base.tableCell,
    color: textColor,
    fontStyle,
    fontWeight,
    backgroundColor: rowBg,
  };

  const isSectionHeader = row.rowType === 'section_header';

  return (
    <View
      style={[
        base.tableRow,
        {
          backgroundColor: rowBg,
          borderLeftWidth,
          borderLeftColor,
          borderBottomColor: palette.borderColor,
        },
      ]}
      wrap={false}
    >
      {/* LP */}
      <View style={[cellStyle, { width: cols.lp }]}>
        <Text>{row.index}</Text>
      </View>
      {/* Nazwa */}
      <View style={[cellStyle, { width: cols.name }]}>
        <Text>{row.name}</Text>
      </View>
      {/* KNR (optional) */}
      {showKnr && cols.knr ? (
        <View style={[cellStyle, { width: cols.knr, textAlign: 'center' }]}>
          <Text>{isSectionHeader ? '' : row.knrCode}</Text>
        </View>
      ) : null}
      {/* Jedn. */}
      <View style={[cellStyle, { width: cols.unit, textAlign: 'center' }]}>
        <Text>{isSectionHeader ? '' : row.unit}</Text>
      </View>
      {/* Ilość */}
      <View style={[cellStyle, { width: cols.qty, textAlign: 'right' }]}>
        <Text>{isSectionHeader ? '' : (row.qty > 0 ? String(row.qty) : '')}</Text>
      </View>
      {/* Nakłady r-g (optional) */}
      {showRg && cols.rg ? (
        <View style={[cellStyle, { width: cols.rg, textAlign: 'right' }]}>
          <Text>{isSectionHeader ? '' : row.rg}</Text>
        </View>
      ) : null}
      {/* Materiał */}
      {!matOwned ? (
        <View style={[cellStyle, { width: cols.mat, textAlign: 'right' }]}>
          {isSectionHeader ? (
            <Text></Text>
          ) : row.isInvestorMat ? (
            <Text style={{ color: '#2563eb', fontSize: 7, fontWeight: 'bold' }}>Inwestor</Text>
          ) : (
            <Text>{row.mat}</Text>
          )}
        </View>
      ) : null}
      {/* Robocizna */}
      <View style={[cellStyle, { width: cols.lab, textAlign: 'right' }]}>
        <Text>{isSectionHeader ? '' : row.lab}</Text>
      </View>
      {/* Suma */}
      <View style={[cellStyle, { width: cols.total, textAlign: 'right', fontWeight: 'bold', color: row.rowType === 'section_header' ? palette.sectionHeaderText : palette.accentPrimary }]}>
        <Text>{row.total}</Text>
      </View>
    </View>
  );
};

// ─── Summary Section ──────────────────────────────────────────────────────────

const SummarySection = ({
  data,
  palette,
}: {
  data: PdfEngineData;
  palette: ThemePalette;
}) => {
  const {
    maskPrices,
    totalMatSum, totalLabSum, totalLaborHours,
    totalNet, vatRate, vatAmount, totalGross,
    pdfNarzuty, priceDisplay, showRg, matOwnedByClient,
  } = data;

  const mask = (v: number) => maskPrices ? '*** zł' : fMoney(v);
  const priceLabel = priceDisplay === 'brutto' ? 'Ceny BRUTTO' : 'Ceny NETTO';

  return (
    <View style={base.summaryContainer}>
      <View style={[base.summaryBox, { borderColor: palette.borderColor, backgroundColor: palette.accentLight }]}>
        {!matOwnedByClient && (
          <View style={base.summaryRow}>
            <Text style={[base.summaryLabel, { color: palette.textSecondary }]}>Suma materiałów ({priceLabel}):</Text>
            <Text style={[base.summaryValue, { color: palette.textPrimary }]}>{mask(totalMatSum)}</Text>
          </View>
        )}
        <View style={base.summaryRow}>
          <Text style={[base.summaryLabel, { color: palette.textSecondary }]}>Suma robocizny ({priceLabel}):</Text>
          <Text style={[base.summaryValue, { color: palette.textPrimary }]}>{mask(totalLabSum)}</Text>
        </View>
        {showRg && totalLaborHours > 0 && (
          <View style={base.summaryRow}>
            <Text style={[base.summaryLabel, { color: palette.textSecondary }]}>Nakłady robocizny:</Text>
            <Text style={[base.summaryValue, { color: palette.textPrimary }]}>
              {totalLaborHours.toFixed(2)} rbh
            </Text>
          </View>
        )}
        {pdfNarzuty && pdfNarzuty.kpAmount > 0 && (
          <View style={base.summaryRow}>
            <Text style={[base.summaryLabel, { color: palette.textSecondary }]}>
              Koszty pośrednie Kp ({pdfNarzuty.kpPercent}%):
            </Text>
            <Text style={[base.summaryValue, { color: palette.textPrimary }]}>{mask(pdfNarzuty.kpAmount)}</Text>
          </View>
        )}
        {pdfNarzuty && pdfNarzuty.zAmount > 0 && (
          <View style={base.summaryRow}>
            <Text style={[base.summaryLabel, { color: palette.textSecondary }]}>
              Zysk Z ({pdfNarzuty.zPercent}%):
            </Text>
            <Text style={[base.summaryValue, { color: palette.textPrimary }]}>{mask(pdfNarzuty.zAmount)}</Text>
          </View>
        )}
        {pdfNarzuty && pdfNarzuty.kzAmount > 0 && (
          <View style={base.summaryRow}>
            <Text style={[base.summaryLabel, { color: palette.textSecondary }]}>
              Koszty zakupu Kz ({pdfNarzuty.kzPercent}%):
            </Text>
            <Text style={[base.summaryValue, { color: palette.textPrimary }]}>{mask(pdfNarzuty.kzAmount)}</Text>
          </View>
        )}
        <View style={[base.summaryRow, { borderTopWidth: 0.5, borderTopColor: palette.borderColor, paddingTop: 4, marginTop: 2 }]}>
          <Text style={[base.summaryLabel, { fontWeight: 'bold', color: palette.textPrimary }]}>RAZEM NETTO:</Text>
          <Text style={[base.summaryValue, { fontWeight: 'bold', color: palette.textPrimary }]}>{mask(totalNet)}</Text>
        </View>
        <View style={base.summaryRow}>
          <Text style={[base.summaryLabel, { color: '#059669' }]}>VAT {vatRate}%:</Text>
          <Text style={[base.summaryValue, { color: '#059669' }]}>{mask(vatAmount)}</Text>
        </View>
        {/* Grand total */}
        <View style={[base.summaryGrossRow, { borderTopColor: palette.accentPrimary }]}>
          <Text style={[base.summaryGrossLabel, { color: palette.accentPrimary }]}>RAZEM BRUTTO:</Text>
          <Text style={[base.summaryGrossValue, { color: palette.accentPrimary }]}>{mask(totalGross)}</Text>
        </View>
      </View>
    </View>
  );
};

// ─── Content Page (table + summary + signatures on last page) ─────────────────

const ContentPage = ({
  data,
  palette,
  isFirstContent,
}: {
  data: PdfEngineData;
  palette: ThemePalette;
  isFirstContent: boolean;
}) => {
  const { profile, project, rows, showKnr, showRg, matOwnedByClient, blindMode, isPro } = data as PdfEngineData & { isPro?: boolean };
  const companyName = profile?.company_name || 'ElektroSmart PRO';
  const cols = calcColWidths(showKnr, showRg, matOwnedByClient);
  const docNumber = `KO/${new Date().getFullYear()}/${project.id.slice(0, 8).toUpperCase()}`;

  return (
    <Page size="A4" style={base.page}>
      {/* Mini header on every content page */}
      <View style={[base.headerRow, { borderBottomWidth: 1, borderBottomColor: palette.borderColor, paddingBottom: 8, marginBottom: 8 }]}>
        <View style={base.companyBlock}>
          <Text style={[base.companyName, { color: palette.textPrimary }]}>{companyName}</Text>
          <Text style={[base.companyDetail, { color: palette.textSecondary }]}>
            {[profile?.street, [profile?.postal_code, profile?.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')}
          </Text>
        </View>
        <View style={base.docMetaBlock}>
          <Text style={[base.docTitle, { color: palette.accentPrimary, fontSize: 11 }]}>KOSZTORYS OFERTOWY</Text>
          <Text style={[base.docNumber, { color: palette.textSecondary }]}>{docNumber}</Text>
          <Text style={[base.docNumber, { color: palette.textSecondary }]}>{new Date().toLocaleDateString('pl-PL')}</Text>
        </View>
      </View>

      {/* Project strip */}
      {isFirstContent && (
        <View style={[base.projectStrip, { borderLeftColor: palette.accentPrimary, backgroundColor: palette.accentLight }]}>
          <View>
            <Text style={[base.projectName, { color: palette.textPrimary }]}>{project.name}</Text>
            <Text style={[base.projectMeta, { color: palette.textSecondary }]}>
              {[project.object_types?.name, project.regions?.name].filter(Boolean).join(' · ')}
            </Text>
          </View>
          {project.client_name ? (
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[base.projectMeta, { color: palette.textSecondary }]}>Inwestor:</Text>
              <Text style={[base.projectMeta, { fontWeight: 'bold', color: palette.textPrimary }]}>{project.client_name}</Text>
            </View>
          ) : null}
        </View>
      )}

      {/* Blind mode banner */}
      {blindMode && (
        <View style={{ backgroundColor: '#fef3c7', borderRadius: 3, padding: 6, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#f59e0b' }}>
          <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#92400e' }}>
            KOSZTORYS ŚLEPY — CENY POUFNE
          </Text>
        </View>
      )}

      {/* Table */}
      <TableHeaderRow palette={palette} cols={cols} showKnr={showKnr} showRg={showRg} matOwned={matOwnedByClient} />
      {rows.map((row, idx) => (
        <TableDataRow
          key={`row-${idx}`}
          row={row}
          rowIndex={idx}
          palette={palette}
          cols={cols}
          showKnr={showKnr}
          showRg={showRg}
          matOwned={matOwnedByClient}
        />
      ))}

      {/* Summary + Signatures + Disclaimer — kept together to avoid empty trailing page */}
      <View wrap={false}>
        <SummarySection data={data} palette={palette} />

        {/* Signatures */}
        <View style={base.signaturesRow}>
          <View style={base.signatureBlock}>
            <View style={[base.signatureLine, { borderBottomColor: palette.accentPrimary }]} />
            <Text style={[base.signatureLabel, { color: palette.textSecondary }]}>Sporządził / Wykonawca</Text>
          </View>
          <View style={base.signatureBlock}>
            <View style={[base.signatureLine, { borderBottomColor: palette.accentPrimary }]} />
            <Text style={[base.signatureLabel, { color: palette.textSecondary }]}>Zatwierdził / Zleceniodawca</Text>
          </View>
        </View>

        {data.notes ? (
          <View style={{ marginTop: 10, padding: 8, backgroundColor: palette.accentLight, borderRadius: 3, borderLeftWidth: 2, borderLeftColor: palette.accentPrimary }}>
            <Text style={{ fontSize: 7.5, color: palette.textSecondary, fontStyle: 'italic' }}>
              {`Uwagi: ${data.notes}`}
            </Text>
          </View>
        ) : null}

        <Text style={[base.disclaimer, { color: palette.textSecondary }]}>
          Niniejszy kosztorys ma charakter informacyjny i nie stanowi oferty handlowej w rozumieniu art. 66 Kodeksu Cywilnego.
        </Text>
      </View>

      <PageFooter companyName={companyName} palette={palette} />
    </Page>
  );
};

// ─── Main Document Export ─────────────────────────────────────────────────────

export const PremiumPdfDocument = ({ data }: { data: PdfEngineData }) => {
  const palette = THEMES[data.theme] ?? THEMES.klasyczny;

  return (
    <Document>
      <CoverPage data={data} palette={palette} />
      <ContentPage data={data} palette={palette} isFirstContent={true} />
    </Document>
  );
};

export default PremiumPdfDocument;
