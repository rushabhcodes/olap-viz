import { useState, useEffect } from 'react';
import OLAPCube from './components/OLAPCube';
import ControlPanel from './components/ControlPanel';
import { CubeData, SliceParams, DiceParams } from './types/olap';
import { sampleSalesData } from './data/sampleData';
import sampleSalesV1 from './data/sample_sales_v1.csv?raw';
import sampleCustomCsv from './data/sample_sales_custom_cols.csv?raw';
import sampleV2 from './data/sample_sales_v2.json';
import samplePeople from './data/sample_people_sales.json';
import sampleHealthcare from './data/sample_healthcare.csv?raw';
import sampleIoT from './data/sample_iot_sensors.csv?raw';
import sampleEducation from './data/sample_education.json';
import sampleFinance from './data/sample_finance.json';
import {
  sliceData,
  diceData,
  getDimensions,
  drillDown,
  drillUp,
  exportToCSV,
  exportToJSON,
  parseCSV,
  normalizeToOLAP
} from './utils/cubeUtils';
import { Box } from 'lucide-react';

function App() {
  const [baseData, setBaseData] = useState<CubeData>(sampleSalesData);
  const [currentData, setCurrentData] = useState<CubeData>(sampleSalesData);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [currentOperation, setCurrentOperation] = useState<string>('');
  // dimensionMapping maps cube axes to actual dataset keys
  const [dimensionMapping, setDimensionMapping] = useState<any>({
    x: 'product',
    y: 'region',
    z: 'quarter',
    measure: 'sales'
  });

  const dimensions = getDimensions(baseData);
  const allColumns = Array.from(new Set(baseData.records.flatMap(r => Object.keys(r))));
  const [autoRotate, setAutoRotate] = useState(false);
  const [rotateSpeed, setRotateSpeed] = useState(0.002);

  useEffect(() => {
    const timer = setInterval(() => {
      setAnimationProgress(prev => {
        if (prev >= 1) {
          clearInterval(timer);
          return 1;
        }
        return prev + 0.02;
      });
    }, 20);

    return () => clearInterval(timer);
  }, [currentData]);

  const handleSlice = (params: SliceParams) => {
    setAnimationProgress(0);
    const slicedData = sliceData(baseData, params);
    setCurrentData(slicedData);
    setCurrentOperation(`Slice: ${params.dimension} = ${params.value}`);
  };

  const handleDice = (params: DiceParams) => {
    setAnimationProgress(0);
    const dicedData = diceData(baseData, params);
    setCurrentData(dicedData);

    const conditions = [];
    if (params.product) conditions.push(`Products: ${params.product.join(', ')}`);
    if (params.region) conditions.push(`Regions: ${params.region.join(', ')}`);
    if (params.quarter) conditions.push(`Quarters: ${params.quarter.join(', ')}`);

    setCurrentOperation(`Dice: ${conditions.join(' | ')}`);
  };

  const handleDrillDown = (dimension: 'product' | 'region' | 'quarter') => {
    setAnimationProgress(0);
    const drilledData = drillDown(currentData, dimension);
    setCurrentData(drilledData);
    setCurrentOperation(`Drill Down: ${dimension}`);
  };

  const handleDrillUp = (dimension: 'product' | 'region' | 'quarter') => {
    setAnimationProgress(0);
    const drilledData = drillUp(currentData, dimension);
    setCurrentData(drilledData);
    setCurrentOperation(`Drill Up: ${dimension}`);
  };

  const handlePivot = (mapping: { x: string; y: string; z: string }) => {
    setAnimationProgress(0);
    // if mapping includes measure keep it, otherwise keep existing measure key
    const measure = (mapping as any).measure || dimensionMapping.measure || 'sales';
    setDimensionMapping({ x: mapping.x, y: mapping.y, z: mapping.z, measure });
    setCurrentOperation(`Pivot: X=${mapping.x}, Y=${mapping.y}, Z=${mapping.z} (measure: ${measure})`);
  };

  const handleUpload = async (file: File) => {
    const text = await file.text();
    let data: CubeData | null = null;

    if (file.name.endsWith('.csv')) {
      data = parseCSV(text);
    } else if (file.name.endsWith('.json')) {
      try {
        data = JSON.parse(text);
      } catch (error) {
        alert('Invalid JSON file');
        return;
      }
    }

    if (data && data.records && data.records.length > 0) {
      // Normalize dataset to the expected OLAP shape and infer mapping
      const normalized = normalizeToOLAP(data);
      setAnimationProgress(0);
      setBaseData(normalized.data);
      setCurrentData(normalized.data);
      setDimensionMapping({ x: 'product', y: 'region', z: 'quarter', measure: 'sales' });
      setCurrentOperation(`Custom dataset loaded (inferred measure: ${normalized.mapping.measure})`);
    } else {
      alert('Invalid data format');
    }
  };

  const samples: { id: string; name: string; raw?: string; data?: any }[] = [
    { id: 'sales_v1', name: 'Sales V1 (canonical CSV)', raw: sampleSalesV1 },
    { id: 'custom_csv', name: 'Sales Custom Columns (CSV)', raw: sampleCustomCsv },
    { id: 'sales_v2', name: 'Sales V2 (JSON)', data: sampleV2 },
    { id: 'people', name: 'People Sales (JSON)', data: samplePeople },
    { id: 'healthcare', name: 'Healthcare (CSV)', raw: sampleHealthcare },
    { id: 'iot', name: 'IoT Sensors (CSV)', raw: sampleIoT },
    { id: 'education', name: 'Education (JSON)', data: sampleEducation },
    { id: 'finance', name: 'Finance (JSON)', data: sampleFinance }
  ];

  const loadSample = async (id: string) => {
    const s = samples.find(x => x.id === id);
    if (!s) return;
    let data: any = null;
    if (s.data) {
      // data is already parsed JSON
      data = s.data;
    } else if (s.raw) {
      // raw CSV string
      data = parseCSV(s.raw);
    }

    if (data && data.records && data.records.length > 0) {
      const normalized = normalizeToOLAP(data);
      setAnimationProgress(0);
      setBaseData(normalized.data);
      setCurrentData(normalized.data);
      setDimensionMapping({ x: 'product', y: 'region', z: 'quarter', measure: 'sales' });
      setCurrentOperation(`Loaded sample: ${s.name}`);
    }
  };

  const handleExport = (format: 'csv' | 'json') => {
    const content = format === 'csv' ? exportToCSV(currentData) : exportToJSON(currentData);
    const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `olap-data.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setAnimationProgress(0);
    setCurrentData(baseData);
    setDimensionMapping({ x: 'product', y: 'region', z: 'quarter' });
    setCurrentOperation('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <Box className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">3D OLAP Cube Visualization</h1>
              <p className="text-sm text-gray-600">Interactive multidimensional data analysis</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {currentOperation && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
            <p className="text-sm font-medium text-blue-900">
              Active Operation: <span className="font-bold">{currentOperation}</span>
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Showing {currentData.records.length} of {baseData.records.length} total records
            </p>
          </div>
        )}

        <div className="flex gap-6">
          <div className="flex-1 bg-white rounded-lg shadow-lg p-6" style={{ height: '700px' }}>
            <OLAPCube
              data={currentData}
              animationProgress={animationProgress}
              dimensionMapping={dimensionMapping}
              // disable auto-rotation by default; users can enable via props/UI later
              autoRotate={autoRotate}
              rotateSpeed={rotateSpeed}
            />
          </div>

          <ControlPanel
            onSlice={handleSlice}
            onDice={handleDice}
            onDrillDown={handleDrillDown}
            onDrillUp={handleDrillUp}
            onPivot={handlePivot}
            onUpload={handleUpload}
            onExport={handleExport}
            onReset={handleReset}
            dimensions={{
              products: dimensions.products.values,
              regions: dimensions.regions.values,
              quarters: dimensions.quarters.values
            }}
            currentMapping={dimensionMapping}
            allColumns={allColumns}
            autoRotate={autoRotate}
            rotateSpeed={rotateSpeed}
            onToggleRotate={(v) => setAutoRotate(v)}
            onSetRotateSpeed={(s) => setRotateSpeed(s)}
            samples={samples}
            onLoadSample={loadSample}
          />
        </div>

        <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">About OLAP Operations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-700">
            <div>
              <h4 className="font-semibold text-blue-600 mb-1">Slice</h4>
              <p>Reduces the cube by fixing one dimension at a specific value.</p>
            </div>
            <div>
              <h4 className="font-semibold text-green-600 mb-1">Dice</h4>
              <p>Creates a sub-cube by selecting specific values across multiple dimensions.</p>
            </div>
            <div>
              <h4 className="font-semibold text-purple-600 mb-1">Drill Down</h4>
              <p>Navigate from summary to more detailed data levels.</p>
            </div>
            <div>
              <h4 className="font-semibold text-pink-600 mb-1">Drill Up</h4>
              <p>Navigate from detailed to summary data levels.</p>
            </div>
            <div>
              <h4 className="font-semibold text-yellow-600 mb-1">Pivot</h4>
              <p>Rotate the cube to view data from different dimensional perspectives.</p>
            </div>
            <div>
              <h4 className="font-semibold text-indigo-600 mb-1">Upload/Export</h4>
              <p>Import custom datasets or export current view as CSV or JSON.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
