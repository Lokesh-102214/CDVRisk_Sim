/**
 * HeartModel — Loads the GLTF heart model and dynamically alters its material using a custom GLSL shader.
 * Instead of drawing 3D tubes, it injects a smooth distance-field calculation into the fragment shader
 * to create a dynamic dark overlay on the heart mesh along the coronary paths based on stenosis probability.
 * Also renders beautiful HTML callouts acting as technical annotations.
 */
import { useMemo, useEffect, useState } from 'react';
import { useGLTF, Html, Outlines } from '@react-three/drei';
import { createPortal } from '@react-three/fiber';
import * as THREE from 'three';
import { CORONARY_PATHS, POINTER_COORDS, VESSELS, normalizeVesselPredictions } from '../config/vessels';

/**
 * Callout Annotation Marker
 * Positioned exactly on the heart mesh, providing technical detail and probability.
 */
function Callout({ name, probability, isSelected, onClick }) {
  // Use exact pointer coordinate mapped by user instead of dynamic midpoint
  const pos = POINTER_COORDS[name];
  const vesselInfo = VESSELS[name];
  const probPct = probability != null ? (probability * 100).toFixed(0) + '%' : '--%';
  const isStenotic = probability >= 0.5;
  const isEvaluated = probability != null;

  return (
    <group position={pos}>
      <Html center zIndexRange={[100, 0]}>
        <div 
          onClick={(e) => { e.stopPropagation(); onClick?.(name); }}
          className={`
            flex flex-col items-center cursor-pointer transition-transform duration-300 pointer-events-auto
            ${isSelected ? 'scale-110 z-50' : 'scale-100 hover:scale-105 opacity-90 hover:opacity-100'}
          `}
        >
          {/* Callout Info Box */}
          <div className={`
            px-3 py-2 rounded-lg backdrop-blur-md border shadow-2xl mb-0.5 flex flex-col gap-0.5 min-w-[120px] pointer-events-auto
            ${!isEvaluated ? 'bg-slate-900/80 border-slate-600/50' : 
              isStenotic ? 'bg-black/80 border-red-500/60 shadow-red-900/30' : 
              'bg-slate-900/80 border-teal-500/50 shadow-teal-900/20'}
          `}>
            <div className="flex justify-between items-center text-[13px] font-bold text-white">
              <span>{name}</span>
              <span className={!isEvaluated ? 'text-slate-400' : isStenotic ? 'text-red-400' : 'text-teal-400'}>
                {probPct}
              </span>
            </div>
            <div className="text-[10px] text-slate-300 leading-tight">
              {vesselInfo.fullName}
            </div>
          </div>
          
          {/* Technical Pointer Line */}
          <div className={`w-[2px] h-6 ${!isEvaluated ? 'bg-slate-500/50' : isStenotic ? 'bg-red-500/80' : 'bg-teal-500/50'}`} />
          
          {/* Anchor Dot on the mesh */}
          <div className={`w-2.5 h-2.5 rounded-full ${!isEvaluated ? 'bg-slate-400' : isStenotic ? 'bg-red-500 shadow-[0_0_12px_#ef4444]' : 'bg-teal-400 shadow-[0_0_8px_#2dd4bf]'}`} />
        </div>
      </Html>
    </group>
  );
}

export default function HeartModel({ predictions, selectedVessel, onVesselClick }) {
  const { scene } = useGLTF('/heart_model/scene.gltf');
  
  const vesselProbs = useMemo(() => {
    return normalizeVesselPredictions(predictions?.vessels);
  }, [predictions]);

  // Determine the active probability governing the highlighted objects
  const activeProb = useMemo(() => {
    if (selectedVessel && vesselProbs[selectedVessel] != null) {
      return vesselProbs[selectedVessel];
    }
    return predictions?.cad_probability || 0;
  }, [selectedVessel, vesselProbs, predictions]);

  const [isObjClicked, setIsObjClicked] = useState(false);
  const obj20 = useMemo(() => scene.getObjectByName('Object_20'), [scene]);
  const obj21 = useMemo(() => scene.getObjectByName('Object_21'), [scene]);
  
  // Highlight when any pointer is selected or the objects themselves are clicked
  const isHighlighted = selectedVessel !== null || isObjClicked;
  
  // Dynamically update the color of object 20 & 21
  // on a continuous scale based on stenosis predicted probability.
  useEffect(() => {
    const objs = [obj20, obj21].filter(Boolean);
    objs.forEach(obj => {
      if (obj && obj.material) {
        if (isHighlighted) {
          const baseColor = new THREE.Color(1, 1, 1);
          const targetColor = new THREE.Color("#a3e635"); // yellowish-green shade
          
          // Lerp from normal to yellowish-green based directly on probability [0, 1]
          obj.material.color = baseColor.lerp(targetColor, activeProb);
          obj.material.emissiveIntensity = 0;
        } else {
          obj.material.color = new THREE.Color(1, 1, 1); // Reset
        }
      }
    });
  }, [isHighlighted, obj20, obj21, activeProb]);

  // Dynamic boundary outline color
  const outlineColor = useMemo(() => {
    if (activeProb >= 0.7) return "#ef4444"; // Red (High Risk)
    if (activeProb >= 0.4) return "#f59e0b"; // Amber (Moderate Risk)
    return "#2dd4bf"; // Teal (Low Risk / Healthy)
  }, [activeProb]);

  // Persistent uniforms for the custom GLSL shader mapping
  const uniforms = useMemo(() => ({
    uLadPoints: { value: CORONARY_PATHS.LAD.map(p => new THREE.Vector3(...p)) },
    uLcxPoints: { value: CORONARY_PATHS.LCX.map(p => new THREE.Vector3(...p)) },
    uRcaPoints: { value: CORONARY_PATHS.RCA.map(p => new THREE.Vector3(...p)) },
    uProbs: { value: new THREE.Vector3(0, 0, 0) }
  }), []);

  // Update shader probability intensity when predictions change
  useEffect(() => {
    uniforms.uProbs.value.set(
      vesselProbs.LAD || 0,
      vesselProbs.LCX || 0,
      vesselProbs.RCA || 0
    );
  }, [vesselProbs, uniforms]);

  // Apply custom GLSL shader mapping directly to the existing GLTF mesh material
  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        // Prevent re-patching if Hot Module Replacement triggers
        if (child.userData.shaderPatched) return;
        child.userData.shaderPatched = true;

        const mat = child.material.clone();
        mat.onBeforeCompile = (shader) => {
          // Pass coordinate arrays and probabilities as uniforms
          shader.uniforms.uLadPoints = uniforms.uLadPoints;
          shader.uniforms.uLcxPoints = uniforms.uLcxPoints;
          shader.uniforms.uRcaPoints = uniforms.uRcaPoints;
          shader.uniforms.uProbs = uniforms.uProbs;

          // VERTEX SHADER: Pass local position to fragment shader
          shader.vertexShader = `
            varying vec3 vLocalPos;
          ` + shader.vertexShader;
          
          shader.vertexShader = shader.vertexShader.replace(
            `#include <begin_vertex>`,
            `
            #include <begin_vertex>
            vLocalPos = position;
            `
          );

          // FRAGMENT SHADER: Math for rendering dark color overlay over segments
          shader.fragmentShader = `
            uniform vec3 uLadPoints[5];
            uniform vec3 uLcxPoints[3];
            uniform vec3 uRcaPoints[5];
            uniform vec3 uProbs;
            varying vec3 vLocalPos;

            // Compute closest distance from a pixel to a 3D line segment
            float distToSegment(vec3 p, vec3 a, vec3 b) {
                vec3 pa = p - a, ba = b - a;
                float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
                return length(pa - ba * h);
            }
          ` + shader.fragmentShader;

          // Inject custom color mapping immediately after PBR base texture is mapped
          shader.fragmentShader = shader.fragmentShader.replace(
            `#include <map_fragment>`,
            `
            #include <map_fragment>
            
            // LAD Segment Distance Calculation (4 segments from 5 points)
            float dLad = 999.0;
            dLad = min(dLad, distToSegment(vLocalPos, uLadPoints[0], uLadPoints[1]));
            dLad = min(dLad, distToSegment(vLocalPos, uLadPoints[1], uLadPoints[2]));
            dLad = min(dLad, distToSegment(vLocalPos, uLadPoints[2], uLadPoints[3]));
            dLad = min(dLad, distToSegment(vLocalPos, uLadPoints[3], uLadPoints[4]));

            // LCX Segment Distance Calculation (2 segments from 3 points)
            float dLcx = 999.0;
            dLcx = min(dLcx, distToSegment(vLocalPos, uLcxPoints[0], uLcxPoints[1]));
            dLcx = min(dLcx, distToSegment(vLocalPos, uLcxPoints[1], uLcxPoints[2]));

            // RCA Segment Distance Calculation (4 segments from 5 points)
            float dRca = 999.0;
            dRca = min(dRca, distToSegment(vLocalPos, uRcaPoints[0], uRcaPoints[1]));
            dRca = min(dRca, distToSegment(vLocalPos, uRcaPoints[1], uRcaPoints[2]));
            dRca = min(dRca, distToSegment(vLocalPos, uRcaPoints[2], uRcaPoints[3]));
            dRca = min(dRca, distToSegment(vLocalPos, uRcaPoints[3], uRcaPoints[4]));

            float radius = 0.035;   // Spread radius of the dark overlay
            float feather = 0.025;  // Soft, interpolated fade edge

            // Map intensity directly proportional to stenosis probability
            float ladMix = smoothstep(radius, radius - feather, dLad) * uProbs.x;
            float lcxMix = smoothstep(radius, radius - feather, dLcx) * uProbs.y;
            float rcaMix = smoothstep(radius, radius - feather, dRca) * uProbs.z;

            // Aggregate mapped areas
            float totalMix = clamp(ladMix + lcxMix + rcaMix, 0.0, 1.0);
            
            // Define custom "dark fade" color indicating severe stenosis/necrosis (Darkest Red/Black)
            vec3 stenosisColor = vec3(0.04, 0.0, 0.0);
            
            // Interpolate the base texture diffuse map with the dark mapping 
            diffuseColor.rgb = mix(diffuseColor.rgb, stenosisColor, totalMix * 0.95);
            `
          );
        };
        child.material = mat;
      }
    });
  }, [scene, uniforms]);

  return (
    <group scale={3}>
      <primitive 
        object={scene} 
        onClick={(e) => {
          e.stopPropagation();
          if (e.object.name === 'Object_20' || e.object.name === 'Object_21') {
            setIsObjClicked(true);
          } else {
            setIsObjClicked(false);
          }
        }}
        onPointerMissed={() => {
          setIsObjClicked(false);
          onVesselClick?.(null);
        }}
      />
      
      {/* High-visibility boundary stroke via Outlines attached directly to Object_20 and Object_21 */}
      {isHighlighted && [obj20, obj21].filter(Boolean).map((obj, i) => (
        createPortal(
          <Outlines key={i} thickness={0.015} color={outlineColor} transparent opacity={0.8} />,
          obj
        )
      ))}

      {/* Dynamic Pointer Callouts */}
      {Object.entries(CORONARY_PATHS).map(([name, points]) => (
        <Callout
          key={name}
          name={name}
          probability={vesselProbs[name]}
          isSelected={selectedVessel === name}
          onClick={onVesselClick}
        />
      ))}
    </group>
  );
}

useGLTF.preload('/heart_model/scene.gltf');
