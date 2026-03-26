export type ImportStep = "upload" | "analyzing" | "preview" | "importing" | "done";
export type ImportMode = "plik" | "pdf" | "przedmiar" | "excel" | "ai";

export interface AIProjectItem {
  name: string;
  unit: string;
  quantity: number;
  material_price: number;
  labor_price: number;
  knr_code?: string | null;
  knr_source?: string | null;
  labor_norm?: number | null;
}

export type ExcelRow = {
  name: string;
  unit: string;
  quantity: number;
  materialPrice: number;
  laborPrice: number;
  section: string;
  valid: boolean;
  knr_code?: string | null;
  error?: string;
};

export interface ParsedRow {
  [key: string]: string;
}

export interface DialogState {
  // Flow
  step: ImportStep;
  importMode: ImportMode;
  error: string | null;
  importCount: number;

  // File / AI items
  fileName: string;
  rawRows: ParsedRow[];
  columnHeaders: string[];
  aiItems: AIProjectItem[];
  selectedItems: Set<number>;
  editingIndex: number | null;

  // Przedmiar
  przedmiarText: string;
  przedmiarCleaning: boolean;

  // PDF / Vision
  pdfFile: File | null;
  pdfFileName: string;
  pdfPageNumber: number;
  pdfInstructions: string;
  pdfAnalyzing: boolean;
  pdfProgress: { current: number; total: number } | null;

  // Excel smart-parse
  excelHeaders: string[];
  excelParsedRows: ExcelRow[];
  excelImporting: boolean;
  excelAnalyzing: boolean;
}

export const INITIAL_STATE: DialogState = {
  step: "upload",
  importMode: "plik",
  error: null,
  importCount: 0,
  fileName: "",
  rawRows: [],
  columnHeaders: [],
  aiItems: [],
  selectedItems: new Set(),
  editingIndex: null,
  przedmiarText: "",
  przedmiarCleaning: false,
  pdfFile: null,
  pdfFileName: "",
  pdfPageNumber: 1,
  pdfInstructions: "",
  pdfAnalyzing: false,
  pdfProgress: null,
  excelHeaders: [],
  excelParsedRows: [],
  excelImporting: false,
  excelAnalyzing: false,
};

export type DialogAction =
  | { type: "SET_STEP"; payload: ImportStep }
  | { type: "SET_IMPORT_MODE"; payload: ImportMode }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_IMPORT_COUNT"; payload: number }
  | { type: "SET_FILE_NAME"; payload: string }
  | { type: "SET_RAW_ROWS"; payload: ParsedRow[] }
  | { type: "SET_COLUMN_HEADERS"; payload: string[] }
  | { type: "SET_AI_ITEMS"; payload: AIProjectItem[] }
  | { type: "SET_SELECTED_ITEMS"; payload: Set<number> }
  | { type: "TOGGLE_ITEM"; payload: number }
  | { type: "TOGGLE_ALL" }
  | { type: "REMOVE_ITEM"; payload: number }
  | { type: "UPDATE_ITEM"; payload: { index: number; field: keyof AIProjectItem; value: string | number } }
  | { type: "SET_EDITING_INDEX"; payload: number | null }
  | { type: "SET_PRZEDMIAR_TEXT"; payload: string }
  | { type: "SET_PRZEDMIAR_CLEANING"; payload: boolean }
  | { type: "SET_PDF_FILE"; payload: File | null }
  | { type: "SET_PDF_FILE_NAME"; payload: string }
  | { type: "SET_PDF_PAGE_NUMBER"; payload: number }
  | { type: "SET_PDF_INSTRUCTIONS"; payload: string }
  | { type: "SET_PDF_ANALYZING"; payload: boolean }
  | { type: "SET_PDF_PROGRESS"; payload: { current: number; total: number } | null }
  | { type: "SET_EXCEL_HEADERS"; payload: string[] }
  | { type: "SET_EXCEL_PARSED_ROWS"; payload: ExcelRow[] }
  | { type: "SET_EXCEL_IMPORTING"; payload: boolean }
  | { type: "SET_EXCEL_ANALYZING"; payload: boolean }
  | { type: "RESET" };

export function dialogReducer(state: DialogState, action: DialogAction): DialogState {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, step: action.payload };
    case "SET_IMPORT_MODE":
      return { ...state, importMode: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "SET_IMPORT_COUNT":
      return { ...state, importCount: action.payload };
    case "SET_FILE_NAME":
      return { ...state, fileName: action.payload };
    case "SET_RAW_ROWS":
      return { ...state, rawRows: action.payload };
    case "SET_COLUMN_HEADERS":
      return { ...state, columnHeaders: action.payload };
    case "SET_AI_ITEMS":
      return { ...state, aiItems: action.payload };
    case "SET_SELECTED_ITEMS":
      return { ...state, selectedItems: action.payload };
    case "TOGGLE_ITEM": {
      const next = new Set(state.selectedItems);
      next.has(action.payload) ? next.delete(action.payload) : next.add(action.payload);
      return { ...state, selectedItems: next };
    }
    case "TOGGLE_ALL":
      return {
        ...state,
        selectedItems:
          state.selectedItems.size === state.aiItems.length
            ? new Set()
            : new Set(state.aiItems.map((_, i) => i)),
      };
    case "REMOVE_ITEM": {
      const idx = action.payload;
      const next = new Set<number>();
      state.selectedItems.forEach(i => {
        if (i < idx) next.add(i);
        else if (i > idx) next.add(i - 1);
      });
      return {
        ...state,
        aiItems: state.aiItems.filter((_, i) => i !== idx),
        selectedItems: next,
        editingIndex: null,
      };
    }
    case "UPDATE_ITEM":
      return {
        ...state,
        aiItems: state.aiItems.map((item, i) =>
          i === action.payload.index
            ? { ...item, [action.payload.field]: action.payload.value }
            : item
        ),
      };
    case "SET_EDITING_INDEX":
      return { ...state, editingIndex: action.payload };
    case "SET_PRZEDMIAR_TEXT":
      return { ...state, przedmiarText: action.payload };
    case "SET_PRZEDMIAR_CLEANING":
      return { ...state, przedmiarCleaning: action.payload };
    case "SET_PDF_FILE":
      return { ...state, pdfFile: action.payload };
    case "SET_PDF_FILE_NAME":
      return { ...state, pdfFileName: action.payload };
    case "SET_PDF_PAGE_NUMBER":
      return { ...state, pdfPageNumber: action.payload };
    case "SET_PDF_INSTRUCTIONS":
      return { ...state, pdfInstructions: action.payload };
    case "SET_PDF_ANALYZING":
      return { ...state, pdfAnalyzing: action.payload };
    case "SET_PDF_PROGRESS":
      return { ...state, pdfProgress: action.payload };
    case "SET_EXCEL_HEADERS":
      return { ...state, excelHeaders: action.payload };
    case "SET_EXCEL_PARSED_ROWS":
      return { ...state, excelParsedRows: action.payload };
    case "SET_EXCEL_IMPORTING":
      return { ...state, excelImporting: action.payload };
    case "SET_EXCEL_ANALYZING":
      return { ...state, excelAnalyzing: action.payload };
    case "RESET":
      return { ...INITIAL_STATE };
    default:
      return state;
  }
}
