import React, { useMemo, useRef, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, PerspectiveCamera, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// ---- Data shape coming from your backend / websocket ----
export interface Machine {
    id: string;        // stable unique id -> React key, drives auto add/remove
    name: string;       // display label
    anomaly: boolean;   // false = healthy (green), true = AI flagged an issue (whole body turns red)
    status?: 'normal' | 'warning' | 'critical' | 'offline';
}

interface Props {
    machines: Machine[];
    onSelectMachine?: (id: string) => void;
    selectedId?: string | null;
}

const SPACING = 3.2;

// Centered grid position for machine `index` out of `total`.
// Recomputed every render, so adding/removing a machine reflows everyone else automatically.
function gridPosition(index: number, total: number): [number, number, number] {
    const cols = Math.max(1, Math.ceil(Math.sqrt(total)));
    const rows = Math.ceil(total / cols);
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = (col - (cols - 1) / 2) * SPACING;
    const z = (row - (rows - 1) / 2) * SPACING;
    return [x, 0, z];
}

// Deterministic pick of a machine "look" from its id, so the same machine
// always renders as the same equipment type across re-renders/refreshes.
function variantForId(id: string): 0 | 1 | 2 {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    return (h % 3) as 0 | 1 | 2;
}

// Clean industrial metallic palette - high visibility on gray floor
const metalDark = '#334155';
const metalMid = '#64748b';
const metalLight = '#94a3b8';
const darkPanel = '#1e293b';
const RED = new THREE.Color('#ef4444');

// ---------------------------------------------------------------------------
// TintedMesh: a structural machine part with rich specular highlights.
// When `anomaly` is true, it blends to vivid red with pulsing emissive glow.
// ---------------------------------------------------------------------------
function TintedMesh({
    anomaly,
    color,
    metalness = 0.6,
    roughness = 0.35,
    position,
    rotation,
    geometry,
}: {
    anomaly: boolean;
    color: string;
    metalness?: number;
    roughness?: number;
    position?: [number, number, number];
    rotation?: [number, number, number];
    geometry: ReactNode;
}) {
    const matRef = useRef<THREE.MeshStandardMaterial>(null);
    const baseColor = useMemo(() => new THREE.Color(color), [color]);

    useFrame((state) => {
        const m = matRef.current;
        if (!m) return;
        if (anomaly) {
            const t = state.clock.elapsedTime;
            m.color.copy(RED).lerp(baseColor, 0.2);
            m.emissive.setHex(0xef4444);
            m.emissiveIntensity = 0.35 + Math.sin(t * 5) * 0.25;
        } else {
            m.color.copy(baseColor);
            m.emissive.setHex(0x000000);
            m.emissiveIntensity = 0;
        }
    });

    return (
        <mesh position={position} rotation={rotation} castShadow receiveShadow>
            {geometry}
            <meshStandardMaterial ref={matRef} color={color} metalness={metalness} roughness={roughness} />
        </mesh>
    );
}

function Beacon({ topY, anomaly }: { topY: number; anomaly: boolean }) {
    const lightRef = useRef<THREE.Mesh>(null);
    const beamRef = useRef<THREE.Group>(null);
    const color = anomaly ? '#ef4444' : '#10b981';

    useFrame((state, delta) => {
        const mat = lightRef.current?.material as THREE.MeshStandardMaterial | undefined;
        if (mat) {
            mat.emissiveIntensity = anomaly ? 0.8 + Math.sin(state.clock.elapsedTime * 6) * 0.5 : 0.6;
        }
        if (beamRef.current) beamRef.current.rotation.y += anomaly ? delta * 7 : 0;
    });

    return (
        <group>
            <mesh position={[0, topY + 0.175, 0]} castShadow>
                <cylinderGeometry args={[0.035, 0.035, 0.35, 12]} />
                <meshStandardMaterial color={metalDark} metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh ref={lightRef} position={[0, topY + 0.4, 0]}>
                <sphereGeometry args={[0.12, 16, 16]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
            </mesh>
            <group ref={beamRef} position={[0, topY + 0.4, 0]} visible={anomaly}>
                <mesh>
                    <boxGeometry args={[0.5, 0.03, 0.03]} />
                    <meshBasicMaterial color={color} transparent opacity={0.65} />
                </mesh>
            </group>
        </group>
    );
}

// Colored hazard ring painted on the floor under a machine
function FloorMarkers({ w, d, anomaly }: { w: number; d: number; anomaly: boolean }) {
    const ringRef = useRef<THREE.Mesh>(null);
    const color = anomaly ? '#ef4444' : '#10b981';

    useFrame((state) => {
        const mat = ringRef.current?.material as THREE.MeshBasicMaterial | undefined;
        if (mat) mat.opacity = anomaly ? 0.65 + Math.sin(state.clock.elapsedTime * 4) * 0.3 : 0.85;
    });

    const hazardCanvas = useMemo(() => {
        const c = document.createElement('canvas');
        c.width = 64; c.height = 64;
        const ctx = c.getContext('2d')!;
        ctx.fillStyle = '#1e293b'; ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = '#f59e0b';
        ctx.save(); ctx.translate(32, 32); ctx.rotate(Math.PI / 4); ctx.translate(-32, -32);
        for (let x = -64; x < 128; x += 18) ctx.fillRect(x, -32, 8, 128);
        ctx.restore();
        const tex = new THREE.CanvasTexture(c);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set((w + 0.8) * 1.4, (d + 0.8) * 1.4);
        return tex;
    }, [w, d]);

    const outerR = Math.max(w, d) * 0.52;
    const innerR = Math.max(w, d) * 0.44;

    return (
        <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
                <planeGeometry args={[w + 0.8, d + 0.8]} />
                <meshBasicMaterial map={hazardCanvas} transparent opacity={0.6} />
            </mesh>
            <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                <ringGeometry args={[innerR, outerR, 36]} />
                <meshBasicMaterial color={color} transparent opacity={0.85} side={THREE.DoubleSide} />
            </mesh>
        </group>
    );
}

function ControlCabinet({ anomaly }: { anomaly: boolean }) {
    return (
        <group>
            <TintedMesh anomaly={anomaly} color={metalDark} metalness={0.7} roughness={0.3} position={[0, 0.05, 0]} geometry={<boxGeometry args={[1.3, 0.1, 1.1]} />} />
            <TintedMesh anomaly={anomaly} color={metalMid} metalness={0.6} roughness={0.35} position={[0, 0.85, 0]} geometry={<boxGeometry args={[1.1, 1.5, 0.9]} />} />
            <TintedMesh anomaly={anomaly} color={metalDark} metalness={0.7} roughness={0.3} position={[0, 1.63, 0]} geometry={<boxGeometry args={[1.15, 0.06, 0.95]} />} />
            <TintedMesh anomaly={anomaly} color={darkPanel} metalness={0.4} roughness={0.5} position={[0, 1.05, 0.47]} geometry={<boxGeometry args={[0.75, 0.5, 0.04]} />} />
            <mesh position={[0, 1.15, 0.495]}><planeGeometry args={[0.34, 0.2]} /><meshBasicMaterial color="#38bdf8" /></mesh>
            {[['#ef4444', -0.15], ['#eab308', 0], ['#10b981', 0.15]].map(([c, x], i) => (
                <mesh key={i} position={[x as number, 0.9, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.035, 0.035, 0.02, 16]} />
                    <meshStandardMaterial color={c as string} emissive={c as string} emissiveIntensity={0.5} />
                </mesh>
            ))}
            {[0, 1, 2, 3].map((i) => (
                <TintedMesh key={i} anomaly={anomaly} color={darkPanel} metalness={0.4} roughness={0.5} position={[0.56 - i * 0.01, 1.0, 0]} geometry={<boxGeometry args={[0.03, 0.5, 0.7]} />} />
            ))}
            <Beacon topY={1.66} anomaly={anomaly} />
        </group>
    );
}

function TankUnit({ anomaly }: { anomaly: boolean }) {
    return (
        <group>
            <TintedMesh anomaly={anomaly} color={metalDark} metalness={0.7} roughness={0.3} position={[0, 0.06, 0]} geometry={<cylinderGeometry args={[0.55, 0.6, 0.12, 32]} />} />
            <TintedMesh anomaly={anomaly} color={metalLight} metalness={0.8} roughness={0.25} position={[0, 0.77, 0]} geometry={<cylinderGeometry args={[0.5, 0.5, 1.3, 32]} />} />
            <TintedMesh anomaly={anomaly} color={metalMid} metalness={0.6} roughness={0.35} position={[0, 1.545, 0]} geometry={<cylinderGeometry args={[0.28, 0.5, 0.25, 32]} />} />
            {[0, 1, 2].map((i) => (
                <TintedMesh key={i} anomaly={anomaly} color={metalDark} metalness={0.7} roughness={0.3} position={[0, 0.3 + i * 0.4, 0]} rotation={[Math.PI / 2, 0, 0]} geometry={<torusGeometry args={[0.505, 0.025, 12, 32]} />} />
            ))}
            <TintedMesh anomaly={anomaly} color={metalDark} metalness={0.7} roughness={0.3} position={[0.62, 1.0, 0]} rotation={[0, 0, Math.PI / 2.6]} geometry={<cylinderGeometry args={[0.06, 0.06, 0.55, 16]} />} />
            <mesh position={[0.5, 0.9, 0.25]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.11, 0.11, 0.03, 24]} />
                <meshStandardMaterial color="#f8fafc" metalness={0.4} roughness={0.2} />
            </mesh>
            <Beacon topY={1.67} anomaly={anomaly} />
        </group>
    );
}

function ConveyorUnit({ anomaly }: { anomaly: boolean }) {
    return (
        <group>
            {[[-0.85, -0.28], [-0.85, 0.28], [0.85, -0.28], [0.85, 0.28]].map(([x, z], i) => (
                <TintedMesh key={i} anomaly={anomaly} color={metalDark} metalness={0.7} roughness={0.3} position={[x, 0.25, z]} geometry={<cylinderGeometry args={[0.05, 0.05, 0.5, 12]} />} />
            ))}
            <TintedMesh anomaly={anomaly} color={metalMid} metalness={0.6} roughness={0.35} position={[0, 0.57, 0]} geometry={<boxGeometry args={[1.9, 0.14, 0.65]} />} />
            <TintedMesh anomaly={anomaly} color={darkPanel} metalness={0.4} roughness={0.5} position={[0, 0.66, 0]} geometry={<boxGeometry args={[1.7, 0.04, 0.5]} />} />
            {[-0.88, 0.88].map((x, i) => (
                <TintedMesh key={i} anomaly={anomaly} color={metalLight} metalness={0.8} roughness={0.25} position={[x, 0.6, 0]} rotation={[0, 0, Math.PI / 2]} geometry={<cylinderGeometry args={[0.14, 0.14, 0.62, 20]} />} />
            ))}
            <TintedMesh anomaly={anomaly} color={metalDark} metalness={0.7} roughness={0.3} position={[-0.65, 0.32, 0.42]} geometry={<boxGeometry args={[0.32, 0.28, 0.32]} />} />
            <group position={[0.9, 0, 0]}>
                <Beacon topY={0.78} anomaly={anomaly} />
            </group>
        </group>
    );
}

const VARIANTS = [
    { Component: ControlCabinet, footprint: { w: 1.3, d: 1.1 }, label: 'Control Cabinet' },
    { Component: TankUnit, footprint: { w: 1.2, d: 1.2 }, label: 'Tank / Pump Unit' },
    { Component: ConveyorUnit, footprint: { w: 1.9, d: 0.65 }, label: 'Conveyor Unit' },
] as const;

function MachineUnit({
    machine,
    position,
    isSelected,
    showLabels = true,
    onSelect,
}: {
    machine: Machine;
    position: [number, number, number];
    isSelected?: boolean;
    showLabels?: boolean;
    onSelect?: (id: string) => void;
}) {
    const variant = VARIANTS[variantForId(machine.id)];
    const { Component, footprint } = variant;

    return (
        <group
            position={position}
            onClick={(e) => {
                e.stopPropagation();
                if (onSelect) onSelect(machine.id);
            }}
            onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
                document.body.style.cursor = 'auto';
            }}
        >
            <Component anomaly={machine.anomaly} />
            <FloorMarkers w={footprint.w} d={footprint.d} anomaly={machine.anomaly} />
            {showLabels && (
                <Html position={[0, 2.25, 0]} center>
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onSelect) onSelect(machine.id);
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-200 select-none shadow-xl whitespace-nowrap flex items-center gap-2 ${
                            isSelected
                                ? 'bg-emerald-600 text-white ring-2 ring-emerald-300 scale-110 shadow-emerald-900/50'
                                : machine.anomaly
                                ? 'bg-red-950/95 text-red-100 border border-red-500/80 shadow-red-950/80 hover:bg-red-900'
                                : 'bg-slate-900/90 text-slate-100 border border-slate-700/80 shadow-black/60 hover:bg-slate-800'
                        }`}
                        style={{ backdropFilter: 'blur(8px)' }}
                    >
                        <span
                            className={`inline-block w-2.5 h-2.5 rounded-full ${
                                machine.anomaly ? 'bg-red-500 animate-ping shadow-[0_0_8px_#ef4444]' : 'bg-emerald-400 shadow-[0_0_8px_#10b981]'
                            }`}
                        />
                        <span>{machine.name}</span>
                    </div>
                </Html>
            )}
        </group>
    );
}

// ---------------------------------------------------------------------------
// High-visibility Industrial Gray Studio Floor
// ---------------------------------------------------------------------------
function Floor() {
    const texture = useMemo(() => {
        const c = document.createElement('canvas');
        c.width = 512; c.height = 512;
        const ctx = c.getContext('2d')!;
        
        // Clean, bright industrial slate gray floor (high contrast with machines)
        ctx.fillStyle = '#334155';
        ctx.fillRect(0, 0, 512, 512);

        // Minor grid pattern
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
        ctx.lineWidth = 2;
        for (let i = 0; i <= 512; i += 32) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke();
        }

        // Major emerald accent grid lines
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.15)';
        ctx.lineWidth = 3;
        for (let i = 0; i <= 512; i += 128) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke();
        }

        const tex = new THREE.CanvasTexture(c);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(12, 12);
        return tex;
    }, []);

    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.01, 0]}>
            <planeGeometry args={[100, 100]} />
            <meshStandardMaterial map={texture} roughness={0.6} metalness={0.15} />
        </mesh>
    );
}

const MachineGrid: React.FC<Props> = ({ machines, onSelectMachine, selectedId }) => {
    const [showLabels, setShowLabels] = React.useState(true);

    // Positions recomputed every render from the current machine list length —
    // this is what makes new/removed machines reflow the whole grid automatically.
    const positioned = useMemo(
        () => machines.map((m, i) => ({ machine: m, position: gridPosition(i, machines.length) })),
        [machines]
    );

    const counts = useMemo(() => {
        const critical = machines.filter((m) => m.anomaly || m.status === 'critical').length;
        const warning = machines.filter((m) => m.status === 'warning' && !m.anomaly).length;
        const normal = machines.length - critical - warning;
        return { normal, warning, critical };
    }, [machines]);

    return (
        <div
            className="rounded-2xl relative overflow-hidden shadow-2xl transition-all duration-300"
            style={{
                height: '580px',
                background: 'radial-gradient(circle at 20% 20%, rgba(20, 83, 56, 0.28) 0%, rgba(15, 23, 42, 0.88) 55%, rgba(5, 46, 31, 0.4) 100%)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(52, 211, 153, 0.22)',
                boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            }}
        >
            {/* Top-Left Header & Hide/Show Labels Toggle */}
            <div
                style={{
                    position: 'absolute',
                    top: '16px',
                    left: '16px',
                    zIndex: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    pointerEvents: 'auto',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.25rem' }}>🏭</span>
                    <h3
                        style={{
                            fontSize: '1rem',
                            fontWeight: 700,
                            color: '#ffffff',
                            margin: 0,
                            letterSpacing: '0.02em',
                        }}
                    >
                        Factory 3D View
                    </h3>
                    <span
                        style={{
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            backgroundColor: 'rgba(16, 185, 129, 0.2)',
                            color: '#6ee7b7',
                            border: '1px solid rgba(16, 185, 129, 0.35)',
                        }}
                    >
                        {machines.length} Machines
                    </span>
                </div>

                <button
                    type="button"
                    onClick={() => setShowLabels((prev) => !prev)}
                    style={{
                        alignSelf: 'flex-start',
                        padding: '5px 12px',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#e2e8f0',
                        backgroundColor: 'rgba(30, 41, 59, 0.85)',
                        border: '1px solid rgba(71, 85, 105, 0.6)',
                        cursor: 'pointer',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
                        transition: 'all 0.2s ease',
                    }}
                >
                    {showLabels ? 'Hide Labels' : 'Show Labels'}
                </button>
            </div>

            {/* Top-Right Status Legend */}
            <div
                style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    zIndex: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    backgroundColor: 'rgba(15, 23, 42, 0.88)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(51, 65, 85, 0.7)',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4)',
                    pointerEvents: 'auto',
                }}
            >
                <span
                    style={{
                        color: '#94a3b8',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        marginBottom: '2px',
                    }}
                >
                    Status
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }}>
                    <span
                        style={{
                            width: '9px',
                            height: '9px',
                            borderRadius: '50%',
                            backgroundColor: '#10b981',
                            boxShadow: '0 0 8px #10b981',
                        }}
                    />
                    <span style={{ color: '#f1f5f9', fontWeight: 500 }}>Normal ({counts.normal})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }}>
                    <span
                        style={{
                            width: '9px',
                            height: '9px',
                            borderRadius: '50%',
                            backgroundColor: '#f59e0b',
                            boxShadow: '0 0 8px #f59e0b',
                        }}
                    />
                    <span style={{ color: '#f1f5f9', fontWeight: 500 }}>Warning ({counts.warning})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }}>
                    <span
                        style={{
                            width: '9px',
                            height: '9px',
                            borderRadius: '50%',
                            backgroundColor: '#ef4444',
                            boxShadow: '0 0 8px #ef4444',
                        }}
                    />
                    <span style={{ color: '#fca5a5', fontWeight: 600 }}>Critical ({counts.critical})</span>
                </div>
            </div>

            {/* Bottom-Left Controls Helper */}
            <div
                style={{
                    position: 'absolute',
                    bottom: '14px',
                    left: '16px',
                    zIndex: 20,
                    pointerEvents: 'none',
                }}
            >
                <span
                    style={{
                        fontSize: '0.75rem',
                        color: '#94a3b8',
                        fontWeight: 500,
                        backgroundColor: 'rgba(15, 23, 42, 0.75)',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(51, 65, 85, 0.5)',
                        backdropFilter: 'blur(8px)',
                    }}
                >
                    Drag to rotate • Scroll to zoom • Shift + drag to pan
                </span>
            </div>

            {/* 3D Canvas Scene with High-Visibility Studio Lighting */}
            <Canvas shadows>
                <PerspectiveCamera makeDefault position={[12, 12, 14]} fov={48} />
                <OrbitControls
                    enablePan
                    enableZoom
                    enableRotate
                    minDistance={5}
                    maxDistance={50}
                    maxPolarAngle={Math.PI / 2.05}
                />

                {/* Bright studio lights so machines stand out clearly */}
                <ambientLight color="#f8fafc" intensity={0.9} />
                <directionalLight color="#ffffff" position={[16, 24, 12]} intensity={1.2} castShadow shadow-mapSize={1024} />
                <directionalLight color="#38bdf8" position={[-12, 14, -10]} intensity={0.5} />
                <directionalLight color="#34d399" position={[0, 16, -16]} intensity={0.4} />

                {/* Industrial gray floor */}
                <Floor />

                {/* Machine Units */}
                {positioned.map(({ machine, position }) => (
                    <MachineUnit
                        key={machine.id}
                        machine={machine}
                        position={position}
                        isSelected={selectedId === machine.id}
                        showLabels={showLabels}
                        onSelect={onSelectMachine}
                    />
                ))}

                {/* Clean atmospheric depth */}
                <fog attach="fog" args={['#1e293b', 35, 95]} />
            </Canvas>
        </div>
    );
};

export default MachineGrid;