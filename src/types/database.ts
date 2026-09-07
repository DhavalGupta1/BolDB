export interface ColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: any;
  pk: number;
}

export interface TableSchema {
  name: string;
  rowCount: number;
  columns: ColumnInfo[];
  sql: string;
}

export interface QueryResult {
  columns: string[];
  values: any[][];
  rowCount: number;
  executionTimeMs: number;
  isMutation: boolean;
  affectedRows?: number;
  query: string;
  explanation?: string;
  suggestedChartType?: 'bar' | 'line' | 'pie' | 'none';
  error?: string;
}

export interface DatabaseMetadata {
  name: string;
  sizeBytes: number;
  tableCount: number;
  loadedAt: Date;
  isDirty: boolean;
}

export interface SampleDataset {
  id: string;
  name: string;
  description: string;
  tables: string[];
  category: string;
  badge: string;
}

export interface GeminiResponse {
  sql: string;
  explanation: string;
  isMutation: boolean;
  confidence?: number;
  suggestedChartType?: 'bar' | 'line' | 'pie' | 'none';
}
