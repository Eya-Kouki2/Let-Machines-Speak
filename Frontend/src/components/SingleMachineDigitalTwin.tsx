import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

export interface MachineTwinData {
  id: string;
  name: string;
  zone?: string;
  type?: string;
  status: 'ONLINE' | 'WARNING' | 'CRITICAL' | 'OFFLINE' | 'normal' | 'warning' | 'critical' | 'offline';
  vibrationRms?: number;
  temperature?: number;
  peak?: number;
  healthScore?: number | null;
}

export interface SingleMachineDigitalTwinProps {
  machines?: MachineTwinData[];
  selectedId?: string;
  onSelect?: (id: string) => void;
}

// Default realistic machines fleet
const DEFAULT_MACHINES: MachineTwinData[] = [
  {
    id: 'CNC-001',
    name: '5-Axis CNC Machining Center',
    zone: 'Zone A - Milling Bay',
    type: 'CNC Milling',
    status: 'ONLINE',
    vibrationRms: 1.18,
    temperature: 41.5,
    peak: 2.12,
    healthScore: 97,
  },
  {
    id: 'LATHE-002',
    name: 'Heavy Precision CNC Lathe #02',
    zone: 'Zone B - Turning Section',
    type: 'Precision Lathe',
    status: 'WARNING',
    vibrationRms: 4.82,
    temperature: 68.4,
    peak: 3.45,
    healthScore: 78,
  },
  {
    id: 'ROBOT-004',
    name: '6-Axis Spot Welding Robotic Arm',
    zone: 'Zone D - Automated Line',
    type: 'Robotic Manipulator',
    status: 'CRITICAL',
    vibrationRms: 7.65,
    temperature: 86.2,
    peak: 5.18,
    healthScore: 42,
  },
  {
    id: 'BLOWER-005',
    name: 'Exhaust Ventilation Blower #2',
    zone: 'Zone E - Utility & HVAC',
    type: 'Centrifugal Fan',
    status: 'ONLINE',
    vibrationRms: 0.94,
    temperature: 36.8,
    peak: 1.40,
    healthScore: 99,
  },
];

// ---------------------------------------------------------------------------
// Realistic Industrial CNC / Machining Center 3D Model
// ---------------------------------------------------------------------------
function IndustrialMachineModel({ status = 'ONLINE' }: { status?: string }) {
  const spindleRef = useRef<THREE.Group>(null);
  const carriageRef = useRef<THREE.Group>(null);
  const fanRef = useRef<THREE.Group>(null);
  const laserRef = useRef<THREE.Mesh>(null);

  const normStatus = (status || 'ONLINE').toUpperCase();
  const isCritical = normStatus === 'CRITICAL';
  const isWarning = normStatus === 'WARNING';
  const isNormal = !isCritical && !isWarning;

  // Animation Loop
  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const speedMult = isCritical ? 1.8 : 1.0;

    // 1. Spindle / Chuck high-speed rotation
    if (spindleRef.current) {
      spindleRef.current.rotation.z += delta * (isCritical ? 12 : isWarning ? 8 : 6.5);
    }

    // 2. Carriage toolhead gentle precision machining slide (X-axis)
    if (carriageRef.current) {
      carriageRef.current.position.x = 0.35 + Math.sin(t * 1.2 * speedMult) * 0.45;
    }

    // 3. Rear cooling fan spin
    if (fanRef.current) {
      fanRef.current.rotation.x += delta * (isCritical ? 18 : 12);
    }

    // 4. Laser alignment pulse
    if (laserRef.current) {
      const mat = laserRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = 0.5 + Math.sin(t * 4) * 0.3;
      }
    }
  });

  // Industrial Gray Materials Palette
  const chassisGray = '#64748b';    // Main machine housing gray
  const darkCastIron = '#334155';   // Heavy cast base & bed gray
  const lightSilver = '#cbd5e1';    // Brushed aluminum / steel gray
  const brightChrome = '#f1f5f9';   // Polished chrome & shafts
  const bedSteel = '#475569';       // Ground machine table steel
  const darkVent = '#1e293b';       // Deep shadow gray
  const warningYellow = '#f59e0b';
  const brass = '#d97706';
  const accentEmerald = '#10b981';

  return (
    <group position={[0, -0.62, 0]}>
      {/* ── 1. Heavy Base Frame & Foundation (Cast Iron Gray) ── */}
      <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.24, 2.0]} />
        <meshStandardMaterial color={darkCastIron} roughness={0.35} metalness={0.8} />
      </mesh>

      <mesh position={[0, 0.04, 0]} receiveShadow>
        <boxGeometry args={[3.4, 0.08, 2.2]} />
        <meshStandardMaterial color={darkVent} roughness={0.5} metalness={0.7} />
      </mesh>

      {/* 4 Heavy-Duty Floor Anchor Mounts (Steel Gray) */}
      {[
        [-1.5, 0.12, -0.9],
        [1.5, 0.12, -0.9],
        [-1.5, 0.12, 0.9],
        [1.5, 0.12, 0.9],
      ].map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.1, 0.14, 0.2, 16]} />
            <meshStandardMaterial color={bedSteel} roughness={0.3} metalness={0.85} />
          </mesh>
          <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.08, 12]} />
            <meshStandardMaterial color={brightChrome} roughness={0.15} metalness={0.95} />
          </mesh>
        </group>
      ))}

      {/* Hazard Warning Strip along base front */}
      <mesh position={[0, 0.2, 1.01]}>
        <boxGeometry args={[3.0, 0.06, 0.01]} />
        <meshStandardMaterial color={warningYellow} roughness={0.4} metalness={0.3} />
      </mesh>

      {/* ── 2. Machine Bed & Dual Linear Guideway Rails (Industrial Gray) ── */}
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.9, 0.14, 1.6]} />
        <meshStandardMaterial color={darkCastIron} roughness={0.35} metalness={0.85} />
      </mesh>

      {/* Linear Chrome Rails (Guideways) */}
      {[-0.45, 0.45].map((zPos, idx) => (
        <group key={idx} position={[0, 0.4, zPos]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 2.8, 16]} />
            <meshStandardMaterial color={brightChrome} roughness={0.12} metalness={0.98} />
          </mesh>
          {[-1.2, -0.6, 0, 0.6, 1.2].map((xP, bIdx) => (
            <mesh key={bIdx} position={[xP, -0.03, 0]}>
              <boxGeometry args={[0.1, 0.05, 0.12]} />
              <meshStandardMaterial color={bedSteel} roughness={0.35} metalness={0.8} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Central T-Slot Machining Bed (Ground Precision Gray Steel) */}
      <group position={[0, 0.4, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[2.7, 0.06, 0.7]} />
          <meshStandardMaterial color={bedSteel} roughness={0.3} metalness={0.85} />
        </mesh>
        {[-0.2, 0, 0.2].map((zG, gIdx) => (
          <mesh key={gIdx} position={[0, 0.032, zG]}>
            <boxGeometry args={[2.6, 0.01, 0.04]} />
            <meshStandardMaterial color={darkVent} roughness={0.5} metalness={0.5} />
          </mesh>
        ))}
      </group>

      {/* ── 3. Headstock / Main Motor Drive Assembly (Industrial Gray) ── */}
      <group position={[-1.05, 0.72, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.9, 0.65, 1.3]} />
          <meshStandardMaterial color={chassisGray} roughness={0.35} metalness={0.8} />
        </mesh>

        {/* Status indicator stripe on chassis */}
        <mesh position={[0, 0.18, 0.66]}>
          <boxGeometry args={[0.82, 0.06, 0.02]} />
          <meshStandardMaterial
            color={isCritical ? '#ef4444' : isWarning ? '#f59e0b' : accentEmerald}
            emissive={isCritical ? '#ef4444' : isWarning ? '#f59e0b' : accentEmerald}
            emissiveIntensity={0.55}
            roughness={0.2}
          />
        </mesh>

        {/* Top Motor Cover (Light Steel Gray) */}
        <mesh position={[0, 0.38, 0]} castShadow>
          <boxGeometry args={[0.75, 0.14, 1.1]} />
          <meshStandardMaterial color={lightSilver} roughness={0.3} metalness={0.85} />
        </mesh>

        {/* Rear Motor Cylinder with Cooling Fins */}
        <group position={[-0.55, 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.3, 0.3, 0.35, 24]} />
            <meshStandardMaterial color={darkCastIron} roughness={0.4} metalness={0.75} />
          </mesh>
          {[-0.12, -0.06, 0, 0.06, 0.12].map((fPos, fIdx) => (
            <mesh key={fIdx} position={[0, fPos, 0]}>
              <cylinderGeometry args={[0.34, 0.34, 0.02, 24]} />
              <meshStandardMaterial color={lightSilver} roughness={0.25} metalness={0.85} />
            </mesh>
          ))}
          <group ref={fanRef} position={[0, 0.2, 0]}>
            <mesh>
              <cylinderGeometry args={[0.26, 0.26, 0.04, 16]} />
              <meshStandardMaterial color={darkVent} roughness={0.5} />
            </mesh>
            {[0, Math.PI / 3, (2 * Math.PI) / 3].map((rAngle, rIdx) => (
              <mesh key={rIdx} rotation={[0, rAngle, 0]}>
                <boxGeometry args={[0.48, 0.02, 0.06]} />
                <meshStandardMaterial color={brightChrome} roughness={0.2} metalness={0.92} />
              </mesh>
            ))}
          </group>
        </group>

        {/* ── Rotating Chuck & Workpiece Spindle (Polished Silver / Chrome) ── */}
        <group position={[0.48, 0.05, 0]} rotation={[0, Math.PI / 2, 0]}>
          <mesh>
            <cylinderGeometry args={[0.32, 0.36, 0.06, 32]} />
            <meshStandardMaterial color={bedSteel} roughness={0.25} metalness={0.9} />
          </mesh>

          <group ref={spindleRef} position={[0, 0.08, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.28, 0.28, 0.14, 32]} />
              <meshStandardMaterial color={brightChrome} roughness={0.15} metalness={0.96} />
            </mesh>
            {[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((jAngle, jIdx) => (
              <group key={jIdx} rotation={[0, 0, jAngle]}>
                <mesh position={[0.16, 0, 0.04]} castShadow>
                  <boxGeometry args={[0.14, 0.08, 0.1]} />
                  <meshStandardMaterial color={darkCastIron} roughness={0.3} metalness={0.85} />
                </mesh>
                <mesh position={[0.19, 0, 0.1]}>
                  <boxGeometry args={[0.06, 0.06, 0.04]} />
                  <meshStandardMaterial color={brass} roughness={0.3} metalness={0.8} />
                </mesh>
              </group>
            ))}

            <mesh position={[0, 0.38, 0]} castShadow>
              <cylinderGeometry args={[0.08, 0.08, 0.65, 24]} />
              <meshStandardMaterial color={lightSilver} roughness={0.15} metalness={0.95} />
            </mesh>
            <mesh position={[0, 0.58, 0]}>
              <cylinderGeometry args={[0.055, 0.055, 0.25, 24]} />
              <meshStandardMaterial color={brightChrome} roughness={0.1} metalness={0.99} />
            </mesh>
          </group>
        </group>
      </group>

      {/* ── 4. Dynamic Moving Toolhead & Cross-Slide Carriage (Industrial Gray) ── */}
      <group ref={carriageRef} position={[0.35, 0.72, 0]}>
        <mesh position={[0, -0.15, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.55, 0.18, 1.1]} />
          <meshStandardMaterial color={chassisGray} roughness={0.35} metalness={0.8} />
        </mesh>

        <mesh position={[0, 0.08, -0.12]} castShadow>
          <boxGeometry args={[0.42, 0.32, 0.45]} />
          <meshStandardMaterial color={lightSilver} roughness={0.28} metalness={0.85} />
        </mesh>

        <group position={[0, 0.1, 0.18]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.22, 0.22, 0.12, 8]} />
            <meshStandardMaterial color={darkCastIron} roughness={0.3} metalness={0.9} />
          </mesh>

          <group position={[-0.18, 0.06, 0]} rotation={[0, 0, -Math.PI / 4]}>
            <mesh castShadow>
              <boxGeometry args={[0.18, 0.06, 0.08]} />
              <meshStandardMaterial color={brightChrome} roughness={0.18} metalness={0.95} />
            </mesh>
            <mesh position={[-0.1, 0, 0]}>
              <coneGeometry args={[0.035, 0.06, 4]} />
              <meshStandardMaterial color="#fbbf24" roughness={0.2} metalness={0.9} />
            </mesh>
          </group>

          <group position={[-0.14, 0.16, 0]} rotation={[0, 0, -Math.PI / 6]}>
            <mesh>
              <cylinderGeometry args={[0.015, 0.015, 0.2, 12]} />
              <meshStandardMaterial color={brass} roughness={0.3} metalness={0.8} />
            </mesh>
            <mesh position={[0, 0.1, 0]}>
              <sphereGeometry args={[0.025, 12, 12]} />
              <meshStandardMaterial color={brass} roughness={0.3} metalness={0.8} />
            </mesh>
          </group>
        </group>

        <mesh
          ref={laserRef}
          position={[-0.28, 0.14, 0.08]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.004, 0.004, 0.35, 8]} />
          <meshBasicMaterial
            color={isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#34d399'}
            transparent
            opacity={0.6}
          />
        </mesh>
      </group>

      {/* ── 5. Tailstock Assembly (Industrial Gray) ── */}
      <group position={[1.15, 0.72, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.65, 0.55, 0.9]} />
          <meshStandardMaterial color={chassisGray} roughness={0.35} metalness={0.8} />
        </mesh>

        <group position={[-0.38, 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.09, 0.09, 0.25, 24]} />
            <meshStandardMaterial color={brightChrome} roughness={0.15} metalness={0.96} />
          </mesh>
          <mesh position={[0, 0.18, 0]} rotation={[0, 0, Math.PI]}>
            <coneGeometry args={[0.07, 0.14, 24]} />
            <meshStandardMaterial color={brightChrome} roughness={0.1} metalness={0.98} />
          </mesh>
        </group>

        <group position={[0.38, 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
          <mesh>
            <torusGeometry args={[0.16, 0.022, 12, 24]} />
            <meshStandardMaterial color={brightChrome} roughness={0.2} metalness={0.95} />
          </mesh>
          <mesh position={[0.12, 0, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.018, 0.018, 0.08, 12]} />
            <meshStandardMaterial color={darkCastIron} roughness={0.4} metalness={0.6} />
          </mesh>
        </group>
      </group>

      {/* ── 6. Operator Control Console (Industrial Gray Frame) ── */}
      <group position={[1.1, 1.25, 0.65]}>
        <mesh position={[0, -0.22, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.45, 16]} />
          <meshStandardMaterial color={bedSteel} roughness={0.3} metalness={0.85} />
        </mesh>

        <mesh position={[0, 0.02, 0]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial color={brightChrome} roughness={0.18} metalness={0.92} />
        </mesh>

        <group position={[0, 0.22, 0.08]} rotation={[-Math.PI / 10, -Math.PI / 8, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.55, 0.38, 0.08]} />
            <meshStandardMaterial color={darkCastIron} roughness={0.35} metalness={0.8} />
          </mesh>
          <mesh position={[0, 0.04, 0.045]}>
            <planeGeometry args={[0.46, 0.22]} />
            <meshBasicMaterial color="#0284c7" />
          </mesh>
          <mesh position={[0, 0.04, 0.048]}>
            <planeGeometry args={[0.42, 0.18]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
          <group position={[0, -0.12, 0.045]}>
            {[-0.18, -0.1, -0.02, 0.06].map((bx, bIdx) => (
              <mesh key={bIdx} position={[bx, 0, 0]}>
                <boxGeometry args={[0.05, 0.04, 0.015]} />
                <meshStandardMaterial color={lightSilver} roughness={0.4} />
              </mesh>
            ))}
            <mesh position={[0.16, 0, 0.01]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.028, 0.028, 0.025, 16]} />
              <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.3} />
            </mesh>
          </group>
        </group>
      </group>

      {/* ── 7. Top Status Beacon Stack Tower ── */}
      <group position={[-1.25, 1.45, -0.45]}>
        <mesh position={[0, -0.2, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.4, 16]} />
          <meshStandardMaterial color={bedSteel} roughness={0.3} metalness={0.85} />
        </mesh>
        {/* Green Light */}
        <mesh position={[0, 0.04, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 0.07, 16]} />
          <meshStandardMaterial
            color={isNormal ? '#10b981' : '#064e3b'}
            emissive={isNormal ? '#10b981' : '#000000'}
            emissiveIntensity={isNormal ? 0.9 : 0}
            roughness={0.1}
          />
        </mesh>
        {/* Yellow Light */}
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 0.07, 16]} />
          <meshStandardMaterial
            color={isWarning ? '#f59e0b' : '#78350f'}
            emissive={isWarning ? '#f59e0b' : '#000000'}
            emissiveIntensity={isWarning ? 0.9 : 0}
            roughness={0.1}
          />
        </mesh>
        {/* Red Light */}
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 0.07, 16]} />
          <meshStandardMaterial
            color={isCritical ? '#ef4444' : '#7f1d1d'}
            emissive={isCritical ? '#ef4444' : '#000000'}
            emissiveIntensity={isCritical ? 0.9 : 0}
            roughness={0.1}
          />
        </mesh>
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Main 3D Machine Viewer Component
// ---------------------------------------------------------------------------
export const SingleMachineDigitalTwin: React.FC<SingleMachineDigitalTwinProps> = ({
  machines = DEFAULT_MACHINES,
  selectedId,
  onSelect,
}) => {
  const machineList = machines.length > 0 ? machines : DEFAULT_MACHINES;
  const [localSelectedId, setLocalSelectedId] = useState<string>(
    selectedId || machineList[0]?.id || 'CNC-001'
  );
  const [autoRotate, setAutoRotate] = useState(true);

  // Sync selectedId when prop changes from parent
  React.useEffect(() => {
    if (selectedId) {
      setLocalSelectedId(selectedId);
    }
  }, [selectedId]);

  // Active selected machine resolution
  const currentId = selectedId || localSelectedId;
  const activeMachine =
    machineList.find(
      (m) =>
        m.id === currentId ||
        m.id.toLowerCase() === currentId.toLowerCase() ||
        (m as any).machineId === currentId ||
        (m as any)._id === currentId
    ) ||
    machineList[0] ||
    DEFAULT_MACHINES[0];

  const handleMachineChange = (newId: string) => {
    setLocalSelectedId(newId);
    onSelect?.(newId);
  };

  const statusStr = (activeMachine.status || 'ONLINE').toUpperCase();
  const isCritical = statusStr === 'CRITICAL';
  const isWarning = statusStr === 'WARNING';
  const statusColorClass = isCritical ? 'val-crit' : isWarning ? 'val-warn' : 'val-good';

  // Format metric figures dynamically per machine
  const vibVal =
    typeof activeMachine.vibrationRms === 'number'
      ? activeMachine.vibrationRms
      : isCritical
      ? 7.65
      : isWarning
      ? 4.82
      : 1.18;

  const tempVal =
    typeof activeMachine.temperature === 'number'
      ? activeMachine.temperature
      : isCritical
      ? 86.2
      : isWarning
      ? 68.4
      : 41.5;

  const peakVal =
    typeof activeMachine.peak === 'number'
      ? activeMachine.peak
      : isCritical
      ? 5.18
      : isWarning
      ? 3.45
      : 2.12;

  return (
    <div className="db-twin-seamless">
      {/* ── Top Header with Machine Selector Dropdown ── */}
      <div className="db-twin-header-bar">
        {/* Machine Selector Dropdown */}
        <div className="db-twin-select-wrapper">
          <label htmlFor="db-twin-machine-dropdown" className="db-twin-select-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Machine:
          </label>
          <select
            id="db-twin-machine-dropdown"
            value={activeMachine.id}
            onChange={(e) => handleMachineChange(e.target.value)}
            className="db-twin-select-input"
          >
            {machineList.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.status})
              </option>
            ))}
          </select>
        </div>

        {/* Clean auto-rotate toggle */}
        <button
          type="button"
          className={`db-twin-btn-rotate ${autoRotate ? 'active' : ''}`}
          onClick={() => setAutoRotate((prev) => !prev)}
          title={autoRotate ? 'Pause 360° Auto-Rotation' : 'Resume 360° Auto-Rotation'}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
          <span>{autoRotate ? 'Rotate ON' : 'Paused'}</span>
        </button>
      </div>

      {/* ── 3D Viewport Directly on Page Background ── */}
      <div className="db-twin-viewport-wrap">
        <div className="db-twin-canvas-container">
          <Canvas
            shadows
            gl={{ alpha: true, antialias: true }}
            style={{ background: 'transparent' }}
          >
            <PerspectiveCamera makeDefault position={[3.8, 2.6, 4.2]} fov={38} />
            <OrbitControls
              enablePan={false}
              enableZoom={true}
              enableRotate={true}
              minDistance={2.5}
              maxDistance={7.5}
              maxPolarAngle={Math.PI / 2.05}
              minPolarAngle={Math.PI / 8}
              autoRotate={autoRotate}
              autoRotateSpeed={1.4}
            />

            {/* Studio Lighting Setup */}
            <ambientLight color="#f0fdf4" intensity={1.1} />
            <directionalLight
              color="#ffffff"
              position={[8, 14, 8]}
              intensity={1.6}
              castShadow
              shadow-mapSize={[1024, 1024]}
            />
            <directionalLight color="#38bdf8" position={[-8, 10, -6]} intensity={0.9} />
            <pointLight color="#34d399" position={[0, 4, 3]} intensity={0.8} />

            {/* Realistic 3D Machine - reacts to selected machine status */}
            <IndustrialMachineModel status={activeMachine.status} />
          </Canvas>
        </div>
      </div>

      {/* ── Bottom Telemetry Pill Badges (Vibration, Temperature, Peak, Status) ── */}
      <div className="db-twin-metrics-row">
        {/* 1. Vibration */}
        <div className="db-twin-pill-card">
          <div className="db-twin-pill-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" className="pill-icon-cyan">
              <path d="M2 12h3l3-9 4 18 3-9h7" />
            </svg>
            <span>Vibration</span>
          </div>
          <span className="db-twin-pill-val">{vibVal.toFixed(2)} mm/s</span>
        </div>

        {/* 2. Temperature */}
        <div className="db-twin-pill-card">
          <div className="db-twin-pill-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" className="pill-icon-orange">
              <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
            </svg>
            <span>Temperature</span>
          </div>
          <span className="db-twin-pill-val">{tempVal.toFixed(1)}°C</span>
        </div>

        {/* 3. Peak Acceleration */}
        <div className="db-twin-pill-card">
          <div className="db-twin-pill-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" className="pill-icon-emerald">
              <path d="M18 20V10M12 20V4M6 20v-6" />
            </svg>
            <span>Peak</span>
          </div>
          <span className="db-twin-pill-val">{peakVal.toFixed(2)} g</span>
        </div>

        {/* 4. Status */}
        <div className="db-twin-pill-card">
          <div className="db-twin-pill-header">
            <span className={`db-live-dot ${isCritical ? 'db-dot-red' : isWarning ? 'db-dot-orange' : ''}`} />
            <span>Status</span>
          </div>
          <span className={`db-twin-pill-val ${statusColorClass}`}>
            {statusStr}
          </span>
        </div>
      </div>
    </div>
  );
};
