import { CubeData, CubeCell, Dimension, SliceParams, DiceParams, DrillParams, PivotParams, DimensionMapping } from '../types/olap';

export function getDimensions(data: CubeData): {
  products: Dimension;
  regions: Dimension;
  quarters: Dimension;
} {
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
      value: record.sales,
      label: `${record.product} - ${record.region} - ${record.quarter}: $${record.sales}`,
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
  return data;
}

export function generateCubeCellsWithMapping(data: CubeData, mapping: DimensionMapping): CubeCell[] {
  const dimensions = {
    [mapping.x]: Array.from(new Set(data.records.map(r => r[mapping.x]))).sort(),
    [mapping.y]: Array.from(new Set(data.records.map(r => r[mapping.y]))).sort(),
    [mapping.z]: Array.from(new Set(data.records.map(r => r[mapping.z]))).sort()
  };

  const cells: CubeCell[] = [];

  data.records.forEach(record => {
    const x = dimensions[mapping.x].indexOf(record[mapping.x]);
    const y = dimensions[mapping.y].indexOf(record[mapping.y]);
    const z = dimensions[mapping.z].indexOf(record[mapping.z]);

    cells.push({
      x,
      y,
      z,
      value: record.sales,
      label: `${record[mapping.x]} - ${record[mapping.y]} - ${record[mapping.z]}: $${record.sales}`,
      product: record.product,
      region: record.region,
      quarter: record.quarter
    });
  });

  return cells;
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
