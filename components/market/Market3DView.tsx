"use client";

import React, { useRef, useState, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Text, Float, ContactShadows, Environment, Billboard } from "@react-three/drei";
import * as THREE from "three";

interface WorldData {
    state: string; // "000", "001", etc.
    meaning: string;
    prob: number;
}

const WORLDS: WorldData[] = [
    { state: "000", meaning: "Khamenei No, US No, Israel No", prob: 20.4 },
    { state: "001", meaning: "Khamenei No, US No, Israel Yes", prob: 1.2 },
    { state: "010", meaning: "Khamenei No, US Yes, Israel No", prob: 0.8 },
    { state: "011", meaning: "Khamenei No, US Yes, Israel Yes", prob: 0.6 },
    { state: "100", meaning: "Khamenei Yes, US No, Israel No", prob: 75.2 },
    { state: "101", meaning: "Khamenei Yes, US No, Israel Yes", prob: 1.0 },
    { state: "110", meaning: "Khamenei Yes, US Yes, Israel No", prob: 0.5 },
    { state: "111", meaning: "Khamenei Yes, US Yes, Israel Yes", prob: 0.3 },
];


// Mapping based on "state" string format from WorldTable in MarketCombinedChart.tsx
// state[0] = Khamenei (m1)
// state[1] = US (m2)
// state[2] = Israel (m3)

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

            {/* Detailed Info on Hover - Solid White Modal Design */}
            {isHovered && (
                <Billboard position={[0, 0, 1.5]} follow={true}>
                    <group renderOrder={9998}>
                        {/* Border (Black) */}
                        <mesh position={[0, 0, -0.01]} renderOrder={9998}>
                            <planeGeometry args={[1.82, 1.32]} />
                            <meshBasicMaterial color="#000000" depthTest={false} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} transparent={true} opacity={1} />
                        </mesh>
                        {/* Modal Background (White) */}
                        <mesh position={[0, 0, 0]} renderOrder={9999}>
                            <planeGeometry args={[1.8, 1.3]} />
                            <meshBasicMaterial color="#ffffff" depthTest={false} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} transparent={true} opacity={1} />
                        </mesh>

                        {/* Probability Header */}
                        <group position={[0, 0.35, 0.1]}>
                            <mesh>
                                <planeGeometry args={[0.7, 0.45]} />
                                <meshBasicMaterial color={isMostProbable ? "#fbbf24" : "#2563eb"} depthTest={false} depthWrite={false} toneMapped={false} />
                            </mesh>
                            <Text
                                fontSize={0.18}
                                anchorX="center"
                                anchorY="middle"
                                renderOrder={10001}
                            >
                                <meshBasicMaterial
                                    attach="material"
                                    color="#000000"
                                    toneMapped={false}
                                    depthTest={false}
                                    depthWrite={false}
                                />
                                {prob}%
                            </Text>
                        </group>

                        {/* Market Results */}
                        {/* Market Results */}
                        <group position={[-0.8, 0.05, 0.2]}>
                            {/* Line 1: Khamenei (m1 - Light Blue) */}
                            <group position={[0, 0, 0]}>
                                <mesh position={[-0.08, -0.04, 0]} renderOrder={20000}>
                                    <circleGeometry args={[0.04, 32]} />
                                    <meshBasicMaterial
                                        color={COLORS[0]}
                                        depthTest={false}
                                        depthWrite={false}
                                        toneMapped={false}
                                    />
                                </mesh>
                                <Text
                                    position={[0, 0, 0]}
                                    fontSize={0.10}
                                    anchorX="left"
                                    anchorY="top"
                                    renderOrder={10001}
                                >
                                    <meshBasicMaterial
                                        attach="material"
                                        color="#000000"
                                        toneMapped={false}
                                        depthTest={false}
                                        depthWrite={false}
                                    />
                                    Khamenei out: {khameneiVal}
                                </Text>
                            </group>

                            {/* Line 2: US (m2 - Dark Blue) */}
                            <group position={[0, -0.22, 0]}>
                                <mesh position={[-0.08, -0.04, 0]} renderOrder={20000}>
                                    <circleGeometry args={[0.04, 32]} />
                                    <meshBasicMaterial
                                        color={COLORS[1]}
                                        depthTest={false}
                                        depthWrite={false}
                                        toneMapped={false}
                                    />
                                </mesh>
                                <Text
                                    position={[0, 0, 0]}
                                    fontSize={0.10}
                                    anchorX="left"
                                    anchorY="top"
                                    renderOrder={10001}
                                >
                                    <meshBasicMaterial
                                        attach="material"
                                        color="#000000"
                                        toneMapped={false}
                                        depthTest={false}
                                        depthWrite={false}
                                    />
                                    Us Strikes Iran: {usVal}
                                </Text>
                            </group>

                            {/* Line 3: Israel (m3 - Yellow) */}
                            <group position={[0, -0.44, 0]}>
                                <mesh position={[-0.08, -0.04, 0]} renderOrder={20000}>
                                    <circleGeometry args={[0.04, 32]} />
                                    <meshBasicMaterial
                                        color={COLORS[2]}
                                        depthTest={false}
                                        depthWrite={false}
                                        toneMapped={false}
                                    />
                                </mesh>
                                <Text
                                    position={[0, 0, 0]}
                                    fontSize={0.10}
                                    anchorX="left"
                                    anchorY="top"
                                    renderOrder={10001}
                                >
                                    <meshBasicMaterial
                                        attach="material"
                                        color="#000000"
                                        toneMapped={false}
                                        depthTest={false}
                                        depthWrite={false}
                                    />
                                    Israel Strikes Iran: {israelVal}
                                </Text>
                            </group>
                        </group>
                    </group>
                </Billboard>
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

export default function Market3DView() {
    return (
        <div className="w-full h-[500px] bg-white rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-6 left-6 z-10">
                <h2 className="text-[14px] font-black text-gray-900 uppercase tracking-[0.2em]">3D Market Matrix</h2>
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
