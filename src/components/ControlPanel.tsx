import { useState } from 'react';
import { Slice, Grid3x3, TrendingDown, TrendingUp, RotateCw, Upload, Download } from 'lucide-react';
import { SliceParams, DiceParams, OperationType, DimensionMapping } from '../types/olap';

interface ControlPanelProps {
  onSlice: (params: SliceParams) => void;
  onDice: (params: DiceParams) => void;
  onDrillDown: (dimension: 'product' | 'region' | 'quarter') => void;
  onDrillUp: (dimension: 'product' | 'region' | 'quarter') => void;
  onPivot: (mapping: DimensionMapping) => void;
  onUpload: (file: File) => void;
  onExport: (format: 'csv' | 'json') => void;
  onReset: () => void;
  dimensions: {
    products: string[];
    regions: string[];
    quarters: string[];
  };
  currentMapping: DimensionMapping;
}

export default function ControlPanel({
  onSlice,
  onDice,
  onDrillDown,
  onDrillUp,
  onPivot,
  onUpload,
  onExport,
  onReset,
  dimensions,
  currentMapping
}: ControlPanelProps) {
  const [activeOperation, setActiveOperation] = useState<OperationType | null>(null);
  const [sliceDimension, setSliceDimension] = useState<'product' | 'region' | 'quarter'>('product');
  const [sliceValue, setSliceValue] = useState<string>('');

  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedQuarters, setSelectedQuarters] = useState<string[]>([]);

  const [drillDimension, setDrillDimension] = useState<'product' | 'region' | 'quarter'>('quarter');
  const [pivotAxis1, setPivotAxis1] = useState<'product' | 'region' | 'quarter'>('product');
  const [pivotAxis2, setPivotAxis2] = useState<'product' | 'region' | 'quarter'>('region');

  const handleSlice = () => {
    if (sliceValue) {
      onSlice({ dimension: sliceDimension, value: sliceValue });
    }
  };

  const handleDice = () => {
    const params: DiceParams = {};
    if (selectedProducts.length > 0) params.product = selectedProducts;
    if (selectedRegions.length > 0) params.region = selectedRegions;
    if (selectedQuarters.length > 0) params.quarter = selectedQuarters;

    if (Object.keys(params).length > 0) {
      onDice(params);
    }
  };

  const handlePivot = () => {
    const remainingDim = (['product', 'region', 'quarter'] as const).find(
      d => d !== pivotAxis1 && d !== pivotAxis2
    );
    if (remainingDim) {
      onPivot({
        x: pivotAxis1,
        y: pivotAxis2,
        z: remainingDim
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  const toggleSelection = (
    value: string,
    selectedArray: string[],
    setterFunction: (values: string[]) => void
  ) => {
    if (selectedArray.includes(value)) {
      setterFunction(selectedArray.filter(v => v !== value));
    } else {
      setterFunction([...selectedArray, value]);
    }
  };

  return (
    <div className="w-96 bg-white rounded-lg shadow-xl p-6 space-y-4 overflow-y-auto max-h-screen">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">OLAP Operations</h2>
        <p className="text-sm text-gray-600">Interact with the 3D data cube</p>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => setActiveOperation(activeOperation === 'slice' ? null : 'slice')}
          className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
            activeOperation === 'slice'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-blue-300'
          }`}
        >
          <Slice className="w-5 h-5 text-blue-600" />
          <div className="text-left flex-1">
            <div className="font-semibold text-gray-800 text-sm">Slice</div>
            <div className="text-xs text-gray-600">Select data from one dimension</div>
          </div>
        </button>

        {activeOperation === 'slice' && (
          <div className="ml-4 p-3 bg-gray-50 rounded-lg space-y-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Dimension</label>
              <select
                value={sliceDimension}
                onChange={(e) => {
                  setSliceDimension(e.target.value as 'product' | 'region' | 'quarter');
                  setSliceValue('');
                }}
                className="w-full p-2 text-sm border border-gray-300 rounded-lg"
              >
                <option value="product">Product</option>
                <option value="region">Region</option>
                <option value="quarter">Quarter</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Value</label>
              <select
                value={sliceValue}
                onChange={(e) => setSliceValue(e.target.value)}
                className="w-full p-2 text-sm border border-gray-300 rounded-lg"
              >
                <option value="">Select a value</option>
                {sliceDimension === 'product' && dimensions.products.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
                {sliceDimension === 'region' && dimensions.regions.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
                {sliceDimension === 'quarter' && dimensions.quarters.map(q => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSlice}
              disabled={!sliceValue}
              className="w-full bg-blue-600 text-white py-2 text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Apply Slice
            </button>
          </div>
        )}

        <button
          onClick={() => setActiveOperation(activeOperation === 'dice' ? null : 'dice')}
          className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
            activeOperation === 'dice'
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 hover:border-green-300'
          }`}
        >
          <Grid3x3 className="w-5 h-5 text-green-600" />
          <div className="text-left flex-1">
            <div className="font-semibold text-gray-800 text-sm">Dice</div>
            <div className="text-xs text-gray-600">Select sub-cube by multiple dimensions</div>
          </div>
        </button>

        {activeOperation === 'dice' && (
          <div className="ml-4 p-3 bg-gray-50 rounded-lg space-y-3 max-h-64 overflow-y-auto">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Products</label>
              <div className="space-y-1">
                {dimensions.products.map(product => (
                  <label key={product} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product)}
                      onChange={() => toggleSelection(product, selectedProducts, setSelectedProducts)}
                      className="w-3 h-3"
                    />
                    <span className="text-xs text-gray-700">{product}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Regions</label>
              <div className="space-y-1">
                {dimensions.regions.map(region => (
                  <label key={region} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedRegions.includes(region)}
                      onChange={() => toggleSelection(region, selectedRegions, setSelectedRegions)}
                      className="w-3 h-3"
                    />
                    <span className="text-xs text-gray-700">{region}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Quarters</label>
              <div className="space-y-1">
                {dimensions.quarters.map(quarter => (
                  <label key={quarter} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedQuarters.includes(quarter)}
                      onChange={() => toggleSelection(quarter, selectedQuarters, setSelectedQuarters)}
                      className="w-3 h-3"
                    />
                    <span className="text-xs text-gray-700">{quarter}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleDice}
              disabled={selectedProducts.length === 0 && selectedRegions.length === 0 && selectedQuarters.length === 0}
              className="w-full bg-green-600 text-white py-2 text-sm rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Apply Dice
            </button>
          </div>
        )}

        <button
          onClick={() => setActiveOperation(activeOperation === 'drill-down' ? null : 'drill-down')}
          className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
            activeOperation === 'drill-down'
              ? 'border-purple-500 bg-purple-50'
              : 'border-gray-200 hover:border-purple-300'
          }`}
        >
          <TrendingDown className="w-5 h-5 text-purple-600" />
          <div className="text-left flex-1">
            <div className="font-semibold text-gray-800 text-sm">Drill Down</div>
            <div className="text-xs text-gray-600">View detailed level data</div>
          </div>
        </button>

        {activeOperation === 'drill-down' && (
          <div className="ml-4 p-3 bg-gray-50 rounded-lg space-y-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Dimension</label>
              <select
                value={drillDimension}
                onChange={(e) => setDrillDimension(e.target.value as 'product' | 'region' | 'quarter')}
                className="w-full p-2 text-sm border border-gray-300 rounded-lg"
              >
                <option value="product">Product (to Category)</option>
                <option value="region">Region</option>
                <option value="quarter">Quarter (to Month)</option>
              </select>
            </div>

            <button
              onClick={() => onDrillDown(drillDimension)}
              className="w-full bg-purple-600 text-white py-2 text-sm rounded-lg hover:bg-purple-700 transition-colors"
            >
              Drill Down
            </button>
          </div>
        )}

        <button
          onClick={() => setActiveOperation(activeOperation === 'drill-up' ? null : 'drill-up')}
          className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
            activeOperation === 'drill-up'
              ? 'border-pink-500 bg-pink-50'
              : 'border-gray-200 hover:border-pink-300'
          }`}
        >
          <TrendingUp className="w-5 h-5 text-pink-600" />
          <div className="text-left flex-1">
            <div className="font-semibold text-gray-800 text-sm">Drill Up</div>
            <div className="text-xs text-gray-600">View summary level data</div>
          </div>
        </button>

        {activeOperation === 'drill-up' && (
          <div className="ml-4 p-3 bg-gray-50 rounded-lg space-y-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Dimension</label>
              <select
                value={drillDimension}
                onChange={(e) => setDrillDimension(e.target.value as 'product' | 'region' | 'quarter')}
                className="w-full p-2 text-sm border border-gray-300 rounded-lg"
              >
                <option value="product">Product (to Category)</option>
                <option value="region">Region</option>
                <option value="quarter">Quarter (aggregate months)</option>
              </select>
            </div>

            <button
              onClick={() => onDrillUp(drillDimension)}
              className="w-full bg-pink-600 text-white py-2 text-sm rounded-lg hover:bg-pink-700 transition-colors"
            >
              Drill Up
            </button>
          </div>
        )}

        <button
          onClick={() => setActiveOperation(activeOperation === 'pivot' ? null : 'pivot')}
          className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
            activeOperation === 'pivot'
              ? 'border-yellow-500 bg-yellow-50'
              : 'border-gray-200 hover:border-yellow-300'
          }`}
        >
          <RotateCw className="w-5 h-5 text-yellow-600" />
          <div className="text-left flex-1">
            <div className="font-semibold text-gray-800 text-sm">Pivot</div>
            <div className="text-xs text-gray-600">Rotate cube dimensions</div>
          </div>
        </button>

        {activeOperation === 'pivot' && (
          <div className="ml-4 p-3 bg-gray-50 rounded-lg space-y-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">X-Axis</label>
              <select
                value={pivotAxis1}
                onChange={(e) => setPivotAxis1(e.target.value as 'product' | 'region' | 'quarter')}
                className="w-full p-2 text-sm border border-gray-300 rounded-lg"
              >
                <option value="product">Product</option>
                <option value="region">Region</option>
                <option value="quarter">Quarter</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Y-Axis</label>
              <select
                value={pivotAxis2}
                onChange={(e) => setPivotAxis2(e.target.value as 'product' | 'region' | 'quarter')}
                className="w-full p-2 text-sm border border-gray-300 rounded-lg"
              >
                <option value="product">Product</option>
                <option value="region">Region</option>
                <option value="quarter">Quarter</option>
              </select>
            </div>

            <button
              onClick={handlePivot}
              disabled={pivotAxis1 === pivotAxis2}
              className="w-full bg-yellow-600 text-white py-2 text-sm rounded-lg hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Apply Pivot
            </button>
          </div>
        )}

        <div className="border-t pt-3 space-y-2">
          <label className="w-full flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all cursor-pointer">
            <Upload className="w-5 h-5 text-indigo-600" />
            <div className="text-left flex-1">
              <div className="font-semibold text-gray-800 text-sm">Upload Dataset</div>
              <div className="text-xs text-gray-600">CSV or JSON file</div>
            </div>
            <input
              type="file"
              accept=".csv,.json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <div className="flex gap-2">
            <button
              onClick={() => onExport('csv')}
              className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border-2 border-gray-200 hover:border-teal-300 hover:bg-teal-50 transition-all"
            >
              <Download className="w-4 h-4 text-teal-600" />
              <span className="text-xs font-medium text-gray-800">Export CSV</span>
            </button>
            <button
              onClick={() => onExport('json')}
              className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border-2 border-gray-200 hover:border-teal-300 hover:bg-teal-50 transition-all"
            >
              <Download className="w-4 h-4 text-teal-600" />
              <span className="text-xs font-medium text-gray-800">Export JSON</span>
            </button>
          </div>
        </div>

        <button
          onClick={onReset}
          className="w-full flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 hover:border-red-300 hover:bg-red-50 transition-all"
        >
          <RotateCw className="w-5 h-5 text-red-600" />
          <div className="text-left flex-1">
            <div className="font-semibold text-gray-800 text-sm">Reset</div>
            <div className="text-xs text-gray-600">Return to original cube</div>
          </div>
        </button>
      </div>

      <div className="border-t pt-3">
        <h3 className="font-semibold text-gray-800 text-sm mb-2">Legend</h3>
        <div className="space-y-1 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-400 rounded"></div>
            <span>Lower Sales</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-400 rounded"></div>
            <span>Medium Sales</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-400 rounded"></div>
            <span>Higher Sales</span>
          </div>
        </div>
      </div>
    </div>
  );
}
