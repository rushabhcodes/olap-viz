import { CubeData } from '../types/olap';

export const sampleSalesData: CubeData = {
  records: [
    { product: "Laptop", category: "Electronics", region: "North", quarter: "Q1", month: "January", sales: 4000, units: 13 },
    { product: "Laptop", category: "Electronics", region: "North", quarter: "Q1", month: "February", sales: 4200, units: 14 },
    { product: "Laptop", category: "Electronics", region: "North", quarter: "Q1", month: "March", sales: 3800, units: 13 },
    { product: "Laptop", category: "Electronics", region: "North", quarter: "Q2", sales: 15000, units: 50 },
    { product: "Laptop", category: "Electronics", region: "South", quarter: "Q1", sales: 9000, units: 30 },
    { product: "Laptop", category: "Electronics", region: "South", quarter: "Q2", sales: 10500, units: 35 },
    { product: "Phone", category: "Electronics", region: "North", quarter: "Q1", sales: 20000, units: 100 },
    { product: "Phone", category: "Electronics", region: "North", quarter: "Q2", sales: 22000, units: 110 },
    { product: "Phone", category: "Electronics", region: "South", quarter: "Q1", sales: 18000, units: 90 },
    { product: "Phone", category: "Electronics", region: "South", quarter: "Q2", sales: 19000, units: 95 },
    { product: "Tablet", category: "Electronics", region: "North", quarter: "Q1", sales: 8000, units: 50 },
    { product: "Tablet", category: "Electronics", region: "North", quarter: "Q2", sales: 9000, units: 55 },
    { product: "Tablet", category: "Electronics", region: "South", quarter: "Q1", sales: 7000, units: 45 },
    { product: "Tablet", category: "Electronics", region: "South", quarter: "Q2", sales: 7500, units: 48 }
  ]
};
