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
import { OLAPCube, OLAPOperation, AxisAssignment } from '@/lib/types';
import { sliceCube, diceCube, drillDown, drillUp, pivotCube } from '@/lib/olap-utils';

interface OLAPOperationsProps {
  cube: OLAPCube | null;
  axisAssignment: AxisAssignment;
  onAxisAssignmentChange: (assignment: AxisAssignment) => void;
  onOperation: (operation: OLAPOperation, newCube: OLAPCube) => void;
}

export function OLAPOperations({ cube, axisAssignment, onAxisAssignmentChange, onOperation }: OLAPOperationsProps) {
  const [selectedOperation, setSelectedOperation] = useState<string>('slice');
  const [selectedDimension, setSelectedDimension] = useState<string>('');
  const [selectedValue, setSelectedValue] = useState<string>('');
  const [selectedDiceValues, setSelectedDiceValues] = useState<string[]>([]);
  const [showHelp, setShowHelp] = useState<boolean>(false);

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
    // determine current assignment (prefer provided axisAssignment, fallback to cube dims)
    const current = axisAssignment && (axisAssignment.x || axisAssignment.y || axisAssignment.z || axisAssignment.measure)
      ? axisAssignment
      : {
        x: cube?.dimensions[0]?.name || null,
        y: cube?.dimensions[1]?.name || null,
        z: cube?.dimensions[2]?.name || null,
        measure: cube?.measures[0]?.name || null
      };

    // rotate axes: x -> y, y -> z, z -> x
    const rotated: AxisAssignment = {
      x: current.y,
      y: current.z,
      z: current.x,
      measure: current.measure
    };

    const newCube = pivotCube(cube!, rotated);

    // notify parent about axis change and operation
    onAxisAssignmentChange(rotated);
    onOperation({
      type: 'pivot',
      newAxisAssignment: rotated
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
      <CardContent className="space-y-4 py-4">
        {/* Operation Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-start gap-2">
            {operationButtons.map((operation) => {
              const Icon = operation.icon;
              return (
                <Button
                  key={operation.id}
                  variant={selectedOperation === operation.id ? "default" : "ghost"}
                  className={`h-8 w-8 p-1 flex items-center justify-center ${selectedOperation === operation.id ? operation.color : ''}`}
                  onClick={() => setSelectedOperation(operation.id)}
                  title={operation.label}
                >
                  <Icon className="h-4 w-4" />
                  <span className="sr-only">{operation.label}</span>
                </Button>
              );
            })}

            {/* compact label for selected operation */}
            <div className="ml-2 text-sm font-medium">
              {operationButtons.find(op => op.id === selectedOperation)?.label}
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" className="h-7 w-7 p-0.5" onClick={() => setShowHelp(s => !s)} title="Toggle help">
                <Info className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {showHelp && (
          <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded-lg mb-2">
            <div className="flex items-center gap-2 mb-1">
              <Info className="h-3 w-3" />
              <span className="font-medium">OLAP Operations</span>
            </div>
            <div className="ml-4">
              <div>• Slice: select single value</div>
              <div>• Dice: select multiple values</div>
              <div>• Drill Down / Up: navigate levels</div>
              <div>• Pivot: reorient dimensions</div>
            </div>
          </div>
        )}

        {/* Compact Operation Configuration */}
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <Select value={selectedDimension} onValueChange={setSelectedDimension}>
              <SelectTrigger>
                <SelectValue placeholder="Dimension" />
              </SelectTrigger>
              <SelectContent>
                {cube.dimensions.map((dim) => (
                  <SelectItem key={dim.name} value={dim.name}>
                    {dim.name} ({dim.uniqueValues.length})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedOperation === 'slice' && selectedDimension && (
            <div className="w-40">
              <Select value={selectedValue} onValueChange={setSelectedValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Value" />
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

          {selectedOperation === 'dice' && selectedDimension && (
            <div className="flex-1 max-w-xs flex flex-wrap gap-2">
              {cube.dimensions
                .find(d => d.name === selectedDimension)
                ?.uniqueValues.map((value) => (
                  <Badge
                    key={String(value)}
                    variant={selectedDiceValues.includes(String(value)) ? "default" : "outline"}
                    className="cursor-pointer text-xs"
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
          )}

          <Button
            onClick={currentOperation?.action}
            disabled={
              !selectedDimension ||
              (selectedOperation === 'slice' && !selectedValue) ||
              (selectedOperation === 'dice' && selectedDiceValues.length === 0)
            }
            className="h-8 px-3"
          >
            Execute
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