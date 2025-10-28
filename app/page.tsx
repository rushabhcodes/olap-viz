'use client';

import React, { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { FileUpload } from '@/components/file-upload';
import { Cube3D } from '@/components/3d-cube';
import { DataTable } from '@/components/data-table';
import { DimensionSelector } from '@/components/dimension-selector';
import { OLAPOperations } from '@/components/olap-operations';
import { DataPoint, OLAPCube, CubeCell, AxisAssignment, OLAPOperation, DataVisualizationState } from '@/lib/types';
import { createOLAPCube } from '@/lib/olap-utils';
import { AlertCircle, Database, Box, Table } from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<DataPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [visualizationState, setVisualizationState] = useState<DataVisualizationState>({
    cube: null,
    axisAssignment: {
      x: null,
      y: null,
      z: null,
      measure: null
    },
    currentOperation: null,
    selectedCell: null,
    aggregationType: 'sum'
  });

  const handleDataLoaded = useCallback((loadedData: DataPoint[]) => {
    setData(loadedData);
    setError(null);
    
    const cube = createOLAPCube(loadedData);
    setVisualizationState(prev => ({
      ...prev,
      cube,
      axisAssignment: {
        x: cube.dimensions[0]?.name || null,
        y: cube.dimensions[1]?.name || null,
        z: cube.dimensions[2]?.name || null,
        measure: cube.measures[0]?.name || null
      }
    }));
  }, []);

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
  }, []);

  const handleAxisAssignmentChange = useCallback((assignment: AxisAssignment) => {
    setVisualizationState(prev => ({
      ...prev,
      axisAssignment: assignment
    }));
  }, []);

  const handleCellSelect = useCallback((cell: CubeCell) => {
    setVisualizationState(prev => ({
      ...prev,
      selectedCell: cell
    }));
  }, []);

  const handleOperation = useCallback((operation: OLAPOperation, newCube: OLAPCube) => {
    setVisualizationState(prev => ({
      ...prev,
      cube: newCube,
      currentOperation: operation,
      axisAssignment: operation.type === 'pivot' && operation.newAxisAssignment
        ? operation.newAxisAssignment
        : prev.axisAssignment
    }));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
            <Database className="h-10 w-10 text-primary" />
            3D OLAP Visualization Tool
          </h1>
          <p className="text-xl text-muted-foreground">
            Interactive multidimensional data analysis for educators
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        {!data.length ? (
          <div className="max-w-2xl mx-auto">
            <FileUpload onDataLoaded={handleDataLoaded} onError={handleError} />
            
            {/* Educational Introduction */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Box className="h-5 w-5" />
                  Welcome to OLAP Visualization
                </CardTitle>
                <CardDescription>
                  Learn Online Analytical Processing (OLAP) concepts through interactive 3D visualization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">🎯 What is OLAP?</h4>
                    <p className="text-sm text-muted-foreground">
                      OLAP enables fast analysis of multidimensional data from multiple perspectives. 
                      Think of it as a &quot;data cube&quot; you can slice, dice, and rotate.
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">🔧 Key Operations</h4>
                    <p className="text-sm text-muted-foreground">
                      Slice, Dice, Drill Down/Up, and Pivot - explore data patterns and insights 
                      through interactive operations.
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">📊 3D Visualization</h4>
                    <p className="text-sm text-muted-foreground">
                      See your data come to life in 3D space. Assign dimensions to X, Y, Z axes 
                      and watch patterns emerge.
                    </p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">🎓 Educational Features</h4>
                    <p className="text-sm text-muted-foreground">
                      Perfect for teaching data analysis concepts with real-time visual feedback 
                      and synchronized table views.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Tabs defaultValue="visualization" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="visualization" className="flex items-center gap-2">
                <Box className="h-4 w-4" />
                Visualization
              </TabsTrigger>
              <TabsTrigger value="table" className="flex items-center gap-2">
                <Table className="h-4 w-4" />
                Data Table
              </TabsTrigger>
            </TabsList>

{/* Visualization Tab */}
            <TabsContent value="visualization" className="space-y-6">
              {/* Top Section: Three Columns */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Sidebar with Dimension Assignment */}
                <div className="lg:col-span-3">
                  <DimensionSelector
                    dimensions={visualizationState.cube?.dimensions || []}
                    measures={visualizationState.cube?.measures || []}
                    axisAssignment={visualizationState.axisAssignment}
                    onAxisAssignmentChange={handleAxisAssignmentChange}
                  />
                </div>

                {/* Main 3D Visualization */}
                <div className="lg:col-span-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>3D Cube Visualization</CardTitle>
                      <CardDescription>
                        Interactive 3D representation of your multidimensional data
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {visualizationState.cube && (
                        <Cube3D
                          cube={visualizationState.cube}
                          axisAssignment={visualizationState.axisAssignment}
                          onCellClick={handleCellSelect}
                          selectedCell={visualizationState.selectedCell}
                        />
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Right Sidebar with Selected Cell and Data Summary */}
                <div className="lg:col-span-3 space-y-6">
                  {visualizationState.selectedCell && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Selected Cell</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <h4 className="font-medium">Coordinates:</h4>
                          {Object.entries(visualizationState.selectedCell.coordinates).map(([key, value]) => (
                            <div key={key} className="flex justify-between text-sm">
                              <span className="font-medium">{key}:</span>
                              <span>{String(value)}</span>
                            </div>
                          ))}
                          {Object.entries(visualizationState.selectedCell.measures).map(([key, value]) => (
                            <div key={key} className="flex justify-between text-sm">
                              <span className="font-medium">{key}:</span>
                              <span>{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Data Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Total Records:</span>
                          <span>{visualizationState.cube?.metadata.totalRecords || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Dimensions:</span>
                          <span>{visualizationState.cube?.dimensions.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Measures:</span>
                          <span>{visualizationState.cube?.measures.length || 0}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Bottom Section: OLAP Operations */}
              <div className="grid grid-cols-1 gap-6">
                <OLAPOperations
                  cube={visualizationState.cube}
                  axisAssignment={visualizationState.axisAssignment}
                  onAxisAssignmentChange={handleAxisAssignmentChange}
                  onOperation={handleOperation}
                />
              </div>
            </TabsContent>

            {/* Data Table Tab */}
            <TabsContent value="table">
              <DataTable
                data={data}
                selectedCell={visualizationState.selectedCell}
                onCellSelect={handleCellSelect}
              />
            </TabsContent>

            
          </Tabs>
        )}
      </div>
    </div>
  );
}