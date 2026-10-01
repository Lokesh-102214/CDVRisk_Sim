import { useRef, useMemo, useState } from 'react';
import { useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import { probabilityToHex } from '../utils/colorScale';

// Anatomical artery paths (local coordinates)
// Developer: Use the Coordinate Picker (click on the heart) to update these paths!
const ARTERY_PATHS = {
  LAD: [
    [0.01, 0.04, 0.05],
    [0.005, 0.02, 0.07],
    [0.0, -0.01, 0.08],
    [-0.005, -0.04, 0.07],
    [-0.01, -0.07, 0.06],
    [-0.015, -0.10, 0.04],
  ],
  LCX: [
    [0.01, 0.04, 0.05],
    [0.03, 0.02, 0.04],
    [0.05, 0.0, 0.02],
    [0.06, -0.02, -0.01],
    [0.05, -0.04, -0.03],
  ],
  RCA: [
    [-0.03, 0.04, 0.03],
    [-0.05, 0.02, 0.04],
    [-0.07, 0.0, 0.03],
    [-0.08, -0.03, 0.01],
    [-0.07, -0.06, -0.01],
    [-0.05, -0.09, -0.02],
  ],
};

const VESSEL_INFO = {
  LAD: { index: 1, label: 'LAD' },
  LCX: { index: 2, label: 'LCX' },
  RCA: { index: 3, label: 'RCA' },
};

function ArteryTube({ name, points, probability, isSelected, isHovered, onPointerOver, onPointerOut, onClick }) {
  const meshRef = useRef();

  const curve = useMemo(() => {
    const vectors = points.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
    return new THREE.CatmullRomCurve3(vectors);
  }, [points]);

  const color = useMemo(() => {
    if (probability === null || probability === undefined) return 0xaaaaaa;
    return probabilityToHex(probability);
  }, [probability]);

  // Adjust radius to be slightly larger in local scale since the parent is scaled by 3
  const baseRadius = 0.0015;
  const radius = isSelected ? baseRadius * 1.5 : isHovered ? baseRadius * 1.25 : baseRadius;
  const emissiveIntensity = isSelected ? 0.4 : isHovered ? 0.25 : 0.15;

  // Determine marker position (middle of the path)
  const markerPos = points[Math.floor(points.length / 2)];
  const markerInfo = VESSEL_INFO[name];

  return (
    <group>
      <mesh
        ref={meshRef}
        name={name}
        onPointerOver={(e) => {
          e.stopPropagation();
          onPointerOver?.(name);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onPointerOut?.();
          document.body.style.cursor = 'auto';
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(name);
        }}
      >
        <tubeGeometry args={[curve, 64, radius, 8, false]} />
        <meshStandardMaterial
          color={color}
          transparent={true}
          opacity={0.8}
          emissive={color}
          emissiveIntensity={emissiveIntensity}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>

      {/* Sketchfab-style annotation marker */}
      <Html position={markerPos} center zIndexRange={[100, 0]}>
        <div className="relative group">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick?.(name);
            }}
            onPointerOver={() => onPointerOver?.(name)}
            onPointerOut={() => onPointerOut?.()}
            className={`w-6 h-6 rounded-full border-2 text-xs font-bold transition-all duration-300 flex items-center justify-center
              ${isSelected 
                ? 'border-teal-400 bg-teal-900/90 text-teal-300 shadow-[0_0_10px_rgba(45,212,191,0.5)]' 
                : 'border-white bg-black/70 text-white hover:border-teal-400 hover:text-teal-400 hover:bg-black/90'
              }`}
          >
            {markerInfo.index}
          </button>
          
          {/* Label tooltip */}
          <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-black/80 text-white text-[10px] rounded whitespace-nowrap pointer-events-none transition-opacity duration-200
            ${isSelected || isHovered ? 'opacity-100' : 'opacity-0'}
          `}>
            {markerInfo.label}
          </div>
        </div>
      </Html>
    </group>
  );
}

export default function HeartModel({ predictions, selectedVessel, onVesselClick }) {
  const { scene } = useGLTF('/heart_model/scene.gltf');
  const [hoveredVessel, setHoveredVessel] = useState(null);

  // Extract probabilities
  const vesselProbs = useMemo(() => {
    if (!predictions?.vessels) return { LAD: null, LCX: null, RCA: null };
    const map = {};
    predictions.vessels.forEach((v) => {
      map[v.vessel] = v.probability;
    });
    return map;
  }, [predictions]);

  // Coordinate Picker (Development Tool)
  const handleModelClick = (e) => {
    e.stopPropagation();
    
    // Get intersection point and face normal
    const intersection = e.intersections?.[0];
    if (!intersection) return;

    const point = intersection.point.clone();
    const normal = intersection.face?.normal?.clone() || new THREE.Vector3(0, 0, 1);
    
    // Convert normal to world space
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(intersection.object.matrixWorld);
    const worldNormal = normal.applyMatrix3(normalMatrix).normalize();
    
    // Add offset in world space to avoid z-fighting (0.015 units)
    const offsetWorldPoint = point.add(worldNormal.multiplyScalar(0.015));
    
    // Convert back to local space of the scene (since our group is scaled by 3)
    const localPoint = scene.worldToLocal(offsetWorldPoint);
    
    console.log(
      `Coordinate Picked:\n[${localPoint.x.toFixed(4)}, ${localPoint.y.toFixed(4)}, ${localPoint.z.toFixed(4)}],`
    );
  };

  return (
    <group scale={3}>
      <primitive 
        object={scene} 
        onClick={handleModelClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'crosshair';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'auto';
        }}
      />
      {Object.entries(ARTERY_PATHS).map(([name, points]) => (
        <ArteryTube
          key={name}
          name={name}
          points={points}
          probability={vesselProbs[name]}
          isSelected={selectedVessel === name}
          isHovered={hoveredVessel === name}
          onPointerOver={setHoveredVessel}
          onPointerOut={() => setHoveredVessel(null)}
          onClick={onVesselClick}
        />
      ))}
    </group>
  );
}

// Preload the model
useGLTF.preload('/heart_model/scene.gltf');
