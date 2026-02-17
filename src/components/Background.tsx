'use client';

export default function Background() {
    return (
        <div className="fixed inset-0 -z-10 overflow-hidden bg-background pointer-events-none">
            {/* Animated Blobs */}
            <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] bg-sage-200/40 rounded-full blur-[120px] animate-blob" />
            <div className="absolute top-[10%] right-[-5%] w-[45%] h-[45%] bg-rose-100/30 rounded-full blur-[100px] animate-blob animation-delay-2000" />
            <div className="absolute bottom-[-10%] left-[10%] w-[55%] h-[55%] bg-blue-50/40 rounded-full blur-[110px] animate-blob animation-delay-4000" />
            <div className="absolute bottom-[20%] right-[10%] w-[40%] h-[40%] bg-sage-100/30 rounded-full blur-[90px] animate-blob" />

            {/* Grain Overlay */}
            <div className="absolute inset-0 bg-grain mix-blend-overlay" />

            {/* Soft Net Gradient */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-white/10" />
        </div>
    );
}
