import { CubeData, CubeCell, Dimension, SliceParams, DiceParams, DimensionMapping } from '../types/olap';

export function getDimensions(data: CubeData): {
  products: Dimension;
  regions: Dimension;
  quarters: Dimension;
} {
  // assume canonical keys exist (product/region/quarter) after normalization
  const products = Array.from(new Set(data.records.map(r => r.product))).sort();
  const regions = Array.from(new Set(data.records.map(r => r.region))).sort();
  const quarters = Array.from(new Set(data.records.map(r => r.quarter))).sort();

  return {
    products: { name: 'Product', values: products },
    regions: { name: 'Region', values: regions },
    quarters: { name: 'Quarter', values: quarters }
  };
}

export function generateCubeCells(data: CubeData): CubeCell[] {
  const { products, regions, quarters } = getDimensions(data);
  const cells: CubeCell[] = [];

  data.records.forEach(record => {
    const x = products.values.indexOf(record.product);
    const y = regions.values.indexOf(record.region);
    const z = quarters.values.indexOf(record.quarter);

    cells.push({
      x,
      y,
      z,
      value: Number(record.sales) || 0,
      label: `${record.product} - ${record.region} - ${record.quarter}: ${record.sales}`,
      product: record.product,
      region: record.region,
      quarter: record.quarter
    });
  });

  return cells;
}

export function sliceData(data: CubeData, params: SliceParams): CubeData {
  return {
    records: data.records.filter(record => record[params.dimension] === params.value)
  };
}

export function diceData(data: CubeData, params: DiceParams): CubeData {
  return {
    records: data.records.filter(record => {
      const productMatch = !params.product || params.product.includes(record.product);
      const regionMatch = !params.region || params.region.includes(record.region);
      const quarterMatch = !params.quarter || params.quarter.includes(record.quarter);
      return productMatch && regionMatch && quarterMatch;
    })
  };
}

export function getMaxValue(data: CubeData): number {
  return Math.max(...data.records.map(r => r.sales));
}

export function drillDown(data: CubeData, dimension: 'product' | 'region' | 'quarter'): CubeData {
  if (dimension === 'quarter' && data.records.some(r => r.month)) {
    const detailedRecords = data.records.flatMap(record => {
      if (record.month) {
        return [record];
      }
      return [];
    });
    return { records: detailedRecords.length > 0 ? detailedRecords : data.records };
  }

  if (dimension === 'product' && data.records.some(r => r.category)) {
    return data;
  }

  return data;
}

export function drillUp(data: CubeData, dimension: 'product' | 'region' | 'quarter'): CubeData {
  if (dimension === 'quarter') {
    const aggregated = new Map<string, any>();

    data.records.forEach(record => {
      const key = `${record.product}-${record.region}-${record.quarter}`;
      if (!aggregated.has(key)) {
        aggregated.set(key, {
          product: record.product,
          category: record.category,
          region: record.region,
          quarter: record.quarter,
          sales: 0,
          units: 0
        });
      }
      const current = aggregated.get(key);
      current.sales += record.sales;
      current.units += record.units;
    });

    return { records: Array.from(aggregated.values()) };
  }

  if (dimension === 'product') {
    const aggregated = new Map<string, any>();

    data.records.forEach(record => {
      const key = `${record.category || 'All'}-${record.region}-${record.quarter}`;
      if (!aggregated.has(key)) {
        aggregated.set(key, {
          product: record.category || 'All Products',
          region: record.region,
          quarter: record.quarter,
          sales: 0,
          units: 0
        });
      }
      const current = aggregated.get(key);
      current.sales += record.sales;
      current.units += record.units;
    });

    return { records: Array.from(aggregated.values()) };
  }

  return data;
}

export function pivotData(data: CubeData, mapping: DimensionMapping): CubeData {
  // For now pivot is a no-op at data level; mapping is handled in the rendering layer.
  // Use mapping.measure to avoid unused param lint warnings.
  const _m = mapping.measure ?? 'sales';
  void _m;
  return data;
}

export function generateCubeCellsWithMapping(data: CubeData, mapping: DimensionMapping): CubeCell[] {
  let dimX = Array.from(new Set(data.records.map(r => String(r[mapping.x] ?? '')))).sort();
  let dimY = Array.from(new Set(data.records.map(r => String(r[mapping.y] ?? '')))).sort();
  let dimZ = Array.from(new Set(data.records.map(r => String(r[mapping.z] ?? '')))).sort();

  // If mapping keys are missing or produce only empty values, fallback to canonical fields
  const onlyEmpty = (arr: string[]) => arr.length === 0 || (arr.length === 1 && arr[0] === '');
  if (onlyEmpty(dimX)) {
    dimX = Array.from(new Set(data.records.map(r => String(r.product ?? '')))).sort();
  }
  if (onlyEmpty(dimY)) {
    dimY = Array.from(new Set(data.records.map(r => String(r.region ?? '')))).sort();
  }
  if (onlyEmpty(dimZ)) {
    dimZ = Array.from(new Set(data.records.map(r => String(r.quarter ?? '')))).sort();
  }

  const cells: CubeCell[] = [];

  data.records.forEach(record => {
  const rawX = record[mapping.x] ?? record.product;
  const rawY = record[mapping.y] ?? record.region;
  const rawZ = record[mapping.z] ?? record.quarter;
  const x = dimX.indexOf(String(rawX ?? ''));
  const y = dimY.indexOf(String(rawY ?? ''));
  const z = dimZ.indexOf(String(rawZ ?? ''));
  const val = Number(record[mapping.measure ?? 'sales'] ?? record.sales) || 0;

    cells.push({
      x,
      y,
      z,
      value: val,
      label: `${record[mapping.x]} - ${record[mapping.y]} - ${record[mapping.z]}: ${val}`,
      product: String(rawX ?? ''),
      region: String(rawY ?? ''),
      quarter: String(rawZ ?? '')
    });
  });

  return cells;
}

export function getDimensionsForMapping(data: CubeData, mapping: DimensionMapping) {
  let dimX = Array.from(new Set(data.records.map(r => String(r[mapping.x] ?? '')))).sort();
  let dimY = Array.from(new Set(data.records.map(r => String(r[mapping.y] ?? '')))).sort();
  let dimZ = Array.from(new Set(data.records.map(r => String(r[mapping.z] ?? '')))).sort();

  const onlyEmpty = (arr: string[]) => arr.length === 0 || (arr.length === 1 && arr[0] === '');
  if (onlyEmpty(dimX)) {
    dimX = Array.from(new Set(data.records.map(r => String(r.product ?? '')))).sort();
  }
  if (onlyEmpty(dimY)) {
    dimY = Array.from(new Set(data.records.map(r => String(r.region ?? '')))).sort();
  }
  if (onlyEmpty(dimZ)) {
    dimZ = Array.from(new Set(data.records.map(r => String(r.quarter ?? '')))).sort();
  }

  return {
    x: { name: mapping.x, values: dimX },
    y: { name: mapping.y, values: dimY },
    z: { name: mapping.z, values: dimZ }
  };
}

export function exportToCSV(data: CubeData): string {
  const headers = ['Product', 'Region', 'Quarter', 'Sales', 'Units'];
  const rows = data.records.map(r => [
    r.product,
    r.region,
    r.quarter,
    r.sales.toString(),
    r.units.toString()
  ]);

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

export function exportToJSON(data: CubeData): string {
  return JSON.stringify(data, null, 2);
}

export function parseCSV(csvText: string): CubeData | null {
  try {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return null;

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const records = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const record: any = {};

      headers.forEach((header, index) => {
        const value = values[index];
        if (header === 'sales' || header === 'units') {
          record[header] = parseFloat(value) || 0;
        } else {
          record[header] = value;
        }
      });

      return record;
    });

    return { records };
  } catch (error) {
    return null;
  }
}

function guessColumnByNames(keys: string[], candidates: string[]) {
  const lower = keys.map(k => k.toLowerCase());
  for (const c of candidates) {
    const idx = lower.indexOf(c.toLowerCase());
    if (idx !== -1) return keys[idx];
  }
  return null;
}

export function normalizeToOLAP(data: CubeData): { data: CubeData; mapping: { product: string; region: string; quarter: string; measure: string } } {
  const records = data.records || [];
  const allKeys = Array.from(new Set(records.flatMap(r => Object.keys(r))));

  // heuristics for common column names
  const productKey = guessColumnByNames(allKeys, ['product', 'item', 'name', 'sku']) || allKeys.find(k => typeof records[0]?.[k] === 'string') || allKeys[0] || 'product';
  const regionKey = guessColumnByNames(allKeys, ['region', 'country', 'state', 'area', 'location']) || allKeys.find(k => k !== productKey && typeof records[0]?.[k] === 'string') || allKeys[1] || 'region';
  const quarterKey = guessColumnByNames(allKeys, ['quarter', 'period', 'qtr', 'date', 'time', 'month']) || allKeys.find(k => k !== productKey && k !== regionKey && typeof records[0]?.[k] === 'string') || allKeys[2] || 'quarter';

  // find numeric measure (prefer sales/revenue/amount/units)
  const measureKey = guessColumnByNames(allKeys, ['sales', 'revenue', 'amount', 'value', 'units']) || allKeys.find(k => records.some(r => typeof r[k] === 'number')) || allKeys.find(k => records.some(r => !isNaN(parseFloat(String(r[k]))))) || 'sales';

  const normalized = records.map(rec => {
    const prod = rec[productKey] != null ? String(rec[productKey]) : '';
    const reg = rec[regionKey] != null ? String(rec[regionKey]) : '';
    const qtr = rec[quarterKey] != null ? String(rec[quarterKey]) : '';
    const measureVal = rec[measureKey] != null ? Number(rec[measureKey]) : parseFloat(String(rec[measureKey])) || 0;

    return {
      product: prod,
      region: reg,
      quarter: qtr,
      sales: Number(isNaN(measureVal) ? 0 : measureVal),
      // keep original fields too
      ...rec
    };
  });

  return {
    data: { records: normalized },
    mapping: { product: productKey, region: regionKey, quarter: quarterKey, measure: measureKey }
  };
}
