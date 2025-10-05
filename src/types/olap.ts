export type DataRecord = Record<string, any>;

export interface CubeData {
  // Generic list of records. Each record is a map from column name to value.
  records: DataRecord[];
}

export interface Dimension {
  name: string;
  values: string[];
}

export interface CubeCell {
  x: number;
  y: number;
  z: number;
  value: number;
  label: string;
  product?: string;
  region?: string;
  quarter?: string;
}

export type OperationType = 'slice' | 'dice' | 'drill-down' | 'drill-up' | 'pivot';

export interface SliceParams {
  // The logical dimension name used by the UI: 'product'|'region'|'quarter'.
  // These map to actual dataset column names inside the app via the inferred mapping.
  dimension: 'product' | 'region' | 'quarter';
  value: string;
}

export interface DiceParams {
  product?: string[];
  region?: string[];
  quarter?: string[];
}

export type DrillLevel = 'summary' | 'detail';

export interface DrillParams {
  level: DrillLevel;
  dimension?: 'product' | 'region' | 'quarter';
}

export interface PivotParams {
  axis1: 'product' | 'region' | 'quarter';
  axis2: 'product' | 'region' | 'quarter';
}

export interface DimensionMapping {
  // Map the 3 cube axes to actual dataset column names (string keys).
  x: string;
  y: string;
  z: string;
  // optional measure column name (e.g. 'sales')
  measure?: string;
}
