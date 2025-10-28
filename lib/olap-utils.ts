import { DataPoint, Dimension, Measure, OLAPCube, CubeCell, AxisAssignment } from './types';
import { groupBy, sumBy, meanBy, minBy, maxBy } from 'lodash';

export function detectDimensions(data: DataPoint[]): Dimension[] {
  if (!data || data.length === 0) return [];

  const dimensions: Dimension[] = [];
  const sampleRecord = data[0];

  Object.keys(sampleRecord).forEach(key => {
    // Skip obvious measure columns
    if (key.toLowerCase().includes('sales') || 
        key.toLowerCase().includes('revenue') || 
        key.toLowerCase().includes('profit') ||
        key.toLowerCase().includes('amount') ||
        key.toLowerCase().includes('quantity') && 
        data.every(row => typeof row[key] === 'number')) {
      return; // Skip these as they'll be treated as measures
    }

    const values = data.map(row => row[key]);
    const uniqueValues = [...new Set(values)];
    const numericValues = values.filter(v => typeof v === 'number' || !isNaN(Number(v)));
    
    let type: 'categorical' | 'numerical' | 'temporal' = 'categorical';
    
    if (numericValues.length > values.length * 0.8) {
      type = 'numerical';
    } else if (key.toLowerCase().includes('date') || key.toLowerCase().includes('time')) {
      type = 'temporal';
    }

    dimensions.push({
      name: key,
      type,
      values,
      uniqueValues
    });
  });

  return dimensions;
}

export function detectMeasures(data: DataPoint[], dimensions: Dimension[]): Measure[] {
  const measures: Measure[] = [];
  const dimensionNames = dimensions.map(d => d.name);

  Object.keys(data[0] || {}).forEach(key => {
    // Include columns that are explicitly measures or numeric columns not in dimensions
    const isExplicitMeasure = key.toLowerCase().includes('sales') || 
                             key.toLowerCase().includes('revenue') || 
                             key.toLowerCase().includes('profit') ||
                             key.toLowerCase().includes('amount') ||
                             key.toLowerCase().includes('quantity');
    
    const isNumericColumn = data.every(row => typeof row[key] === 'number' || !isNaN(Number(row[key])));
    
    if (!dimensionNames.includes(key) && (isExplicitMeasure || isNumericColumn)) {
      const values = data.map(row => Number(row[key])).filter(v => !isNaN(v));
      if (values.length > 0) {
        measures.push({
          name: key,
          type: 'sum',
          value: sumBy(values, v => v)
        });
      }
    }
  });

  return measures;
}

export function createOLAPCube(data: DataPoint[]): OLAPCube {
  const dimensions = detectDimensions(data);
  const measures = detectMeasures(data, dimensions);

  const cubeData: CubeCell[] = data.map(row => {
    const coordinates: { [dimension: string]: string | number } = {};
    const cellMeasures: { [measure: string]: number } = {};

    dimensions.forEach(dim => {
      coordinates[dim.name] = row[dim.name];
    });

    measures.forEach(measure => {
      cellMeasures[measure.name] = Number(row[measure.name]) || 0;
    });

    return {
      coordinates,
      measures: cellMeasures
    };
  });

  return {
    dimensions,
    measures,
    data: cubeData,
    metadata: {
      totalRecords: data.length,
      lastUpdated: new Date()
    }
  };
}

export function aggregateData(
  data: CubeCell[],
  groupByDimensions: string[],
  measureName: string,
  aggregationType: 'sum' | 'average' | 'count' | 'min' | 'max'
): CubeCell[] {
  const grouped = groupBy(data, cell => {
    return groupByDimensions.map(dim => cell.coordinates[dim]).join('|');
  });

  return Object.values(grouped).map(group => {
    const coordinates: { [dimension: string]: string | number } = {};
    groupByDimensions.forEach(dim => {
      coordinates[dim] = group[0].coordinates[dim];
    });

    let aggregatedValue = 0;
    const values = group.map(cell => cell.measures[measureName] || 0);

    switch (aggregationType) {
      case 'sum':
        aggregatedValue = sumBy(values, v => v);
        break;
      case 'average':
        aggregatedValue = meanBy(values, v => v);
        break;
      case 'count':
        aggregatedValue = values.length;
        break;
      case 'min':
        aggregatedValue = minBy(values, v => v) || 0;
        break;
      case 'max':
        aggregatedValue = maxBy(values, v => v) || 0;
        break;
    }

    return {
      coordinates,
      measures: { [measureName]: aggregatedValue }
    };
  });
}

export function sliceCube(
  cube: OLAPCube,
  dimension: string,
  value: string | number
): OLAPCube {
  const filteredData = cube.data.filter(
    cell => cell.coordinates[dimension] === value
  );

  return {
    ...cube,
    data: filteredData,
    metadata: {
      ...cube.metadata,
      totalRecords: filteredData.length
    }
  };
}

export function diceCube(
  cube: OLAPCube,
  conditions: { [dimension: string]: (string | number)[] }
): OLAPCube {
  const filteredData = cube.data.filter(cell => {
    return Object.entries(conditions).every(([dimension, values]) =>
      values.includes(cell.coordinates[dimension])
    );
  });

  return {
    ...cube,
    data: filteredData,
    metadata: {
      ...cube.metadata,
      totalRecords: filteredData.length
    }
  };
}

export function drillDown(
  cube: OLAPCube,
  dimension: string,
  targetLevel: string
): OLAPCube {
  console.log(`Drilling down on ${dimension} to ${targetLevel}`);
  return cube;
}

export function drillUp(
  cube: OLAPCube,
  dimension: string,
  sourceLevel: string
): OLAPCube {
  console.log(`Drilling up on ${dimension} from ${sourceLevel}`);
  return cube;
}

export function pivotCube(
  cube: OLAPCube,
  newAxisAssignment: AxisAssignment
): OLAPCube {
  console.log('Pivoting cube with new axis assignment:', newAxisAssignment);
  return cube;
}

export function generateColorScale(values: number[]): string[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;

  return values.map(value => {
    const normalized = range === 0 ? 0.5 : (value - min) / range;
    const hue = (1 - normalized) * 240;
    return `hsl(${hue}, 70%, 50%)`;
  });
}