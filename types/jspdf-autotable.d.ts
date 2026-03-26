import "jspdf";

interface AutoTableColumnStyle {
  cellWidth?: number | "auto" | "wrap";
  cellPadding?: number;
  halign?: "left" | "center" | "right";
  valign?: "top" | "middle" | "bottom";
  fontSize?: number;
  font?: string;
  fontStyle?: "normal" | "bold" | "italic" | "bolditalic";
  textColor?: string | number[];
  fillColor?: string | number[];
  lineWidth?: number;
  lineColor?: string | number[];
  overflow?: "linebreak" | "ellipsize" | "visible" | "hidden";
  minCellHeight?: number;
  minCellWidth?: number;
}

interface AutoTableOptions {
  startY?: number;
  head?: string[][];
  body?: (string | number)[][];
  foot?: string[][];
  theme?: "striped" | "grid" | "plain";
  headStyles?: AutoTableColumnStyle;
  bodyStyles?: AutoTableColumnStyle;
  footStyles?: AutoTableColumnStyle;
  alternateRowStyles?: AutoTableColumnStyle;
  columnStyles?: Record<number, AutoTableColumnStyle>;
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  styles?: AutoTableColumnStyle;
  tableWidth?: number | "auto" | "wrap";
  showHead?: "everyPage" | "firstPage" | "never";
  didParseCell?: (data: { section: string; row: { index: number }; cell: { styles: AutoTableColumnStyle } }) => void;
  didDrawCell?: (data: { section: string; row: { index: number }; cell: { styles: AutoTableColumnStyle } }) => void;
}

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: AutoTableOptions) => void;
    lastAutoTable: { finalY: number };
  }
}
