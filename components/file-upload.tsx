'use client';

import React, { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, Database } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { DataPoint } from '@/lib/types';

interface FileUploadProps {
  onDataLoaded: (data: DataPoint[]) => void;
  onError: (error: string) => void;
}

export function FileUpload({ onDataLoaded, onError }: FileUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const loadSampleData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/sample-sales-data.csv');
      const csvText = await response.text();
      
      Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            onError(`CSV parsing error: ${results.errors[0].message}`);
          } else {
            onDataLoaded(results.data as DataPoint[]);
            setUploadedFileName('sample-sales-data.csv');
          }
          setIsLoading(false);
        },
        error: (error: any) => {
          onError(`Failed to parse sample data: ${error.message}`);
          setIsLoading(false);
        }
      });
    } catch (error) {
      onError(`Failed to load sample data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  }, [onDataLoaded, onError]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setUploadedFileName(file.name);

    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'csv') {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            onError(`CSV parsing error: ${results.errors[0].message}`);
          } else {
            onDataLoaded(results.data as DataPoint[]);
          }
          setIsLoading(false);
        },
        error: (error) => {
          onError(`Failed to parse CSV: ${error.message}`);
          setIsLoading(false);
        }
      });
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          onDataLoaded(jsonData as DataPoint[]);
          setIsLoading(false);
        } catch (error) {
          onError(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
          setIsLoading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      onError('Unsupported file format. Please upload CSV or Excel files.');
      setIsLoading(false);
    }
  }, [onDataLoaded, onError]);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Data Source
        </CardTitle>
        <CardDescription>
          Upload your CSV/Excel file or use sample data to get started with OLAP visualization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={loadSampleData}
            disabled={isLoading}
            className="flex-1"
            variant="outline"
          >
            <FileText className="h-4 w-4 mr-2" />
            {isLoading ? 'Loading...' : 'Load Sample Data'}
          </Button>
          
          <div className="flex-1">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              disabled={isLoading}
              className="hidden"
              id="file-upload"
            />
            <Button
              asChild
              disabled={isLoading}
              className="w-full"
            >
              <label htmlFor="file-upload" className="cursor-pointer flex items-center justify-center">
                <Upload className="h-4 w-4 mr-2" />
                {isLoading ? 'Processing...' : 'Upload File'}
              </label>
            </Button>
          </div>
        </div>
        
        {uploadedFileName && (
          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
            <strong>Loaded:</strong> {uploadedFileName}
          </div>
        )}
        
        <div className="text-xs text-muted-foreground">
          <p>Supported formats: CSV, XLSX, XLS</p>
          <p>Sample data includes: Regions, Products, Categories, Sales, and Time dimensions</p>
        </div>
      </CardContent>
    </Card>
  );
}