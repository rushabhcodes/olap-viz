import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { CubeData, CubeCell } from '../types/olap';
import { generateCubeCells, generateCubeCellsWithMapping, getDimensions, getMaxValue, getDimensionsForMapping } from '../utils/cubeUtils';

interface CubeMeshProps {
  cells: CubeCell[];
  maxValue: number;
  animationProgress: number;
  autoRotate?: boolean;
  rotateSpeed?: number;
}

function CubeMesh({ cells, maxValue, animationProgress, autoRotate = false, rotateSpeed = 0.002 }: CubeMeshProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += rotateSpeed;
    }
  });

  return (
    <group ref={groupRef}>
      {cells.map((cell, index) => {
        const normalizedValue = cell.value / maxValue;
        const color = new THREE.Color().setHSL(0.6 - normalizedValue * 0.6, 0.8, 0.5);
        const scale = 0.15 + normalizedValue * 0.35;

        return (
          <mesh
            key={index}
            position={[
              (cell.x - 1) * 2,
              (cell.y - 0.5) * 2,
              (cell.z - 0.5) * 2
            ]}
            scale={[scale * animationProgress, scale * animationProgress, scale * animationProgress]}
          >
            <boxGeometry args={[1.5, 1.5, 1.5]} />
            <meshStandardMaterial color={color} transparent opacity={0.85} />
          </mesh>
        );
      })}
    </group>
  );
}

interface AxisLabelsProps {
  dimensions: {
    products: { name: string; values: string[] };
    regions: { name: string; values: string[] };
    quarters: { name: string; values: string[] };
  };
}

function AxisLabels({ dimensions }: AxisLabelsProps) {
  return (
    <>
      {dimensions.products.values.map((product, i) => (
        <Text
          key={`x-${i}`}
          position={[(i - 1) * 2, -2.5, 0]}
          fontSize={0.3}
          color="#333333"
          anchorX="center"
          anchorY="middle"
        >
          {product}
        </Text>
      ))}

      {dimensions.regions.values.map((region, i) => (
        <Text
          key={`y-${i}`}
          position={[-3.5, (i - 0.5) * 2, 0]}
          fontSize={0.3}
          color="#333333"
          anchorX="center"
          anchorY="middle"
        >
          {region}
        </Text>
      ))}

      {dimensions.quarters.values.map((quarter, i) => (
        <Text
          key={`z-${i}`}
          position={[0, -2.5, (i - 0.5) * 2]}
          fontSize={0.3}
          color="#333333"
          anchorX="center"
          anchorY="middle"
        >
          {quarter}
        </Text>
      ))}

      <Text
        position={[0, -3.5, 0]}
        fontSize={0.4}
        color="#000000"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        Products
      </Text>

      <Text
        position={[-4.5, 0, 0]}
        fontSize={0.4}
        color="#000000"
        anchorX="center"
        anchorY="middle"
        rotation={[0, 0, Math.PI / 2]}
        fontWeight="bold"
      >
        Regions
      </Text>

      <Text
        position={[0, -3.5, 2]}
        fontSize={0.4}
        color="#000000"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        Quarters
      </Text>
    </>
  );
}

interface OLAPCubeProps {
  data: CubeData;
  animationProgress?: number;
  // mapping maps the logical axes to dataset keys (x/y/z) and optionally a measure
  dimensionMapping?: { x: string; y: string; z: string; measure?: string };
  autoRotate?: boolean;
  rotateSpeed?: number;
}

export default function OLAPCube({ data, animationProgress = 1, dimensionMapping, autoRotate = false, rotateSpeed = 0.002 }: OLAPCubeProps) {
  const cells = useMemo(() => {
    if (dimensionMapping) {
      return generateCubeCellsWithMapping(data, dimensionMapping as any);
    }
    return generateCubeCells(data);
  }, [data, dimensionMapping]);
  const maxValue = useMemo(() => getMaxValue(data), [data]);
  const dimensions = useMemo(() => {
    if (dimensionMapping) {
      const mapped = getDimensionsForMapping(data, dimensionMapping as any);
      return {
        products: { name: mapped.x.name, values: mapped.x.values },
        regions: { name: mapped.y.name, values: mapped.y.values },
        quarters: { name: mapped.z.name, values: mapped.z.values }
      };
    }
    return getDimensions(data);
  }, [data, dimensionMapping]);

  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [8, 6, 8], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />
        <pointLight position={[-10, -10, -10]} intensity={0.4} />

  <CubeMesh cells={cells} maxValue={maxValue} animationProgress={animationProgress} autoRotate={autoRotate} rotateSpeed={rotateSpeed} />
        <AxisLabels dimensions={dimensions} />

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={20}
        />

        <gridHelper args={[20, 20, '#cccccc', '#eeeeee']} position={[0, -3, 0]} />
      </Canvas>
    </div>
  );
}
