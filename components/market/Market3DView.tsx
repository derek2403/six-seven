"use client";

import React, { useRef, useState, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Text, Float, ContactShadows, Environment, Billboard, Html } from "@react-three/drei";
import * as THREE from "three";

type MarketSelection = "yes" | "no" | "any" | null;

interface WorldData {
    state: string; // "000", "001", etc.
    meaning: string;
    // prob is now derived from props
}

const WORLDS: WorldData[] = [
    { state: "000", meaning: "Khamenei No, US No, Israel No" },
    { state: "001", meaning: "Khamenei No, US No, Israel Yes" },
    { state: "010", meaning: "Khamenei No, US Yes, Israel No" },
    { state: "011", meaning: "Khamenei No, US Yes, Israel Yes" },
    { state: "100", meaning: "Khamenei Yes, US No, Israel No" },
    { state: "101", meaning: "Khamenei Yes, US No, Israel Yes" },
    { state: "110", meaning: "Khamenei Yes, US Yes, Israel No" },
    { state: "111", meaning: "Khamenei Yes, US Yes, Israel Yes" },
];


// Mapping based on "state" string format from WorldTable in MarketCombinedChart.tsx
// state[0] = Khamenei (m1)
// state[1] = US (m2)
// state[2] = Israel (m3)

const COLORS = ["#60a5fa", "#2563eb", "#facc15"];

function Cube({ position, prob, state, isHovered, isSelected, onHover, onClick }: {
    position: [number, number, number],
    prob: number,
    state: string,
    isHovered: boolean,
    isSelected: boolean,
    onHover: (hover: boolean) => void,
    onClick: () => void
}) {
    const mesh = useRef<THREE.Mesh>(null!);
    const [pulsePhase, setPulsePhase] = useState(0);

    // Pulsing animation for selected cube
    useFrame((state, delta) => {
        if (isSelected) {
            setPulsePhase(prev => (prev + delta * 2) % (Math.PI * 2));
            if (mesh.current) {
                // Pulse scale
                const scale = 1 + Math.sin(pulsePhase) * 0.05;
                mesh.current.scale.setScalar(scale);
            }
        } else if (mesh.current) {
            mesh.current.scale.setScalar(1);
        }
    });

    // Intensity based on probability
    const intensity = 0.1 + (prob / 100) * 0.9;
    const isMostProbable = prob > 50;

    // Detailed breakdown for hover
    const khameneiVal = state[0] === '1' ? 'YES' : 'NO';
    const usVal = state[1] === '1' ? 'YES' : 'NO';
    const israelVal = state[2] === '1' ? 'YES' : 'NO';

    return (
        <group position={position}>
            <mesh
                ref={mesh}
                onPointerOver={(e) => {
                    e.stopPropagation();
                    onHover(true);
                }}
                onPointerOut={(e) => {
                    e.stopPropagation();
                    onHover(false);
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                }}
                style={{ cursor: 'pointer' }}
            >
                <boxGeometry args={[1, 1, 1]} />
                <meshPhysicalMaterial
                    transparent
                    opacity={isHovered ? 0.9 : isSelected ? 0.8 : 0.3 * intensity + 0.1}
                    color={isSelected ? "#3b82f6" : "#60a5fa"}
                    roughness={0.1}
                    metalness={0.2}
                    transmission={0.5}
                    thickness={1}
                    clearcoat={1}
                    emissive={isSelected ? "#3b82f6" : "#60a5fa"}
                    emissiveIntensity={isSelected ? 0.5 + Math.sin(pulsePhase) * 0.3 : isHovered ? 0.6 : 0.2 * intensity}
                />

                {/* Always-visible probability on the cube */}
                {prob > 0.5 && !isHovered && (
                    <Billboard>
                        <Text
                            fontSize={0.22}
                            color="black"
                            anchorX="center"
                            anchorY="middle"
                            fontWeight="bold"
                        >
                            {prob}%
                        </Text>
                    </Billboard>
                )}
            </mesh>

            {/* Detailed Info on Hover - Using Html for reliable rendering */}
            {isHovered && (
                <Html
                    position={[0, 0, 0.8]}
                    center
                    distanceFactor={3}
                    style={{ pointerEvents: 'none' }}
                >
                    <div style={{
                        background: 'white',
                        border: '2px solid black',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        minWidth: '180px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    }}>
                        {/* Probability */}
                        <div style={{
                            background: 'transparent',
                            color: '#2563eb',
                            fontWeight: 'bold',
                            fontSize: '40px',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            textAlign: 'center',
                            marginBottom: '4px',
                        }}>
                            {prob}%
                        </div>

                        {/* Market Results */}
                        <div style={{ color: 'black', fontSize: '12px', lineHeight: '1.6' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[0], display: 'inline-block' }}></span>
                                <span>Khamenei out: <strong>{khameneiVal}</strong></span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[1], display: 'inline-block' }}></span>
                                <span>US Strikes Iran: <strong>{usVal}</strong></span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[2], display: 'inline-block' }}></span>
                                <span>Israel Strikes Iran: <strong>{israelVal}</strong></span>
                            </div>
                        </div>
                    </div>
                </Html>
            )}

        </group>
    );
}


function Labels() {
    return (
        <group>
            {/* Axis A: Bottom Edge (X-axis) */}
            <group position={[0, -1.3, 1.2]}>
                <Billboard position={[-0.55, 0, 0]}>
                    <Text fontSize={0.14} color="#9ca3af" fontWeight="bold">No</Text>
                </Billboard>
                <Billboard position={[0.55, 0, 0]}>
                    <Text fontSize={0.14} color="#9ca3af" fontWeight="bold">Yes</Text>
                </Billboard>
                <Billboard position={[0, -0.25, 0]}>
                    <Text fontSize={0.2} color="#1f2937" fontWeight="black">A: Khamenei out</Text>
                </Billboard>
            </group>

            {/* Axis B: Left Edge (Y-axis) */}
            <group position={[-1.3, 0, 1.2]}>
                <Billboard position={[0, -0.55, 0]}>
                    <Text fontSize={0.14} color="#9ca3af" fontWeight="bold">No</Text>
                </Billboard>
                <Billboard position={[0, 0.55, 0]}>
                    <Text fontSize={0.14} color="#9ca3af" fontWeight="bold">Yes</Text>
                </Billboard>
                <Billboard position={[-0.4, 0, 0]}>
                    <Text fontSize={0.2} color="#1f2937" fontWeight="black">B: US strikes Iran</Text>
                </Billboard>
            </group>

            {/* Axis C: Depth Edge (Z-axis) */}
            <group position={[1.2, -1.3, 0]}>
                <Billboard position={[0, 0, -0.55]}>
                    <Text fontSize={0.14} color="#9ca3af" fontWeight="bold">No</Text>
                </Billboard>
                <Billboard position={[0, 0, 0.55]}>
                    <Text fontSize={0.14} color="#9ca3af" fontWeight="bold">Yes</Text>
                </Billboard>
                <Billboard position={[0.5, 0.3, 0]}>
                    <Text fontSize={0.2} color="#1f2937" fontWeight="black">C: Israel next strikes</Text>
                </Billboard>
            </group>
        </group>
    );
}



function Scene({ marketSelections, onMarketSelectionsChange, probabilities }: {
    marketSelections?: Record<string, MarketSelection>;
    onMarketSelectionsChange?: (selections: Record<string, MarketSelection>) => void;
    probabilities: Record<string, number>;
}) {
    const [hoveredState, setHoveredState] = useState<string | null>(null);
    const [selectedState, setSelectedState] = useState<string | null>(null);

    // Auto-select cube when all 3 markets have yes/no selections
    React.useEffect(() => {
        if (!marketSelections) return;

        const m1 = marketSelections.m1;
        const m2 = marketSelections.m2;
        const m3 = marketSelections.m3;

        // If all 3 markets have yes or no (not null, not "any"), auto-select cube
        if (m1 !== null && m1 !== "any" &&
            m2 !== null && m2 !== "any" &&
            m3 !== null && m3 !== "any") {
            // Build the state string: "0" for no, "1" for yes
            const state = (
                (m1 === "yes" ? "1" : "0") +
                (m2 === "yes" ? "1" : "0") +
                (m3 === "yes" ? "1" : "0")
            );
            setSelectedState(state);
        }
    }, [marketSelections]);

    const handleCubeClick = (state: string) => {
        // Toggle selection
        if (selectedState === state) {
            setSelectedState(null);
        } else {
            setSelectedState(state);
        }

        if (!onMarketSelectionsChange) return;

        // Map state characters to yes/no for each market
        const newSelections: Record<string, MarketSelection> = {
            m1: state[0] === '1' ? 'yes' : 'no',  // Khamenei
            m2: state[1] === '1' ? 'yes' : 'no',  // US Strikes
            m3: state[2] === '1' ? 'yes' : 'no',  // Israel Strikes
        };

        onMarketSelectionsChange(newSelections);
    };

    const cubes = useMemo(() => {
        return WORLDS.map((w) => {
            // state[0] = x, state[1] = y, state[2] = z
            const x = w.state[0] === "1" ? 0.55 : -0.55;
            const y = w.state[1] === "1" ? 0.55 : -0.55;
            const z = w.state[2] === "1" ? 0.55 : -0.55;
            return {
                ...w,
                position: [x, y, z] as [number, number, number],
                prob: probabilities[w.state] || 0
            };
        });
    }, [probabilities]);

    return (
        <>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />

            <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
                <group rotation={[Math.PI / 6, -Math.PI / 4, 0]}>
                    {cubes.map((c) => (
                        <Cube
                            key={c.state}
                            position={c.position}
                            prob={c.prob}
                            state={c.state}
                            isHovered={hoveredState === c.state}
                            isSelected={selectedState === c.state}
                            onHover={(h) => setHoveredState(h ? c.state : null)}
                            onClick={() => handleCubeClick(c.state)}
                        />
                    ))}

                    {/* Wireframe container */}
                    <mesh>
                        <boxGeometry args={[2.2, 2.2, 2.2]} />
                        <meshBasicMaterial color="#e5e7eb" wireframe transparent opacity={0.2} />
                    </mesh>

                    <Labels />
                </group>
            </Float>

            <Environment preset="city" />
            <OrbitControls enableZoom={true} minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI / 1.5} />
        </>

    );
}

export default function Market3DView({ marketSelections, onMarketSelectionsChange, probabilities }: {
    marketSelections?: Record<string, MarketSelection>;
    onMarketSelectionsChange?: (selections: Record<string, MarketSelection>) => void;
    probabilities?: Record<string, number>;
}) {
    console.log("Market3DView probabilities:", probabilities);
    // Default probs if not provided
    const safeProbabilities = probabilities || {
        "000": 2.0, "001": 2.0, "010": 2.0, "011": 88.0,
        "100": 2.0, "101": 2.0, "110": 2.0, "111": 2.0
    };
    return (
        <div className="w-full h-[500px] bg-white rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-6 left-6 z-10">
                <h2 className="text-[14px] font-black text-gray-900 uppercase tracking-[0.2em]">3D Market Matrix</h2>
                <p className="text-[13px] text-gray-400 mt-1 font-medium italic">8 joint-outcome possibilities</p>
            </div>

            <Canvas shadows dpr={[1, 2]}>
                <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
                <Scene
                    marketSelections={marketSelections}
                    onMarketSelectionsChange={onMarketSelectionsChange}
                    probabilities={safeProbabilities}
                />
            </Canvas>

            <div className="absolute bottom-6 right-6 text-right z-10 pointer-events-none">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rotate to explore</p>
            </div>
        </div>
    );
}
