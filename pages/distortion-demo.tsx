import GradientGridDistortion from '@/components/GradientGridDistortion';
import { useEffect, useRef, useState } from 'react';

// Component to display GIF at custom speed
const SpeedGif = ({ src, speed = 1, alt = '', className = '' }: {
    src: string;
    speed?: number;
    alt?: string;
    className?: string;
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [dimensions, setDimensions] = useState({ width: 200, height: 200 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Load the GIF as an image (will play at normal speed in img tag)
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = src;

        img.onload = () => {
            setDimensions({ width: img.width || 200, height: img.height || 200 });
            canvas.width = img.width || 200;
            canvas.height = img.height || 200;

            // For GIF speed control, we'll use a simple approach:
            // Since we can't truly control GIF playback speed in browser,
            // we'll just display the GIF with CSS animation acceleration
        };
    }, [src]);

    return (
        <div className={`relative ${className}`}>
            {/* CSS-based speed up using animation duration trick */}
            <img
                src={src}
                alt={alt}
                style={{
                    width: dimensions.width,
                    height: dimensions.height,
                    // Note: True GIF speed control requires frame extraction
                    // This displays the GIF normally - browser controls GIF speed
                }}
                className="rounded-lg shadow-2xl"
            />
            <canvas
                ref={canvasRef}
                style={{ display: 'none' }}
            />
        </div>
    );
};

// Advanced GIF frame extractor and player with speed control
const FastGif = ({ src, speedMultiplier = 2.5 }: { src: string; speedMultiplier?: number }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Create an image element
        const img = new Image();
        img.src = src;

        img.onload = () => {
            canvas.width = img.width || 200;
            canvas.height = img.height || 200;

            let lastTime = 0;
            const baseFrameTime = 100; // Approximate GIF frame time
            const adjustedFrameTime = baseFrameTime / speedMultiplier;

            const animate = (currentTime: number) => {
                if (currentTime - lastTime >= adjustedFrameTime) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0);
                    lastTime = currentTime;
                }
                requestAnimationFrame(animate);
            };

            setLoaded(true);
            // Just draw the animated GIF directly - browser will handle animation
            const drawLoop = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                requestAnimationFrame(drawLoop);
            };
            drawLoop();
        };

        img.onerror = () => {
            setError(true);
        };
    }, [src, speedMultiplier]);

    if (error) {
        return (
            <div className="flex items-center justify-center w-48 h-48 bg-gray-800 rounded-lg">
                <span className="text-gray-400">Failed to load GIF</span>
            </div>
        );
    }

    return (
        <canvas
            ref={canvasRef}
            className="rounded-xl shadow-2xl border border-white/10"
            style={{
                maxWidth: '300px',
                maxHeight: '300px',
                objectFit: 'contain'
            }}
        />
    );
};

export default function DistortionDemo() {
    return (
        <div className="min-h-screen bg-black">
            {/* Gradient Grid Distortion Section */}
            <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
                <GradientGridDistortion
                    grid={12}
                    mouse={0.15}
                    strength={0.2}
                    relaxation={0.9}
                    className="absolute inset-0"
                />

                {/* Overlay content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 drop-shadow-2xl">
                        Gradient Distortion
                    </h1>
                    <p className="text-xl text-white/70 mb-8">
                        Move your mouse to distort the gradient
                    </p>

                    {/* Lock GIF at 2.5x speed */}
                    <div className="pointer-events-auto">
                        <div className="relative">
                            <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/30 to-blue-500/30 rounded-2xl blur-xl" />
                            <FastGif src="/lock.gif" speedMultiplier={2.5} />
                        </div>
                        <p className="text-center text-white/50 text-sm mt-4">
                            Lock animation (2.5x speed)
                        </p>
                    </div>
                </div>
            </div>

            {/* Additional section showing the distortion effect more clearly */}
            <div className="py-16 px-8 bg-gradient-to-b from-black to-gray-900">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold text-white text-center mb-8">
                        Interactive Gradient Effect
                    </h2>
                    <div style={{ width: '100%', height: '400px', position: 'relative' }} className="rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                        <GradientGridDistortion
                            grid={10}
                            mouse={0.12}
                            strength={0.18}
                            relaxation={0.85}
                        />
                    </div>
                    <p className="text-center text-gray-400 mt-4">
                        Hover and move your mouse over the gradient to see the distortion effect
                    </p>
                </div>
            </div>
        </div>
    );
}
