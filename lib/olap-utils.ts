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

    // Create hierarchy for dimensions that support drilling
    let hierarchy: {
      levels: string[];
      parentMap: { [key: string]: string };
      childMap: { [key: string]: string[] };
    } | undefined;
    
    if (key === 'Date') {
      // Create date hierarchy: Year -> Month -> Day
      const dates = values.map(v => String(v));
      const years = [...new Set(dates.map(d => d.split('-')[0]))];
      const months = [...new Set(dates.map(d => d.split('-').slice(0, 2).join('-')))];
      
      hierarchy = {
        levels: ['Year', 'Month', 'Day'],
        parentMap: {} as { [key: string]: string },
        childMap: {} as { [key: string]: string[] }
      };
      
      // Build parent-child relationships
      dates.forEach(date => {
        const [year, month, day] = date.split('-');
        const monthKey = `${year}-${month}`;
        
        if (hierarchy) {
          hierarchy.parentMap[date] = monthKey;
          hierarchy.parentMap[monthKey] = year;
          
          if (!hierarchy.childMap[year]) hierarchy.childMap[year] = [];
          if (!hierarchy.childMap[monthKey]) hierarchy.childMap[monthKey] = [];
          
          hierarchy.childMap[year].push(monthKey);
          hierarchy.childMap[monthKey].push(date);
        }
      });
    } else if (key === 'Product') {
      // Create product hierarchy: Category -> Product
      const categories = [...new Set(data.map(row => row.Category))];
      const products = uniqueValues as string[];
      
      hierarchy = {
        levels: ['Category', 'Product'],
        parentMap: {} as { [key: string]: string },
        childMap: {} as { [key: string]: string[] }
      };
      
      products.forEach(product => {
        const category = data.find(row => row.Product === product)?.Category;
        if (category && hierarchy) {
          hierarchy.parentMap[product] = String(category);
          if (!hierarchy.childMap[category]) hierarchy.childMap[category] = [];
          hierarchy.childMap[category].push(product);
        }
      });
    }

    dimensions.push({
      name: key,
      type,
      values,
      uniqueValues,
      hierarchy
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
  if (!cube || !cube.data.length) return cube;

  const dim = cube.dimensions.find(d => d.name === dimension);
  if (!dim || !dim.hierarchy) return cube;

  const measureName = cube.measures[0]?.name;
  if (!measureName) return cube;

  // Get current level and find next level down
  const currentValues = [...new Set(cube.data.map(cell => cell.coordinates[dimension]))];
  const nextLevelValues = new Set<string>();

  currentValues.forEach(value => {
    const valueStr = String(value);
    // Get children of current values (safely handle missing hierarchy/childMap)
    const children = dim.hierarchy?.childMap?.[valueStr] || [];
    children.forEach(child => nextLevelValues.add(child));
  });

  if (nextLevelValues.size === 0) return cube;

  // Filter data to include only next level values
  const drilledData = cube.data.filter(cell => 
    nextLevelValues.has(String(cell.coordinates[dimension]))
  );

  return {
    ...cube,
    data: drilledData,
    metadata: {
      ...cube.metadata,
      totalRecords: drilledData.length
    }
  };
}

export function drillUp(
  cube: OLAPCube,
  dimension: string,
  sourceLevel: string
): OLAPCube {
  console.log(`Drilling up on ${dimension} from ${sourceLevel}`);

  if (!cube || !cube.data.length) return cube;
  const measureName = cube.measures[0]?.name;
  if (!measureName) return cube;

  const parseToDate = (val: string | number | Date | null): Date | null => {
    if (val == null) return null;
    if (val instanceof Date) return val;
    const s = String(val);
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(s);
    if (/^\d{4}-\d{2}$/.test(s)) return new Date(s + '-01');
    if (/^\d{4}$/.test(s)) return new Date(s + '-01-01');
    const parsed = Date.parse(s);
    return isNaN(parsed) ? null : new Date(parsed);
  };

  const detectGranularity = (values: (string | number | Date | null)[]): 'year' | 'month' | 'day' => {
    for (const v of values) {
      const s = String(v);
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return 'day';
      if (/^\d{4}-\d{2}$/.test(s)) return 'month';
      if (/^\d{4}$/.test(s)) return 'year';
    }
    return 'day';
  };

  const dimValues = cube.data.map(cell => cell.coordinates[dimension]);
  const currentGran = detectGranularity(dimValues);

  // map to coarser granularity
  const coarser = currentGran === 'day' ? 'month' : currentGran === 'month' ? 'year' : 'year';

  const transformed: CubeCell[] = cube.data.map(cell => {
    const original = cell.coordinates[dimension];
    const d = parseToDate(original);
    let newCoord: string | number = original;
    if (d) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      if (coarser === 'month') newCoord = `${y}-${m}`;
      else if (coarser === 'year') newCoord = `${y}`;
    }
    return {
      ...cell,
      coordinates: {
        ...cell.coordinates,
        [dimension]: newCoord
      }
    };
  });

  const groupByDims = cube.dimensions.map(d => d.name);
  const aggregated = aggregateData(transformed, groupByDims, measureName, 'sum');

  const existingDim = cube.dimensions.find(d => d.name === dimension);
  const uniqueValues = Array.from(new Set(aggregated.map(a => a.coordinates[dimension])));
  const newDim: Dimension = existingDim
    ? { ...existingDim, uniqueValues, values: uniqueValues }
    : { name: dimension, type: 'temporal', values: uniqueValues, uniqueValues };

  const newDimensions = cube.dimensions.map(d => d.name === dimension ? newDim : d);
  const total = sumBy(aggregated, c => c.measures[measureName] || 0);
  const newMeasures = [{ name: measureName, type: 'sum' as const, value: total }];

  return {
    ...cube,
    dimensions: newDimensions,
    measures: newMeasures,
    data: aggregated,
    metadata: {
      ...cube.metadata,
      totalRecords: aggregated.length,
      lastUpdated: new Date()
    }
  };
}

export function pivotCube(
  cube: OLAPCube,
  newAxisAssignment: AxisAssignment
): OLAPCube {
  console.log('Pivoting cube with new axis assignment:', newAxisAssignment);

  if (!cube) return cube;

  const axes = [newAxisAssignment.x, newAxisAssignment.y, newAxisAssignment.z].filter(
    (d): d is string => typeof d === 'string' && d !== null
  );

  if (axes.length === 0) {
    // nothing to pivot to
    return cube;
  }

  // choose measure
  const measureName = newAxisAssignment.measure || cube.measures[0]?.name || null;
  if (!measureName) return cube;

  // Aggregate data by the selected axes using sum (common pivot behavior)
  const aggregated = aggregateData(cube.data, axes, measureName, 'sum');

  // Build new dimensions in the order of axes
  const newDimensions: Dimension[] = axes.map(axisName => {
    const existing = cube.dimensions.find(d => d.name === axisName);
    const uniqueValues = Array.from(new Set(aggregated.map(a => a.coordinates[axisName])));
    return existing
      ? { ...existing, uniqueValues }
      : { name: String(axisName), type: 'categorical', values: uniqueValues, uniqueValues };
  });

  // Build new measure (sum)
  const total = sumBy(aggregated, c => c.measures[measureName] || 0);
  const newMeasures = [{ name: measureName, type: 'sum' as const, value: total }];

  return {
    dimensions: newDimensions,
    measures: newMeasures,
    data: aggregated,
    metadata: {
      totalRecords: aggregated.length,
      lastUpdated: new Date()
    }
  };
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