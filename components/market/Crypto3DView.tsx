"use client";

import React, { useRef, useState, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Text, Float, ContactShadows, Environment, Billboard, Html } from "@react-three/drei";
import * as THREE from "three";

interface WorldData {
    state: string; // "000", "001", etc.
    meaning: string;
    prob: number;
}

// Crypto-specific world states
// state[0] = BTC > $100k (m1)
// state[1] = ETH > $4k (m2)
// state[2] = SUI > $5 (m3)
const WORLDS: WorldData[] = [
    { state: "000", meaning: "BTC No, ETH No, SUI No", prob: 8.5 },
    { state: "001", meaning: "BTC No, ETH No, SUI Yes", prob: 5.2 },
    { state: "010", meaning: "BTC No, ETH Yes, SUI No", prob: 4.8 },
    { state: "011", meaning: "BTC No, ETH Yes, SUI Yes", prob: 3.5 },
    { state: "100", meaning: "BTC Yes, ETH No, SUI No", prob: 35.0 },
    { state: "101", meaning: "BTC Yes, ETH No, SUI Yes", prob: 18.5 },
    { state: "110", meaning: "BTC Yes, ETH Yes, SUI No", prob: 12.5 },
    { state: "111", meaning: "BTC Yes, ETH Yes, SUI Yes", prob: 12.0 },
];

const COLORS = ["#60a5fa", "#2563eb", "#facc15"];

function Cube({ position, prob, state, isHovered, onHover }: {
    position: [number, number, number],
    prob: number,
    state: string,
    isHovered: boolean,
    onHover: (hover: boolean) => void
}) {
    const mesh = useRef<THREE.Mesh>(null!);

    // Intensity based on probability
    const intensity = 0.1 + (prob / 100) * 0.9;
    const isMostProbable = prob > 30;

    // Detailed breakdown for hover
    const btcVal = state[0] === '1' ? 'YES' : 'NO';
    const ethVal = state[1] === '1' ? 'YES' : 'NO';
    const suiVal = state[2] === '1' ? 'YES' : 'NO';

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
            >
                <boxGeometry args={[1, 1, 1]} />
                <meshPhysicalMaterial
                    transparent
                    opacity={isHovered ? 0.9 : 0.3 * intensity + 0.1}
                    color={isMostProbable ? "#facc15" : "#60a5fa"}
                    roughness={0.1}
                    metalness={0.2}
                    transmission={0.5}
                    thickness={1}
                    clearcoat={1}
                    emissive={isMostProbable ? "#facc15" : "#60a5fa"}
                    emissiveIntensity={isHovered ? 0.6 : 0.2 * intensity}
                />

                {/* Always-visible probability on the cube */}
                {prob > 5 && !isHovered && (
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

            {/* Detailed Info on Hover */}
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
                            background: isMostProbable ? '#fbbf24' : '#2563eb',
                            color: isMostProbable ? 'black' : 'white',
                            fontWeight: 'bold',
                            fontSize: '18px',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            textAlign: 'center',
                            marginBottom: '10px',
                        }}>
                            {prob}%
                        </div>

                        {/* Market Results */}
                        <div style={{ color: 'black', fontSize: '12px', lineHeight: '1.6' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[0], display: 'inline-block' }}></span>
                                <span>BTC &gt; $100k: <strong>{btcVal}</strong></span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[1], display: 'inline-block' }}></span>
                                <span>ETH &gt; $4k: <strong>{ethVal}</strong></span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[2], display: 'inline-block' }}></span>
                                <span>SUI &gt; $5: <strong>{suiVal}</strong></span>
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
            {/* Axis A: Bottom Edge (X-axis) - BTC */}
            <group position={[0, -1.3, 1.2]}>
                <Billboard position={[-0.55, 0, 0]}>
                    <Text fontSize={0.14} color="#9ca3af" fontWeight="bold">No</Text>
                </Billboard>
                <Billboard position={[0.55, 0, 0]}>
                    <Text fontSize={0.14} color="#9ca3af" fontWeight="bold">Yes</Text>
                </Billboard>
                <Billboard position={[0, -0.25, 0]}>
                    <Text fontSize={0.2} color="#1f2937" fontWeight="black">A: BTC &gt; $100k</Text>
                </Billboard>
            </group>

            {/* Axis B: Left Edge (Y-axis) - ETH */}
            <group position={[-1.3, 0, 1.2]}>
                <Billboard position={[0, -0.55, 0]}>
                    <Text fontSize={0.14} color="#9ca3af" fontWeight="bold">No</Text>
                </Billboard>
                <Billboard position={[0, 0.55, 0]}>
                    <Text fontSize={0.14} color="#9ca3af" fontWeight="bold">Yes</Text>
                </Billboard>
                <Billboard position={[-0.4, 0, 0]}>
                    <Text fontSize={0.2} color="#1f2937" fontWeight="black">B: ETH &gt; $4k</Text>
                </Billboard>
            </group>

            {/* Axis C: Depth Edge (Z-axis) - SUI */}
            <group position={[1.2, -1.3, 0]}>
                <Billboard position={[0, 0, -0.55]}>
                    <Text fontSize={0.14} color="#9ca3af" fontWeight="bold">No</Text>
                </Billboard>
                <Billboard position={[0, 0, 0.55]}>
                    <Text fontSize={0.14} color="#9ca3af" fontWeight="bold">Yes</Text>
                </Billboard>
                <Billboard position={[0.5, 0.3, 0]}>
                    <Text fontSize={0.2} color="#1f2937" fontWeight="black">C: SUI &gt; $5</Text>
                </Billboard>
            </group>
        </group>
    );
}



function Scene() {
    const [hoveredState, setHoveredState] = useState<string | null>(null);

    const cubes = useMemo(() => {
        return WORLDS.map((w) => {
            // state[0] = x, state[1] = y, state[2] = z
            const x = w.state[0] === "1" ? 0.55 : -0.55;
            const y = w.state[1] === "1" ? 0.55 : -0.55;
            const z = w.state[2] === "1" ? 0.55 : -0.55;
            return { ...w, position: [x, y, z] as [number, number, number] };
        });
    }, []);

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
                            onHover={(h) => setHoveredState(h ? c.state : null)}
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

export default function Crypto3DView() {
    return (
        <div className="w-full h-[500px] bg-white rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-6 left-6 z-10">
                <h2 className="text-[14px] font-black text-gray-900 uppercase tracking-[0.2em]">3D Crypto Matrix</h2>
                <p className="text-[11px] text-gray-400 mt-1 font-medium italic">8 joint-outcome possibilities</p>
            </div>

            <Canvas shadows dpr={[1, 2]}>
                <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
                <Scene />
            </Canvas>

            <div className="absolute bottom-6 right-6 text-right z-10 pointer-events-none">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rotate to explore</p>
            </div>
        </div>
    );
}
