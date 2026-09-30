/**
 * HeartModel — Loads the GLTF heart model and overlays programmatic coronary arteries.
 * Arteries (LAD, LCX, RCA) are rendered as TubeGeometry with dynamic coloring.
 */
import { useRef, useMemo, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { probabilityToHex } from '../utils/colorScale';

// Anatomical artery paths (approximate waypoints relative to the heart model)
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
  LAD: 'Left Anterior Descending',
  LCX: 'Left Circumflex',
  RCA: 'Right Coronary Artery',
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

  const radius = isSelected ? 0.006 : isHovered ? 0.005 : 0.004;
  const emissiveIntensity = isSelected ? 0.8 : isHovered ? 0.5 : 0.3;

  return (
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
      <tubeGeometry args={[curve, 32, radius, 12, false]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={emissiveIntensity}
        roughness={0.3}
        metalness={0.1}
      />
    </mesh>
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

  return (
    <group>
      <primitive object={scene} scale={3} />
      {Object.entries(ARTERY_PATHS).map(([name, points]) => (
        <ArteryTube
          key={name}
          name={name}
          points={points.map(([x, y, z]) => [x * 3, y * 3, z * 3])}
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
