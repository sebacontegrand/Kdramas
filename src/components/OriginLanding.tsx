'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';

interface OriginLandingProps {
    onSelect: (origin: string) => void;
}

interface Origin {
    id: string;
    name: string;
    icon: string;
    color: string;
}

// --- Three.js Liquid Background Component ---
function LiquidBackground() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        let renderer: THREE.WebGLRenderer;
        try {
            renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        } catch (e) {
            console.warn("WebGL not supported, falling back to static background.");
            return;
        }

        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        containerRef.current.appendChild(renderer.domElement);

        // Create a moving wave mesh
        const geometry = new THREE.PlaneGeometry(20, 20, 64, 64);
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uMouse: { value: new THREE.Vector2(0, 0) },
                uColor: { value: new THREE.Color('#637d6e') } // Sage color
            },
            vertexShader: `
                uniform float uTime;
                uniform vec2 uMouse;
                varying vec2 vUv;
                varying float vElevation;

                void main() {
                    vUv = uv;
                    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
                    
                    float elevation = sin(modelPosition.x * 0.5 + uTime * 0.5) * 
                                     sin(modelPosition.z * 0.5 + uTime * 0.5) * 0.5;
                    
                    // Mouse interaction
                    float distance = length(modelPosition.xy - uMouse);
                    elevation += exp(-distance * 2.0) * 0.5;

                    modelPosition.z += elevation;
                    vElevation = elevation;

                    gl_Position = projectionMatrix * viewMatrix * modelPosition;
                }
            `,
            fragmentShader: `
                uniform vec3 uColor;
                varying vec2 vUv;
                varying float vElevation;

                void main() {
                    float alpha = mix(0.1, 0.3, vElevation + 0.5);
                    gl_FragColor = vec4(uColor, alpha);
                }
            `,
            transparent: true,
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2.5;
        scene.add(mesh);

        camera.position.z = 5;

        let mouse = new THREE.Vector2(0, 0);
        const handleMouseMove = (e: MouseEvent) => {
            mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        };

        window.addEventListener('mousemove', handleMouseMove);

        const animate = () => {
            const time = performance.now() * 0.001;
            material.uniforms.uTime.value = time;
            material.uniforms.uMouse.value.lerp(mouse, 0.05);
            renderer.render(scene, camera);
            requestAnimationFrame(animate);
        };

        animate();

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', handleResize);
            containerRef.current?.removeChild(renderer.domElement);
            geometry.dispose();
            material.dispose();
        };
    }, []);

    return <div ref={containerRef} className="absolute inset-0 -z-10 pointer-events-none opacity-40 dark:opacity-20" />;
}

// --- Enhanced Magnetic Card ---
function TiltCard({ origin, onClick }: { origin: Origin; onClick: (id: string) => void }) {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const springConfig = { damping: 20, stiffness: 300 };
    const rotateX = useSpring(useTransform(mouseY, [-100, 100], [15, -15]), springConfig);
    const rotateY = useSpring(useTransform(mouseX, [-100, 100], [-15, 15]), springConfig);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseXRelative = e.clientX - rect.left - width / 2;
        const mouseYRelative = e.clientY - rect.top - height / 2;

        mouseX.set(mouseXRelative);
        mouseY.set(mouseYRelative);
    };

    const handleMouseLeave = () => {
        mouseX.set(0);
        mouseY.set(0);
    };

    return (
        <motion.div
            style={{
                perspective: 1200,
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="group relative"
        >
            <motion.button
                onClick={() => onClick(origin.id)}
                style={{
                    rotateX,
                    rotateY,
                    transformStyle: 'preserve-3d',
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative w-full h-32 sm:h-48 rounded-[32px] overflow-hidden shadow-2xl border border-white/20 dark:border-white/10 bg-white/10 dark:bg-zinc-900/40 backdrop-blur-md transition-shadow hover:shadow-sage-500/20"
            >
                {/* Dynamic Background Layer */}
                <div className={`absolute inset-0 ${origin.color} opacity-10 group-hover:opacity-30 transition-opacity duration-700`} />

                {/* Parallax Content Layer - Icon */}
                <div
                    className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                    style={{ transform: 'translateZ(60px)', transformStyle: 'preserve-3d' }}
                >
                    <motion.span
                        className="text-4xl sm:text-6xl mb-2 drop-shadow-[0_10px_10px_rgba(0,0,0,0.3)]"
                    >
                        {origin.icon}
                    </motion.span>
                </div>

                {/* Parallax Content Layer - Text */}
                <div
                    className="absolute inset-0 flex flex-col items-center justify-end pb-6 sm:pb-8 pointer-events-none"
                    style={{ transform: 'translateZ(30px)', transformStyle: 'preserve-3d' }}
                >
                    <span className="text-sm sm:text-lg font-black text-zinc-800 dark:text-white tracking-widest uppercase">
                        {origin.name}
                    </span>
                </div>

                {/* Glass Shine */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none"
                    style={{
                        transform: 'translateZ(100px)',
                    }}
                />

                <div className="absolute inset-x-0 bottom-0 h-1.5 bg-sage-500 transform translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            </motion.button>
        </motion.div>
    );
}

export default function OriginLanding({ onSelect }: OriginLandingProps) {
    const [isVisible, setIsVisible] = useState(false);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const smoothMouseX = useSpring(mouseX, { damping: 50, stiffness: 200 });
    const smoothMouseY = useSpring(mouseY, { damping: 50, stiffness: 200 });

    const glowBackground = useTransform(
        [smoothMouseX, smoothMouseY],
        ([x, y]) => `radial-gradient(600px circle at ${x}px ${y}px, rgba(99, 125, 110, 0.4), transparent 80%)`
    );

    useEffect(() => {
        setIsVisible(true);
        const handleGlobalMouseMove = (e: MouseEvent) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };
        window.addEventListener('mousemove', handleGlobalMouseMove);
        return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
    }, []);

    const origins: Origin[] = useMemo(() => [
        { id: 'all', name: 'Worldwide', icon: '🌎', color: 'bg-zinc-100 dark:bg-zinc-800' },
        { id: 'KR', name: 'South Korea', icon: '🇰🇷', color: 'bg-sage-100 dark:bg-sage-900' },
        { id: 'CN', name: 'China', icon: '🇨🇳', color: 'bg-rose-100 dark:bg-rose-900' },
        { id: 'JP', name: 'Japan', icon: '🇯🇵', color: 'bg-blue-100 dark:bg-blue-900' },
    ], []);

    const handleSelect = (id: string) => {
        setIsVisible(false);
        setTimeout(() => onSelect(id), 600);
    };

    return (
        <AnimatePresence mode="wait">
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-white/20 dark:bg-black/40 backdrop-blur-xl"
                >
                    <LiquidBackground />

                    {/* Global Glow Effect */}
                    <motion.div
                        className="pointer-events-none fixed inset-0 z-10 opacity-30 dark:opacity-20"
                        style={{
                            background: glowBackground
                        }}
                    />

                    <div className="max-w-5xl w-full z-20">
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
                            className="text-center mb-12 sm:mb-20"
                        >
                            <div className="inline-block px-5 py-2 rounded-full bg-sage-500/10 border border-sage-500/20 text-sage-600 dark:text-sage-400 font-black text-[10px] uppercase tracking-[0.3em] mb-8">
                                Interactive Discovery
                            </div>
                            <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-zinc-900 dark:text-white tracking-tighter leading-[0.9] mb-8">
                                Deep <br />
                                <span className="text-sage-600 dark:text-sage-400 italic font-serif">Dimensions</span>
                            </h1>
                            <p className="text-zinc-500 dark:text-zinc-400 font-medium text-lg sm:text-xl max-w-xl mx-auto">
                                Step into a new realm of television. Choose your origin to begin the journey.
                            </p>
                        </motion.div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 px-4">
                            {origins.map((origin) => (
                                <TiltCard key={origin.id} origin={origin} onClick={handleSelect} />
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
