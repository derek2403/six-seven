import { useRef, useEffect } from 'react';
import * as THREE from 'three';

const vertexShader = `
uniform float time;
varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vUv = uv;
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

// Fragment shader that generates a gradient instead of using an image texture
const fragmentShader = `
uniform sampler2D uDataTexture;
uniform vec4 resolution;
uniform float time;
varying vec2 vUv;

// Simplex noise for organic flow
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec4 offset = texture2D(uDataTexture, vUv);
  vec2 uv = vUv - 0.02 * offset.rg;
  
  // Animated noise for organic movement
  float noise1 = snoise(uv * 2.0 + time * 0.1);
  float noise2 = snoise(uv * 3.0 - time * 0.15);
  float noise3 = snoise(uv * 1.5 + time * 0.08);
  
  // Base colors inspired by the image (deep blue to purple to cyan)
  vec3 color1 = vec3(0.05, 0.02, 0.15);   // Deep dark blue/purple
  vec3 color2 = vec3(0.15, 0.1, 0.45);    // Indigo
  vec3 color3 = vec3(0.3, 0.2, 0.7);      // Bright purple
  vec3 color4 = vec3(0.2, 0.4, 0.9);      // Electric blue
  vec3 color5 = vec3(0.6, 0.5, 0.85);     // Light purple/pink glow
  vec3 color6 = vec3(0.4, 0.7, 0.95);     // Cyan accent
  
  // Create flowing gradients with noise
  float t1 = smoothstep(-0.5, 1.0, uv.y + noise1 * 0.3);
  float t2 = smoothstep(0.0, 1.0, uv.x + noise2 * 0.25);
  float t3 = smoothstep(-0.3, 0.8, sin(uv.x * 3.14159 + noise3) * 0.5 + 0.5);
  
  // Wave-like flowing patterns
  float wave1 = sin(uv.x * 4.0 + uv.y * 2.0 + time * 0.3 + noise1 * 2.0) * 0.5 + 0.5;
  float wave2 = sin(uv.y * 3.0 - uv.x * 1.5 + time * 0.2 + noise2 * 1.5) * 0.5 + 0.5;
  float wave3 = sin((uv.x + uv.y) * 2.5 + time * 0.25) * 0.5 + 0.5;
  
  // Blend colors with flowing patterns
  vec3 baseGradient = mix(color1, color2, t1);
  baseGradient = mix(baseGradient, color3, t2 * 0.6);
  baseGradient = mix(baseGradient, color4, wave1 * 0.5);
  baseGradient = mix(baseGradient, color5, wave2 * t3 * 0.7);
  
  // Add glowing highlights
  float glow = smoothstep(0.4, 0.6, wave3) * smoothstep(0.3, 0.7, wave1);
  baseGradient = mix(baseGradient, color6, glow * 0.4);
  
  // Add soft luminous edges
  float edgeGlow = pow(1.0 - abs(uv.y - 0.5) * 2.0, 2.0) * wave2;
  baseGradient += color5 * edgeGlow * 0.2;
  
  // Subtle vignette
  float vignette = 1.0 - length((uv - 0.5) * 1.2) * 0.3;
  baseGradient *= vignette;
  
  gl_FragColor = vec4(baseGradient, 1.0);
}`;

interface GradientGridDistortionProps {
    grid?: number;
    mouse?: number;
    strength?: number;
    relaxation?: number;
    className?: string;
}

const GradientGridDistortion = ({
    grid = 15,
    mouse = 0.1,
    strength = 0.15,
    relaxation = 0.9,
    className = ''
}: GradientGridDistortionProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
    const planeRef = useRef<THREE.Mesh | null>(null);
    const animationIdRef = useRef<number | null>(null);
    const resizeObserverRef = useRef<ResizeObserver | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;

        const scene = new THREE.Scene();
        sceneRef.current = scene;

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        rendererRef.current = renderer;

        container.innerHTML = '';
        container.appendChild(renderer.domElement);

        const camera = new THREE.OrthographicCamera(0, 0, 0, 0, -1000, 1000);
        camera.position.z = 2;
        cameraRef.current = camera;

        const uniforms = {
            time: { value: 0 },
            resolution: { value: new THREE.Vector4() },
            uDataTexture: { value: null as THREE.DataTexture | null }
        };

        const size = grid;
        const data = new Float32Array(4 * size * size);
        for (let i = 0; i < size * size; i++) {
            data[i * 4] = Math.random() * 255 - 125;
            data[i * 4 + 1] = Math.random() * 255 - 125;
        }

        const dataTexture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.FloatType);
        dataTexture.needsUpdate = true;
        uniforms.uDataTexture.value = dataTexture;

        const material = new THREE.ShaderMaterial({
            side: THREE.DoubleSide,
            uniforms,
            vertexShader,
            fragmentShader,
            transparent: true
        });

        const geometry = new THREE.PlaneGeometry(1, 1, size - 1, size - 1);
        const plane = new THREE.Mesh(geometry, material);
        planeRef.current = plane;
        scene.add(plane);

        const handleResize = () => {
            if (!container || !renderer || !camera) return;

            const rect = container.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;

            if (width === 0 || height === 0) return;

            const containerAspect = width / height;

            renderer.setSize(width, height);

            if (plane) {
                plane.scale.set(containerAspect, 1, 1);
            }

            const frustumHeight = 1;
            const frustumWidth = frustumHeight * containerAspect;
            camera.left = -frustumWidth / 2;
            camera.right = frustumWidth / 2;
            camera.top = frustumHeight / 2;
            camera.bottom = -frustumHeight / 2;
            camera.updateProjectionMatrix();

            uniforms.resolution.value.set(width, height, 1, 1);
        };

        if (typeof window !== 'undefined' && window.ResizeObserver) {
            const resizeObserver = new ResizeObserver(() => {
                handleResize();
            });
            resizeObserver.observe(container);
            resizeObserverRef.current = resizeObserver;
        } else {
            window.addEventListener('resize', handleResize);
        }

        const mouseState = {
            x: 0,
            y: 0,
            prevX: 0,
            prevY: 0,
            vX: 0,
            vY: 0
        };

        const handleMouseMove = (e: MouseEvent) => {
            const rect = container.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = 1 - (e.clientY - rect.top) / rect.height;
            mouseState.vX = x - mouseState.prevX;
            mouseState.vY = y - mouseState.prevY;
            Object.assign(mouseState, { x, y, prevX: x, prevY: y });
        };

        const handleMouseLeave = () => {
            if (dataTexture) {
                dataTexture.needsUpdate = true;
            }
            Object.assign(mouseState, {
                x: 0,
                y: 0,
                prevX: 0,
                prevY: 0,
                vX: 0,
                vY: 0
            });
        };

        container.addEventListener('mousemove', handleMouseMove);
        container.addEventListener('mouseleave', handleMouseLeave);

        handleResize();

        const animate = () => {
            animationIdRef.current = requestAnimationFrame(animate);

            if (!renderer || !scene || !camera) return;

            uniforms.time.value += 0.05;

            const texData = dataTexture.image?.data;
            if (!texData) return;

            for (let i = 0; i < size * size; i++) {
                texData[i * 4] *= relaxation;
                texData[i * 4 + 1] *= relaxation;
            }

            const gridMouseX = size * mouseState.x;
            const gridMouseY = size * mouseState.y;
            const maxDist = size * mouse;

            for (let i = 0; i < size; i++) {
                for (let j = 0; j < size; j++) {
                    const distSq = Math.pow(gridMouseX - i, 2) + Math.pow(gridMouseY - j, 2);
                    if (distSq < maxDist * maxDist) {
                        const index = 4 * (i + size * j);
                        const power = Math.min(maxDist / Math.sqrt(distSq), 10);
                        texData[index] += strength * 100 * mouseState.vX * power;
                        texData[index + 1] -= strength * 100 * mouseState.vY * power;
                    }
                }
            }

            dataTexture.needsUpdate = true;
            renderer.render(scene, camera);
        };

        animate();

        return () => {
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current);
            }

            if (resizeObserverRef.current) {
                resizeObserverRef.current.disconnect();
            } else {
                window.removeEventListener('resize', handleResize);
            }

            container.removeEventListener('mousemove', handleMouseMove);
            container.removeEventListener('mouseleave', handleMouseLeave);

            if (renderer) {
                renderer.dispose();
                if (container.contains(renderer.domElement)) {
                    container.removeChild(renderer.domElement);
                }
            }

            if (geometry) geometry.dispose();
            if (material) material.dispose();
            if (dataTexture) dataTexture.dispose();

            sceneRef.current = null;
            rendererRef.current = null;
            cameraRef.current = null;
            planeRef.current = null;
        };
    }, [grid, mouse, strength, relaxation]);

    return (
        <div
            ref={containerRef}
            className={`relative overflow-hidden ${className}`}
            style={{
                width: '100%',
                height: '100%',
                minWidth: '0',
                minHeight: '0'
            }}
        />
    );
};

export default GradientGridDistortion;
