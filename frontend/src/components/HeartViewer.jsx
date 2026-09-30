/**
 * HeartViewer — Canvas wrapper with OrbitControls, lighting, and Suspense.
 */
import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import HeartModel from './HeartModel';

function LoadingFallback() {
  return (
    <mesh>
      <sphereGeometry args={[0.05, 16, 16]} />
      <meshStandardMaterial color="#14b8a6" wireframe />
    </mesh>
  );
}

export default function HeartViewer({ predictions, selectedVessel, onVesselClick }) {
  return (
    <div className="canvas-container w-full h-full min-h-[400px] rounded-xl overflow-hidden relative">
      <Canvas camera={{ position: [0, 0, 0.6], fov: 45 }} dpr={[1, 2]}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <directionalLight position={[-3, -3, 3]} intensity={0.3} />
        <Suspense fallback={<LoadingFallback />}>
          <HeartModel
            predictions={predictions}
            selectedVessel={selectedVessel}
            onVesselClick={onVesselClick}
          />
        </Suspense>
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          autoRotate={!predictions}
          autoRotateSpeed={1.5}
          minDistance={0.2}
          maxDistance={3}
        />
      </Canvas>
      {/* Overlay instructions */}
      <div className="absolute bottom-3 left-3 text-xs text-slate-400 bg-slate-900/70 px-3 py-1.5 rounded-lg pointer-events-none">
        🖱 Drag to rotate • Scroll to zoom • Click artery for details
      </div>
    </div>
  );
}
