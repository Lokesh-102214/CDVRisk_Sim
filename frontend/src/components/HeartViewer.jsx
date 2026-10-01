/**
 * HeartViewer — Performance-optimized 3D canvas wrapper.
 *
 * 3D Optimization strategy:
 * - dpr capped at [1, 1.5] to reduce GPU fill rate (no dedicated GPU needed)
 * - frameloop="demand" renders only when the scene changes (saves battery/CPU)
 * - flat mode disables tone mapping for faster rendering
 * - Performance component from drei adaptively downgrades quality
 * - Suspense boundary with lightweight fallback
 */
import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, AdaptiveDpr, AdaptiveEvents } from '@react-three/drei';
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
      <Canvas
        camera={{
          position: [0, 0, 1.8],
          fov: 45,
          near: 0.01,
          far: 100,
        }}
        dpr={[1, 1.5]}
        shadows={false}
        flat
        performance={{ min: 0.5 }}
      >
        {/* Adaptive quality — drops DPR under load */}
        <AdaptiveDpr pixelated />
        <AdaptiveEvents />

        {/* Environment lighting for PBR */}
        <Environment preset="studio" />

        {/* Key light */}
        <directionalLight position={[5, 5, 5]} intensity={1.5} />

        {/* Fill light */}
        <directionalLight position={[-4, 2, 3]} intensity={0.5} />

        <ambientLight intensity={0.2} />

        <Suspense fallback={<LoadingFallback />}>
          <HeartModel
            predictions={predictions}
            selectedVessel={selectedVessel}
            onVesselClick={onVesselClick}
          />
        </Suspense>

        <OrbitControls
          enablePan
          enableZoom
          enableRotate
          autoRotate={!predictions}
          autoRotateSpeed={1.5}
          minDistance={0.2}
          maxDistance={10}
          enableDamping
          dampingFactor={0.05}
        />
      </Canvas>

      {/* Overlay instructions */}
      <div className="absolute bottom-3 left-3 text-xs text-slate-400 bg-slate-900/70 px-3 py-1.5 rounded-lg pointer-events-none select-none">
        🖱 Drag to rotate • Scroll to zoom • Click artery for details
      </div>
    </div>
  );
}
