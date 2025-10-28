'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RotateCcw } from 'lucide-react';
import { Dimension, Measure, AxisAssignment } from '@/lib/types';

interface DimensionSelectorProps {
  dimensions: Dimension[];
  measures: Measure[];
  axisAssignment: AxisAssignment;
  onAxisAssignmentChange: (assignment: AxisAssignment) => void;
}

export function DimensionSelector({
  dimensions,
  measures,
  axisAssignment,
  onAxisAssignmentChange
}: DimensionSelectorProps) {
  const handleAxisChange = (axis: 'x' | 'y' | 'z', value: string) => {
    onAxisAssignmentChange({
      ...axisAssignment,
      [axis]: value === 'none' ? null : value
    });
  };

  const handleMeasureChange = (value: string) => {
    onAxisAssignmentChange({
      ...axisAssignment,
      measure: value === 'none' ? null : value
    });
  };

  const resetAssignment = () => {
    onAxisAssignmentChange({
      x: null,
      y: null,
      z: null,
      measure: null
    });
  };

  const getDimensionTypeColor = (type: string) => {
    switch (type) {
      case 'categorical':
        return 'bg-blue-100 text-blue-800';
      case 'numerical':
        return 'bg-green-100 text-green-800';
      case 'temporal':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const availableDimensions = dimensions.filter(dim => 
    !Object.values(axisAssignment).includes(dim.name)
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          Dimension Assignment
          <Button
            variant="outline"
            size="sm"
            onClick={resetAssignment}
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        </CardTitle>
        <CardDescription className="text-xs">
          Assign dimensions to axes and select measure
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Axis Assignment */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">3D Cube Axes</h4>
          
          <div className="space-y-2">
            {(['x', 'y', 'z'] as const).map((axis) => (
              <div key={axis} className="space-y-1">
                <label className="text-xs font-medium capitalize">
                  {axis.toUpperCase()}-Axis
                </label>
                <Select
                  value={axisAssignment[axis] || 'none'}
                  onValueChange={(value) => handleAxisChange(axis, value)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder={`Select ${axis.toUpperCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {dimensions.map((dim) => (
                      <SelectItem key={dim.name} value={dim.name}>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{dim.name}</span>
                          <Badge className={`text-xs ${getDimensionTypeColor(dim.type)}`}>
                            {dim.type[0].toUpperCase()}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>

        {/* Measure Selection */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Measure</h4>
          <Select
            value={axisAssignment.measure || 'none'}
            onValueChange={handleMeasureChange}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Select measure" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {measures.map((measure) => (
                <SelectItem key={measure.name} value={measure.name}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{measure.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {measure.type[0].toUpperCase()}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Current Assignment Summary */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Current Assignment</h4>
          <div className="bg-muted p-3 rounded-lg">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="font-medium">X:</span>
                <div className="text-muted-foreground truncate">
                  {axisAssignment.x || 'None'}
                </div>
              </div>
              <div>
                <span className="font-medium">Y:</span>
                <div className="text-muted-foreground truncate">
                  {axisAssignment.y || 'None'}
                </div>
              </div>
              <div>
                <span className="font-medium">Z:</span>
                <div className="text-muted-foreground truncate">
                  {axisAssignment.z || 'None'}
                </div>
              </div>
              <div>
                <span className="font-medium">Measure:</span>
                <div className="text-muted-foreground truncate">
                  {axisAssignment.measure || 'None'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Available Dimensions */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Available</h4>
          <div className="flex flex-wrap gap-1">
            {availableDimensions.length > 0 ? (
              availableDimensions.map((dim) => (
                <Badge
                  key={dim.name}
                  className={`${getDimensionTypeColor(dim.type)} text-xs cursor-pointer hover:opacity-80`}
                >
                  {dim.name} ({dim.uniqueValues.length})
                </Badge>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">
                All assigned
              </p>
            )}
          </div>
        </div>

        {/* Educational Info */}
        <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded-lg">
          <p className="font-medium mb-1">💡 Tip:</p>
          <p className="leading-tight">
            Assign categorical dimensions to axes for meaningful 3D visualization.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}