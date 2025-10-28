export interface DataPoint {
  [key: string]: string | number;
}

export interface Dimension {
  name: string;
  type: 'categorical' | 'numerical' | 'temporal';
  values: (string | number)[];
  uniqueValues: (string | number)[];
  hierarchy?: {
    levels: string[];
    parentMap: { [key: string]: string };
    childMap: { [key: string]: string[] };
  };
}

export interface Measure {
  name: string;
  type: 'sum' | 'average' | 'count' | 'min' | 'max';
  value: number;
}

export interface CubeCell {
  coordinates: { [dimension: string]: string | number };
  measures: { [measure: string]: number };
  color?: string;
}

export interface OLAPCube {
  dimensions: Dimension[];
  measures: Measure[];
  data: CubeCell[];
  metadata: {
    totalRecords: number;
    lastUpdated: Date;
  };
}

export interface AxisAssignment {
  x: string | null;
  y: string | null;
  z: string | null;
  measure: string | null;
}

export interface OLAPOperation {
  type: 'slice' | 'dice' | 'drill-down' | 'drill-up' | 'pivot';
  dimension?: string;
  value?: string | number;
  targetLevel?: string;
  sourceLevel?: string;
  newAxisAssignment?: AxisAssignment;
}

export interface DataVisualizationState {
  cube: OLAPCube | null;
  axisAssignment: AxisAssignment;
  currentOperation: OLAPOperation | null;
  selectedCell: CubeCell | null;
  aggregationType: 'sum' | 'average' | 'count' | 'min' | 'max';
}

export interface TableState {
  data: DataPoint[];
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  filters: { [column: string]: string[] };
  currentPage: number;
  pageSize: number;
}

export interface ViewMode {
  type: '3d' | 'table' | 'split';
  splitRatio: number;
}