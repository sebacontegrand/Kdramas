'use client';

import { useState, useEffect, useRef, MouseEvent } from 'react';

interface OriginLandingProps {
    onSelect: (origin: string) => void;
}

interface Origin {
    id: string;
    name: string;
    icon: string;
    color: string;
}

function TiltCard({ origin, onClick }: { origin: Origin; onClick: (id: string) => void }) {
    const cardRef = useRef<HTMLButtonElement>(null);
    const [tilt, setTilt] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = (e: MouseEvent<HTMLButtonElement>) => {
        if (!cardRef.current) return;

        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -10; // Max 10 degrees tilt
        const rotateY = ((x - centerX) / centerX) * 10;

        setTilt({ x: rotateX, y: rotateY });
    };

    const handleMouseLeave = () => {
        setTilt({ x: 0, y: 0 });
        setIsHovered(false);
    };

    return (
        <button
            ref={cardRef}
            onClick={() => onClick(origin.id)}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
            style={{
                perspective: '1000px',
                transformStyle: 'preserve-3d',
                transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${isHovered ? 1.05 : 1})`,
                transition: isHovered ? 'none' : 'all 0.5s ease-out',
            }}
            className="group relative h-32 sm:h-48 rounded-2xl sm:rounded-[32px] overflow-hidden shadow-xl sm:shadow-2xl shadow-zinc-200/50 dark:shadow-none border border-white/80 dark:border-zinc-700/50 bg-white/30 dark:bg-zinc-800/30 backdrop-blur-sm"
        >
            <div className={`absolute inset-0 ${origin.color} opacity-20 group-hover:opacity-40 transition-opacity duration-500`} />

            {/* Shine effect */}
            {isHovered && (
                <div
                    className="absolute inset-0 pointer-events-none opacity-50"
                    style={{
                        background: `radial-gradient(circle at ${tilt.y * 10 + 50}% ${tilt.x * -10 + 50}%, rgba(255,255,255,0.4) 0%, transparent 60%)`,
                    }}
                />
            )}

            <div
                className="absolute inset-0 flex flex-col items-center justify-center p-4 sm:p-6"
                style={{ transform: 'translateZ(40px)', transformStyle: 'preserve-3d' }}
            >
                <span className="text-3xl sm:text-5xl mb-2 sm:mb-4 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3 drop-shadow-lg">
                    {origin.icon}
                </span>
                <span className="text-sm sm:text-lg font-bold text-zinc-800 dark:text-zinc-100 tracking-tight drop-shadow-md">
                    {origin.name}
                </span>
            </div>

            <div className="absolute inset-x-0 bottom-0 h-1 bg-sage-500 transition-all duration-500 transform translate-y-full group-hover:translate-y-0" />
        </button>
    );
}

export default function OriginLanding({ onSelect }: OriginLandingProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const origins: Origin[] = [
        { id: 'all', name: 'Worldwide', icon: '🌎', color: 'bg-zinc-100 dark:bg-zinc-800' },
        { id: 'KR', name: 'South Korea', icon: '🇰🇷', color: 'bg-sage-100 dark:bg-sage-900' },
        { id: 'CN', name: 'China', icon: '🇨🇳', color: 'bg-rose-100 dark:bg-rose-900' },
        { id: 'JP', name: 'Japan', icon: '🇯🇵', color: 'bg-blue-100 dark:bg-blue-900' },
    ];

    const handleSelect = (id: string) => {
        setIsVisible(false);
        setTimeout(() => onSelect(id), 600);
    };

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 transition-all duration-1000 ease-in-out overflow-hidden ${isVisible ? 'bg-white/40 dark:bg-black/40 backdrop-blur-2xl' : 'bg-transparent backdrop-blur-0 pointer-events-none opacity-0'}`}>
            <div className={`max-w-4xl w-full transition-all duration-700 transform ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-0 scale-95'}`}>
                <div className="text-center mb-8 sm:mb-12">
                    <div className="inline-block px-4 py-1.5 rounded-full bg-sage-100 dark:bg-sage-900/50 border border-sage-200 dark:border-sage-800 text-sage-600 dark:text-sage-400 font-bold text-[10px] uppercase tracking-widest mb-6 animate-bounce">
                        New Experience
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-zinc-900 dark:text-white tracking-tight leading-tight">
                        What tv shows do you <br />
                        <span className="text-sage-600 dark:text-sage-400 italic underline decoration-sage-300/50 decoration-4 underline-offset-8">want to discover?</span>
                    </h1>
                    <p className="mt-4 sm:mt-6 text-zinc-500 dark:text-zinc-400 font-medium text-sm sm:text-lg">
                        Select a preference to tailor your drama board.
                    </p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {origins.map((origin) => (
                        <TiltCard key={origin.id} origin={origin} onClick={handleSelect} />
                    ))}
                </div>
            </div>
        </div>
    );
}
