/**
 * HeartModel — Loads the GLTF heart model and overlays programmatic coronary arteries.
 * Arteries (LAD, LCX, RCA) are rendered as TubeGeometry with dynamic coloring.
 */
import { useRef, useMemo, useState } from 'react';
import { useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import { probabilityToHex } from '../utils/colorScale';
import { CORONARY_PATHS, VESSELS, normalizeVesselPredictions } from '../config/vessels';

function ArteryTube({ name, points, probability, isSelected, isHovered, onPointerOver, onPointerOut, onClick }) {
  const meshRef = useRef();

  const curve = useMemo(() => {
    if (!points || points.length < 2) return null;
    const vectors = points.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
    return new THREE.CatmullRomCurve3(vectors);
  }, [points]);

  const color = useMemo(() => {
    if (probability === null || probability === undefined) return 0xaaaaaa;
    return probabilityToHex(probability);
  }, [probability]);

  if (!curve) return null;

  const baseRadius = 0.0015;
  const radius = isSelected ? baseRadius * 1.5 : isHovered ? baseRadius * 1.25 : baseRadius;
  const emissiveIntensity = isSelected ? 0.4 : isHovered ? 0.25 : 0.15;

  const markerPos = points[Math.floor(points.length / 2)];
  const vesselInfo = VESSELS[name];

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
          transparent
          opacity={0.8}
          emissive={color}
          emissiveIntensity={emissiveIntensity}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>

      {/* Annotation marker */}
      <Html position={markerPos} center zIndexRange={[100, 0]}>
        <div className="relative group">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick?.(name);
            }}
            onPointerOver={() => onPointerOver?.(name)}
            onPointerOut={() => onPointerOut?.()}
            className={`w-7 h-7 rounded-full border-2 text-xs font-bold transition-all duration-200 flex items-center justify-center select-none
              ${isSelected
                ? 'border-teal-400 bg-teal-900/90 text-teal-300 shadow-[0_0_12px_rgba(45,212,191,0.5)] scale-110'
                : 'border-white/70 bg-black/70 text-white hover:border-teal-400 hover:text-teal-400 hover:bg-black/90'
              }`}
          >
            {vesselInfo.index}
          </button>
          {/* Tooltip */}
          <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2.5 py-1 bg-slate-900/95 text-white text-[10px] rounded-md whitespace-nowrap pointer-events-none transition-all duration-200 border border-slate-700/50 shadow-lg
            ${isSelected || isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'}
          `}>
            <span className="font-semibold">{name}</span>
            <span className="text-slate-400"> — {vesselInfo.fullName}</span>
          </div>
        </div>
      </Html>
    </group>
  );
}

export default function HeartModel({ predictions, selectedVessel, onVesselClick }) {
  // Uses the local GLTF model from public/heart_model/
  const { scene } = useGLTF('/heart_model/scene.gltf');
  const [hoveredVessel, setHoveredVessel] = useState(null);

  const vesselProbs = useMemo(() => {
    return normalizeVesselPredictions(predictions?.vessels);
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
    
    // Add offset in world space to avoid z-fighting
    const offsetWorldPoint = point.add(worldNormal.multiplyScalar(0.015));
    
    // Convert back to local space of the scene
    const localPoint = scene.worldToLocal(offsetWorldPoint);
    
    console.log(
      `[${localPoint.x.toFixed(4)}, ${localPoint.y.toFixed(4)}, ${localPoint.z.toFixed(4)}],`
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
      {Object.entries(CORONARY_PATHS).map(([name, points]) => (
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
