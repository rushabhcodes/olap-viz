'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Box, Text } from '@react-three/drei';
import * as THREE from 'three';
import { OLAPCube, CubeCell, AxisAssignment } from '@/lib/types';
import { generateColorScale } from '@/lib/olap-utils';

interface Cube3DProps {
  cube: OLAPCube;
  axisAssignment: AxisAssignment;
  onCellClick: (cell: CubeCell) => void;
  selectedCell: CubeCell | null;
}

interface CubeCell3DProps {
  cell: CubeCell;
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  isSelected: boolean;
  onClick: () => void;
  value: number;
}

function CubeCell3D({ position, size, color, isSelected, onClick }: CubeCell3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = React.useState(false);

  useFrame(() => {
    if (meshRef.current && (hovered || isSelected)) {
      meshRef.current.scale.setScalar(1.1);
    } else if (meshRef.current) {
      meshRef.current.scale.setScalar(1);
    }
  });

  return (
    <Box
      ref={meshRef}
      position={position}
      args={size}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <meshStandardMaterial
        color={isSelected ? '#ff6b6b' : (hovered ? '#4ecdc4' : color)}
        opacity={0.8}
        transparent
      />
    </Box>
  );
}

function CubeVisualization({ cube, axisAssignment, onCellClick, selectedCell }: Cube3DProps) {
  const { cells3D } = useMemo(() => {
    if (!cube.data.length) return { cells3D: [], maxValue: 0 };

    const xDim = axisAssignment.x;
    const yDim = axisAssignment.y;
    const zDim = axisAssignment.z;
    const measureName = axisAssignment.measure;

    if (!xDim || !yDim || !zDim || !measureName) {
      return { cells3D: [], maxValue: 0 };
    }

    const xValues = [...new Set(cube.data.map(cell => cell.coordinates[xDim]))];
    const yValues = [...new Set(cube.data.map(cell => cell.coordinates[yDim]))];
    const zValues = [...new Set(cube.data.map(cell => cell.coordinates[zDim]))];

    const values = cube.data.map(cell => cell.measures[measureName] || 0);
    const colors = generateColorScale(values);

    const cells3D = cube.data.map((cell, index) => {
      const xIndex = xValues.indexOf(cell.coordinates[xDim] as string);
      const yIndex = yValues.indexOf(cell.coordinates[yDim] as string);
      const zIndex = zValues.indexOf(cell.coordinates[zDim] as string);

      const position: [number, number, number] = [
        xIndex - xValues.length / 2,
        yIndex - yValues.length / 2,
        zIndex - zValues.length / 2
      ];

      const size: [number, number, number] = [
        0.8,
        0.8,
        0.8
      ];

      return {
        cell,
        position,
        size,
        color: colors[index],
        value: cell.measures[measureName] || 0
      };
    });

    return { cells3D };
  }, [cube, axisAssignment]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
      
      {cells3D.map(({ cell, position, size, color, value }, index) => (
        <CubeCell3D
          key={index}
          cell={cell}
          position={position}
          size={size}
          color={color}
          isSelected={selectedCell === cell}
          onClick={() => onCellClick(cell)}
          value={value}
        />
      ))}
      
      {axisAssignment.x && (
        <Text
          position={[0, -3, 0]}
          rotation={[0, 0, 0]}
          fontSize={0.5}
          color="black"
        >
          {axisAssignment.x}
        </Text>
      )}
      
      {axisAssignment.y && (
        <Text
          position={[0, 0, -3]}
          rotation={[0, 0, 0]}
          fontSize={0.5}
          color="black"
        >
          {axisAssignment.y}
        </Text>
      )}
      
      {axisAssignment.z && (
        <Text
          position={[-3, 0, 0]}
          rotation={[0, Math.PI / 2, 0]}
          fontSize={0.5}
          color="black"
        >
          {axisAssignment.z}
        </Text>
      )}
    </>
  );
}

export function Cube3D({ cube, axisAssignment, onCellClick, selectedCell }: Cube3DProps) {
  if (!axisAssignment.x || !axisAssignment.y || !axisAssignment.z || !axisAssignment.measure) {
    return (
      <div className="w-full h-96 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
        <p className="text-gray-500">Please assign dimensions to all axes and select a measure</p>
      </div>
    );
  }

  return (
    <div className="w-full h-96 border border-gray-200 rounded-lg">
      <Canvas camera={{ position: [5, 5, 5], fov: 60 }}>
        <CubeVisualization
          cube={cube}
          axisAssignment={axisAssignment}
          onCellClick={onCellClick}
          selectedCell={selectedCell}
        />
      </Canvas>
    </div>
  );
}