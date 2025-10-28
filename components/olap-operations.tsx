'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Scissors, 
  Dice1, 
  ArrowUp, 
  ArrowDown, 
  RotateCcw,
  Info
} from 'lucide-react';
import { OLAPCube, OLAPOperation } from '@/lib/types';
import { sliceCube, diceCube, drillDown, drillUp, pivotCube } from '@/lib/olap-utils';

interface OLAPOperationsProps {
  cube: OLAPCube | null;
  onOperation: (operation: OLAPOperation, newCube: OLAPCube) => void;
}

export function OLAPOperations({ cube, onOperation }: OLAPOperationsProps) {
  const [selectedOperation, setSelectedOperation] = useState<string>('slice');
  const [selectedDimension, setSelectedDimension] = useState<string>('');
  const [selectedValue, setSelectedValue] = useState<string>('');
  const [selectedDiceValues, setSelectedDiceValues] = useState<string[]>([]);

  if (!cube) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Load data to perform OLAP operations</p>
        </CardContent>
      </Card>
    );
  }

  const handleSlice = () => {
    if (!selectedDimension || !selectedValue) return;
    
    const newCube = sliceCube(cube, selectedDimension, selectedValue);
    onOperation({
      type: 'slice',
      dimension: selectedDimension,
      value: selectedValue
    }, newCube);
  };

  const handleDice = () => {
    if (!selectedDimension || selectedDiceValues.length === 0) return;
    
    const newCube = diceCube(cube, { [selectedDimension]: selectedDiceValues });
    onOperation({
      type: 'dice',
      dimension: selectedDimension,
      value: selectedDiceValues[0]
    }, newCube);
  };

  const handleDrillDown = () => {
    if (!selectedDimension) return;
    
    const newCube = drillDown(cube, selectedDimension, 'detailed');
    onOperation({
      type: 'drill-down',
      dimension: selectedDimension,
      targetLevel: 'detailed'
    }, newCube);
  };

  const handleDrillUp = () => {
    if (!selectedDimension) return;
    
    const newCube = drillUp(cube, selectedDimension, 'summary');
    onOperation({
      type: 'drill-up',
      dimension: selectedDimension,
      sourceLevel: 'detailed'
    }, newCube);
  };

  const handlePivot = () => {
    const newCube = pivotCube(cube, {
      x: cube.dimensions[0]?.name || null,
      y: cube.dimensions[1]?.name || null,
      z: cube.dimensions[2]?.name || null,
      measure: cube.measures[0]?.name || null
    });
    onOperation({
      type: 'pivot',
      newAxisAssignment: {
        x: cube.dimensions[0]?.name || null,
        y: cube.dimensions[1]?.name || null,
        z: cube.dimensions[2]?.name || null,
        measure: cube.measures[0]?.name || null
      }
    }, newCube);
  };

  const operationButtons = [
    {
      id: 'slice',
      label: 'Slice',
      icon: Scissors,
      description: 'Select a single value for a dimension',
      action: handleSlice,
      color: 'bg-blue-100 text-blue-800 hover:bg-blue-200'
    },
    {
      id: 'dice',
      label: 'Dice',
      icon: Dice1,
      description: 'Select multiple values for a dimension',
      action: handleDice,
      color: 'bg-green-100 text-green-800 hover:bg-green-200'
    },
    {
      id: 'drill-down',
      label: 'Drill Down',
      icon: ArrowDown,
      description: 'Navigate to more detailed data',
      action: handleDrillDown,
      color: 'bg-purple-100 text-purple-800 hover:bg-purple-200'
    },
    {
      id: 'drill-up',
      label: 'Drill Up',
      icon: ArrowUp,
      description: 'Navigate to summarized data',
      action: handleDrillUp,
      color: 'bg-orange-100 text-orange-800 hover:bg-orange-200'
    },
    {
      id: 'pivot',
      label: 'Pivot',
      icon: RotateCcw,
      description: 'Reorient data dimensions',
      action: handlePivot,
      color: 'bg-pink-100 text-pink-800 hover:bg-pink-200'
    }
  ];

  const currentOperation = operationButtons.find(op => op.id === selectedOperation);

  return (
    <Card>
      <CardHeader>
        <CardTitle>OLAP Operations</CardTitle>
        <CardDescription>
          Perform standard OLAP operations to analyze your multidimensional data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Operation Selection */}
        <div className="space-y-4">
          <h4 className="font-medium">Select Operation</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {operationButtons.map((operation) => {
              const Icon = operation.icon;
              return (
                <Button
                  key={operation.id}
                  variant={selectedOperation === operation.id ? "default" : "outline"}
                  className={`h-auto p-3 flex flex-col items-center gap-2 ${
                    selectedOperation === operation.id ? operation.color : ''
                  }`}
                  onClick={() => setSelectedOperation(operation.id)}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs">{operation.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Operation Configuration */}
        <div className="space-y-4">
          <h4 className="font-medium">Configure Operation</h4>
          
          {currentOperation && (
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <currentOperation.icon className="h-4 w-4" />
                <span className="font-medium">{currentOperation.label}</span>
                <Badge variant="outline" className="text-xs">
                  {currentOperation.description}
                </Badge>
              </div>
            </div>
          )}

          {/* Dimension Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Dimension</label>
            <Select value={selectedDimension} onValueChange={setSelectedDimension}>
              <SelectTrigger>
                <SelectValue placeholder="Select dimension" />
              </SelectTrigger>
              <SelectContent>
                {cube.dimensions.map((dim) => (
                  <SelectItem key={dim.name} value={dim.name}>
                    {dim.name} ({dim.uniqueValues.length} values)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Value Selection for Slice */}
          {selectedOperation === 'slice' && selectedDimension && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Value</label>
              <Select value={selectedValue} onValueChange={setSelectedValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Select value" />
                </SelectTrigger>
                <SelectContent>
                  {cube.dimensions
                    .find(d => d.name === selectedDimension)
                    ?.uniqueValues.map((value) => (
                      <SelectItem key={String(value)} value={String(value)}>
                        {String(value)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Value Selection for Dice */}
          {selectedOperation === 'dice' && selectedDimension && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Values (select multiple)</label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {cube.dimensions
                  .find(d => d.name === selectedDimension)
                  ?.uniqueValues.map((value) => (
                    <Badge
                      key={String(value)}
                      variant={selectedDiceValues.includes(String(value)) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        const valueStr = String(value);
                        setSelectedDiceValues(prev =>
                          prev.includes(valueStr)
                            ? prev.filter(v => v !== valueStr)
                            : [...prev, valueStr]
                        );
                      }}
                    >
                      {String(value)}
                    </Badge>
                  ))}
              </div>
            </div>
          )}

          {/* Execute Button */}
          <Button
            onClick={currentOperation?.action}
            disabled={
              !selectedDimension ||
              (selectedOperation === 'slice' && !selectedValue) ||
              (selectedOperation === 'dice' && selectedDiceValues.length === 0)
            }
            className="w-full"
          >
            Execute {currentOperation?.label}
          </Button>
        </div>

        <Separator />

        {/* Educational Info */}
        <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Info className="h-3 w-3" />
            <span className="font-medium">OLAP Operations Explained:</span>
          </div>
          <ul className="space-y-1 ml-4">
            <li>• <strong>Slice:</strong> Reduces dimensionality by selecting a single value</li>
            <li>• <strong>Dice:</strong> Creates a sub-cube by selecting multiple values</li>
            <li>• <strong>Drill Down:</strong> Moves from summary to detailed data</li>
            <li>• <strong>Drill Up:</strong> Moves from detailed to summarized data</li>
            <li>• <strong>Pivot:</strong> Rotates data dimensions for new perspectives</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}