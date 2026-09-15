import { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// 1. Fixed Realistic Industrial Machine 3D Model
// ---------------------------------------------------------------------------
function IndustrialMachine({
  mode = 'default'
}: {
  mode?: 'default' | 'thermal' | 'safety';
}) {
  const isThermal = mode === 'thermal';
  const isSafety = mode === 'safety';

  // Dynamic color palette based on mode
  const machineBaseColor = isThermal ? '#1e293b' : '#334155';
  const accentColor = isThermal ? '#ef4444' : isSafety ? '#f59e0b' : '#10b981';
  const glowColor = isThermal ? '#f97316' : '#34d399';

  return (
    <group position={[-1.1, 0, 0]}>
      {/* ── Heavy Machine Cast Bed ── */}
      <mesh position={[0, 0.18, 0]} receiveShadow castShadow>
        <boxGeometry args={[1.9, 0.36, 1.4]} />
        <meshStandardMaterial color={machineBaseColor} metalness={0.7} roughness={0.35} />
      </mesh>

      {/* Base Foundation Feet */}
      {[-0.8, 0.8].map((x, i) =>
        [-0.55, 0.55].map((z, j) => (
          <mesh key={`${i}-${j}`} position={[x, 0.04, z]} castShadow>
            <cylinderGeometry args={[0.075, 0.1, 0.08, 16]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
          </mesh>
        ))
      )}

      {/* ── Main Vertical Gantry Column ── */}
      <mesh position={[-0.5, 1.15, -0.32]} castShadow>
        <boxGeometry args={[0.48, 1.6, 0.55]} />
        <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Top Gantry Bridge (X-Axis) */}
      <mesh position={[0.1, 1.8, -0.32]} castShadow>
        <boxGeometry args={[1.5, 0.34, 0.42]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.25} />
      </mesh>

      {/* Polished Chrome Linear Guide Rails */}
      <mesh position={[0.1, 1.87, -0.09]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.02, 0.02, 1.45, 24]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.95} roughness={0.1} />
      </mesh>
      <mesh position={[0.1, 1.73, -0.09]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.02, 0.02, 1.45, 24]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.95} roughness={0.1} />
      </mesh>

      {/* ── Fixed Tool Carriage ── */}
      <group position={[0.12, 1.8, -0.07]}>
        <mesh castShadow>
          <boxGeometry args={[0.36, 0.42, 0.34]} />
          <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
        </mesh>

        {/* Spindle Motor Housing */}
        <mesh position={[0, -0.3, 0.11]} castShadow>
          <cylinderGeometry args={[0.11, 0.12, 0.34, 24]} />
          <meshStandardMaterial color="#0284c7" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Fixed Spindle Chuck */}
        <group position={[0, -0.52, 0.11]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.06, 0.08, 0.14, 20]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.1} />
          </mesh>
          {/* Tool bit / End mill */}
          <mesh position={[0, -0.1, 0]}>
            <cylinderGeometry args={[0.016, 0.02, 0.12, 16]} />
            <meshStandardMaterial color="#38bdf8" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>

        {/* Laser Targeting Beam */}
        <mesh position={[0, -0.78, 0.11]}>
          <cylinderGeometry args={[0.007, 0.032, 0.55, 12]} />
          <meshBasicMaterial color={glowColor} transparent opacity={0.55} />
        </mesh>
      </group>

      {/* ── Machine Worktable Bed & Workpiece ── */}
      <mesh position={[0.12, 0.42, 0.08]} receiveShadow>
        <boxGeometry args={[1.05, 0.12, 0.8]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Precision Workpiece Metal Block */}
      <mesh position={[0.12, 0.54, 0.08]} castShadow receiveShadow>
        <boxGeometry args={[0.4, 0.14, 0.3]} />
        <meshStandardMaterial
          color={isThermal ? '#ea580c' : '#94a3b8'}
          metalness={0.85}
          roughness={0.25}
          emissive={isThermal ? '#ea580c' : '#000000'}
          emissiveIntensity={isThermal ? 0.35 : 0}
        />
      </mesh>

      {/* ── Rear Cooling Unit & Fan Grille ── */}
      <mesh position={[-0.7, 0.7, 0.22]} castShadow>
        <boxGeometry args={[0.38, 0.65, 0.5]} />
        <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.4} />
      </mesh>
      <group position={[-0.7, 0.7, 0.48]}>
        {[0, 60, 120, 180, 240, 300].map((deg, i) => (
          <mesh key={i} rotation={[0, 0, (deg * Math.PI) / 180]}>
            <boxGeometry args={[0.03, 0.18, 0.01]} />
            <meshStandardMaterial color="#64748b" metalness={0.8} />
          </mesh>
        ))}
      </group>

      {/* ── Smart Sensor Node (Vibration & Temp) ── */}
      <group position={[0.6, 0.44, 0.3]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.038, 0.038, 0.075, 16]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} />
        </mesh>
        {/* Sensor Cap LED */}
        <mesh position={[0, 0.042, 0]}>
          <sphereGeometry args={[0.026, 16, 16]} />
          <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.8} />
        </mesh>
        {/* Telemetry Ring */}
        <mesh position={[0, 0.048, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.055, 0.08, 24]} />
          <meshBasicMaterial color={glowColor} transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* ── Control Interface Screen on Swivel Arm ── */}
      <group position={[-0.12, 1.28, 0.62]} rotation={[0, 0.25, 0]}>
        <mesh position={[0, -0.26, -0.16]} rotation={[0.4, 0, 0]}>
          <cylinderGeometry args={[0.016, 0.016, 0.38, 12]} />
          <meshStandardMaterial color="#475569" metalness={0.8} />
        </mesh>
        <mesh castShadow>
          <boxGeometry args={[0.42, 0.3, 0.03]} />
          <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.018]}>
          <planeGeometry args={[0.38, 0.25]} />
          <meshBasicMaterial color="#0284c7" />
        </mesh>
      </group>

      {/* ── Machine Status LED Beacon Tower ── */}
      <group position={[-0.68, 1.95, -0.48]}>
        <mesh>
          <cylinderGeometry args={[0.015, 0.015, 0.26, 12]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} />
        </mesh>
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.05, 16]} />
          <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.9} />
        </mesh>
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// 2. Fixed Realistic Industrial Worker 3D Figure (with full PPE gear)
// ---------------------------------------------------------------------------
function IndustrialWorker({
  mode = 'default'
}: {
  mode?: 'default' | 'thermal' | 'safety';
}) {
  const isSafety = mode === 'safety';

  // PPE & Worker Uniform Colors
  const uniformPants = '#1e293b';      // Dark navy work trousers
  const uniformShirt = '#334155';      // Navy work shirt
  const helmetColor = '#facc15';       // High-vis yellow safety hardhat
  const vestOrange = '#f97316';        // OSHA high-vis orange vest
  const vestReflective = '#bef264';    // Lime reflective micro-stripes
  const bootColor = '#0f172a';         // Steel-toe black/slate boots

  return (
    <group position={[1.05, 0, 0.15]} rotation={[0, -0.35, 0]}>
      {/* ── Feet & Steel-Toe Boots ── */}
      <mesh position={[-0.12, 0.07, 0.02]} castShadow>
        <boxGeometry args={[0.12, 0.13, 0.24]} />
        <meshStandardMaterial color={bootColor} roughness={0.6} />
      </mesh>
      <mesh position={[0.12, 0.07, -0.02]} castShadow>
        <boxGeometry args={[0.12, 0.13, 0.24]} />
        <meshStandardMaterial color={bootColor} roughness={0.6} />
      </mesh>

      {/* ── Legs (Trousers) ── */}
      <mesh position={[-0.12, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.068, 0.058, 0.76, 16]} />
        <meshStandardMaterial color={uniformPants} roughness={0.7} />
      </mesh>
      <mesh position={[0.12, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.068, 0.058, 0.76, 16]} />
        <meshStandardMaterial color={uniformPants} roughness={0.7} />
      </mesh>

      {/* Reflective Stripes on Lower Legs */}
      <mesh position={[-0.12, 0.26, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.038, 16]} />
        <meshStandardMaterial color={vestReflective} emissive={vestReflective} emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0.12, 0.26, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.038, 16]} />
        <meshStandardMaterial color={vestReflective} emissive={vestReflective} emissiveIntensity={0.3} />
      </mesh>

      {/* ── Pelvis / Belt ── */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[0.33, 0.11, 0.2]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} />
      </mesh>
      <mesh position={[0.17, 0.88, 0.04]}>
        <boxGeometry args={[0.055, 0.11, 0.075]} />
        <meshStandardMaterial color="#78350f" roughness={0.7} />
      </mesh>

      {/* ── Torso / High-Vis Safety Vest ── */}
      <mesh position={[0, 1.22, 0]} castShadow>
        <boxGeometry args={[0.38, 0.52, 0.24]} />
        <meshStandardMaterial color={vestOrange} roughness={0.5} />
      </mesh>

      {/* High-Vis Vest Reflective Safety Bands */}
      <mesh position={[0, 1.35, 0.122]}>
        <planeGeometry args={[0.36, 0.038]} />
        <meshStandardMaterial color={vestReflective} emissive={vestReflective} emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0, 1.1, 0.122]}>
        <planeGeometry args={[0.36, 0.038]} />
        <meshStandardMaterial color={vestReflective} emissive={vestReflective} emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[-0.09, 1.22, 0.122]}>
        <planeGeometry args={[0.038, 0.45]} />
        <meshStandardMaterial color={vestReflective} emissive={vestReflective} emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0.09, 1.22, 0.122]}>
        <planeGeometry args={[0.038, 0.45]} />
        <meshStandardMaterial color={vestReflective} emissive={vestReflective} emissiveIntensity={0.4} />
      </mesh>

      {/* ── Left Arm (Holding Tablet Side) ── */}
      <group position={[-0.23, 1.42, 0]}>
        <mesh position={[-0.04, -0.17, 0.05]} rotation={[0.4, 0.2, -0.2]} castShadow>
          <cylinderGeometry args={[0.048, 0.045, 0.32, 16]} />
          <meshStandardMaterial color={uniformShirt} roughness={0.6} />
        </mesh>
        <mesh position={[-0.02, -0.3, 0.2]} rotation={[-0.8, -0.3, 0]} castShadow>
          <cylinderGeometry args={[0.043, 0.04, 0.3, 16]} />
          <meshStandardMaterial color={uniformShirt} roughness={0.6} />
        </mesh>
      </group>

      {/* ── Right Arm (Interacting / Tablet Support) ── */}
      <group position={[0.23, 1.42, 0]}>
        <mesh position={[0.04, -0.17, 0.05]} rotation={[0.4, -0.2, 0.2]} castShadow>
          <cylinderGeometry args={[0.048, 0.045, 0.32, 16]} />
          <meshStandardMaterial color={uniformShirt} roughness={0.6} />
        </mesh>
        <mesh position={[0.02, -0.3, 0.2]} rotation={[-0.8, 0.3, 0]} castShadow>
          <cylinderGeometry args={[0.043, 0.04, 0.3, 16]} />
          <meshStandardMaterial color={uniformShirt} roughness={0.6} />
        </mesh>
      </group>

      {/* ── Smart Industrial Tablet / Diagnostic Terminal ── */}
      <group position={[0, 1.12, 0.33]} rotation={[-0.55, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.26, 0.19, 0.022]} />
          <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.013]}>
          <planeGeometry args={[0.23, 0.16]} />
          <meshBasicMaterial color="#10b981" transparent opacity={0.85} />
        </mesh>
      </group>

      {/* ── Head & Safety Helmet (PPE) ── */}
      <group position={[0, 1.58, 0]} rotation={[0.06, -0.28, 0]}>
        {/* Neck */}
        <mesh position={[0, -0.05, 0]}>
          <cylinderGeometry args={[0.045, 0.048, 0.09, 16]} />
          <meshStandardMaterial color="#fcd34d" roughness={0.5} />
        </mesh>
        {/* Head */}
        <mesh position={[0, 0.055, 0]}>
          <sphereGeometry args={[0.1, 20, 20]} />
          <meshStandardMaterial color="#fcd34d" roughness={0.5} />
        </mesh>

        {/* Safety Visor / Glasses */}
        <mesh position={[0, 0.055, 0.085]} rotation={[0.1, 0, 0]}>
          <boxGeometry args={[0.14, 0.045, 0.026]} />
          <meshStandardMaterial color="#06b6d4" transparent opacity={0.85} roughness={0.1} />
        </mesh>

        {/* ── Hardhat Safety Helmet (Yellow) ── */}
        <group position={[0, 0.1, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.125, 24, 16, 0, Math.PI * 2, 0, Math.PI / 1.7]} />
            <meshStandardMaterial color={helmetColor} roughness={0.3} metalness={0.2} />
          </mesh>
          <mesh position={[0, -0.01, 0.03]} rotation={[-0.05, 0, 0]}>
            <cylinderGeometry args={[0.145, 0.145, 0.02, 24]} />
            <meshStandardMaterial color={helmetColor} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.065, 0]}>
            <boxGeometry args={[0.035, 0.035, 0.19]} />
            <meshStandardMaterial color={helmetColor} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.028, 0.125]}>
            <cylinderGeometry args={[0.018, 0.018, 0.02, 12]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.9} />
          </mesh>
        </group>
      </group>

      {/* Safety Compliance Holographic Aura Ring */}
      {isSafety && (
        <mesh position={[0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.45, 0.5, 32]} />
          <meshBasicMaterial color="#34d399" transparent opacity={0.65} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

// ---------------------------------------------------------------------------
// 3. Static Cyber Floor Grid & Telemetry Connection Stream
// ---------------------------------------------------------------------------
function TelemetryCyberFloor() {
  return (
    <group position={[0, 0, 0]}>
      {/* Industrial Circular Floor Base */}
      <mesh position={[0, -0.02, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.5, 48]} />
        <meshStandardMaterial color="#0b1329" roughness={0.6} metalness={0.4} />
      </mesh>

      {/* Outer Cyan Ring */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.42, 2.47, 48]} />
        <meshBasicMaterial color="#34d399" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>

      {/* Inner Concentric Rings */}
      <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.55, 1.58, 48]} />
        <meshBasicMaterial color="#0284c7" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>

      {/* Telemetry Data Line between Machine & Worker */}
      <mesh position={[-0.05, 0.008, 0.1]} rotation={[-Math.PI / 2, 0, -0.15]}>
        <planeGeometry args={[2.0, 0.045]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// 4. Main Exported 3D Showcase Component (Fixed Dimensions & Dashboard Style)
// ---------------------------------------------------------------------------
export function Home3DShowcase() {
  const [mode, setMode] = useState<'default' | 'thermal' | 'safety'>('default');
  const controlsRef = useRef<OrbitControlsImpl>(null);

  const handleResetView = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  return (
    <div className="home-3d-showcase-container">
      {/* ── Top Header with Mode Selector & Reset View ── */}
      <div className="db-twin-header-bar">
        <div className="home-3d-live-badge">
          <span className="home-3d-pulse-dot" />
          <span className="home-3d-badge-text">3D Digital Twin</span>
        </div>

        {/* View Mode Filters */}
        <div className="home-3d-mode-toggles">
          <button
            type="button"
            className={`home-3d-btn ${mode === 'default' ? 'active' : ''}`}
            onClick={() => setMode('default')}
            title="All Sensors & Diagnostics"
          >
            Telemetry
          </button>
          <button
            type="button"
            className={`home-3d-btn ${mode === 'safety' ? 'active orange' : ''}`}
            onClick={() => setMode('safety')}
            title="PPE & Safe Distance AI"
          >
            Worker Safety
          </button>
          <button
            type="button"
            className={`home-3d-btn ${mode === 'thermal' ? 'active red' : ''}`}
            onClick={() => setMode('thermal')}
            title="Machine Thermal Stress"
          >
            Thermal AI
          </button>
        </div>

        {/* Reset View Button */}
        <button
          type="button"
          className="db-twin-btn-rotate"
          onClick={handleResetView}
          title="Reset Camera Angle"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          <span>Reset</span>
        </button>
      </div>

      {/* ── 3D Viewport Directly on Background ── */}
      <div className="home-3d-viewport-wrap">
        <div className="db-twin-canvas-container">
          <Canvas
            shadows
            gl={{ alpha: true, antialias: true }}
            style={{ background: 'transparent' }}
          >
            <PerspectiveCamera makeDefault position={[0.1, 1.85, 4.3]} fov={38} />
            <OrbitControls
              ref={controlsRef}
              enablePan={false}
              enableZoom={true}
              enableRotate={true}
              minDistance={2.4}
              maxDistance={6.5}
              maxPolarAngle={Math.PI / 2.08}
              minPolarAngle={Math.PI / 7}
              autoRotate={false}
            />

            {/* Studio & Cyber Lighting */}
            <ambientLight color="#f0fdf4" intensity={1.15} />
            <directionalLight
              color="#ffffff"
              position={[6, 12, 6]}
              intensity={1.8}
              castShadow
              shadow-mapSize={[1024, 1024]}
            />
            <directionalLight color="#38bdf8" position={[-6, 8, -4]} intensity={1.0} />
            <pointLight color="#34d399" position={[-1.1, 2.4, 1]} intensity={0.9} />
            <pointLight color="#f97316" position={[1.1, 2.4, 1]} intensity={0.9} />

            {/* Fixed Stationary Models */}
            <IndustrialMachine mode={mode} />
            <IndustrialWorker mode={mode} />
            <TelemetryCyberFloor />
          </Canvas>
        </div>
      </div>

      {/* ── Bottom Telemetry Metrics Row (Identical to Dashboard Twin) ── */}
      <div className="db-twin-metrics-row">
        {/* 1. Vibration */}
        <div className="db-twin-pill-card">
          <div className="db-twin-pill-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13" className="pill-icon-cyan">
              <path d="M2 12h3l3-9 4 18 3-9h7" />
            </svg>
            <span>Vibration</span>
          </div>
          <span className="db-twin-pill-val">1.18 mm/s</span>
        </div>

        {/* 2. Temperature */}
        <div className="db-twin-pill-card">
          <div className="db-twin-pill-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13" className="pill-icon-orange">
              <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
            </svg>
            <span>Temperature</span>
          </div>
          <span className="db-twin-pill-val">41.5°C</span>
        </div>

        {/* 3. Worker PPE */}
        <div className="db-twin-pill-card">
          <div className="db-twin-pill-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13" className="pill-icon-emerald">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>Worker PPE</span>
          </div>
          <span className="db-twin-pill-val val-good">Verified ✓</span>
        </div>

        {/* 4. Safe Distance Zone */}
        <div className="db-twin-pill-card">
          <div className="db-twin-pill-header">
            <span className="db-live-dot" />
            <span>Safety Zone</span>
          </div>
          <span className="db-twin-pill-val val-good">Safe (0.8m)</span>
        </div>
      </div>
    </div>
  );
}
