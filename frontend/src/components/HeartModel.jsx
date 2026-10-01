/**
 * HeartModel — Loads the GLTF heart model and overlays programmatic coronary arteries.
 * Arteries are rendered as thick overlay regions using MultiplyBlending to simulate
 * a "painted" dark area mapped to the surface.
 */
import { useRef, useMemo, useState } from 'react';
import { useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import { CORONARY_PATHS, VESSELS, normalizeVesselPredictions } from '../config/vessels';

function ArteryOverlay({ name, points, probability, isSelected, isHovered, onPointerOver, onPointerOut, onClick }) {
  const meshRef = useRef();

  const curve = useMemo(() => {
    if (!points || points.length < 2) return null;
    const vectors = points.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
    return new THREE.CatmullRomCurve3(vectors, false, 'catmullrom', 0.5);
  }, [points]);

  // Dark -> Darker -> Darkest mapped to opacity
  const overlayOpacity = useMemo(() => {
    if (probability === null || probability === undefined) return 0.1; // Default faint line
    // Map probability (0.0 to 1.0) to opacity (0.2 to 0.85)
    return 0.2 + (probability * 0.65);
  }, [probability]);

  if (!curve) return null;

  // Wider radius to simulate an area/painted swath rather than a thin wire
  const baseRadius = 0.008;
  const radius = isSelected ? baseRadius * 1.3 : isHovered ? baseRadius * 1.1 : baseRadius;

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
        
        {/* MultiplyBlending acts like a dark marker pen on the underlying mesh texture */}
        <meshBasicMaterial
          color="#000000"
          transparent={true}
          opacity={overlayOpacity}
          depthWrite={false}
          blending={THREE.MultiplyBlending}
          polygonOffset={true}
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
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
            className={`w-7 h-7 rounded-full border-2 text-xs font-bold transition-all duration-200 flex items-center justify-center select-none shadow-xl
              ${isSelected
                ? 'border-white bg-slate-900/95 text-white scale-110'
                : 'border-white/50 bg-slate-800/80 text-white hover:border-white hover:bg-slate-900'
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
            {probability !== null && (
              <div className="mt-0.5 text-[9px] text-slate-300">
                Stenosis: {(probability * 100).toFixed(0)}%
              </div>
            )}
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

  return (
    <group scale={3}>
      <primitive 
        object={scene}
      />
      {Object.entries(CORONARY_PATHS).map(([name, points]) => (
        <ArteryOverlay
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
