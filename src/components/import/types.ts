export interface ImportDateProposal {
  sheetOrder: number;
  label: string;
  startDate: string;
  endDate: string;
  yearWasExplicit: boolean;
}

export interface ImportPreview {
  fileName: string;
  sheetCount: number;
  rowCount: number;
  lineItemCount: number;
  periodCount: number;
  dates: ImportDateProposal[];
  attentionCount: number;
  labels: string[];
  income: number;
  recurring: number;
  weekly: number;
}

export interface ImportedAttention {
  id: number;
  periodId: number;
  periodLabel: string;
  merchant: string | null;
  note: string | null;
  amount: number;
  occurredOn: string | null;
  rawImport: string | null;
  attentionReason: string;
}

export interface UploadResult {
  preview: ImportPreview;
  attention: ImportedAttention[];
}
