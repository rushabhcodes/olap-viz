export interface DataRecord {
  product: string;
  region: string;
  quarter: string;
  sales: number;
  units: number;
  category?: string;
  month?: string;
}

export interface CubeData {
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
  x: 'product' | 'region' | 'quarter';
  y: 'product' | 'region' | 'quarter';
  z: 'product' | 'region' | 'quarter';
}
