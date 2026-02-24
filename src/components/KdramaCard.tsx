'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Kdrama } from '@/lib/tmdb';
import { updateScore, toggleSeen, toggleFavorite, resetInteraction } from '@/lib/actions';
import { useRouter } from 'next/navigation';

interface InteractionStats {
    avgRating: number;
    seenCount: number;
    isFavorite?: boolean;
    score?: number;
    hasSeen?: boolean;
}

interface KdramaCardProps {
    drama: Kdrama;
    initialStats?: InteractionStats;
    onInteract?: () => void;
}

export default function KdramaCard({ drama, initialStats, onInteract }: KdramaCardProps) {
    const router = useRouter();
    const [rating, setRating] = useState(initialStats?.score || 0);
    const [seen, setSeen] = useState(initialStats?.hasSeen || false);
    const [isFavorite, setIsFavorite] = useState(initialStats?.isFavorite || false);
    const [loading, setLoading] = useState(false);

    // Sync state when props change
    useEffect(() => {
        if (initialStats) {
            setRating(initialStats.score || 0);
            setSeen(initialStats.hasSeen || false);
            setIsFavorite(initialStats.isFavorite || false);
        }
    }, [initialStats]);

    // Update rating state and save to DB
    const handleRating = async (newRating: number) => {
        setRating(newRating);
        setLoading(true);
        await updateScore(drama.id, newRating);
        setLoading(false);
        onInteract?.();
    };

    // Update seen state and save to DB
    const handleSeen = async () => {
        const newSeen = !seen;
        setSeen(newSeen);
        setLoading(true);
        await toggleSeen(drama.id);
        setLoading(false);
        onInteract?.();
    };

    // Reset all interactions for this card
    const handleReset = async () => {
        if (!confirm(`Reset all interactions for "${drama.name}"?`)) return;
        setLoading(true);
        // Optimistic UI reset
        setRating(0);
        setSeen(false);
        setIsFavorite(false);
        await resetInteraction(drama.id);
        setLoading(false);
        router.refresh();
        onInteract?.();
    };

    // Toggle favorite status
    const handleFavorite = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const newFavorite = !isFavorite;
        setIsFavorite(newFavorite);
        setLoading(true);
        await toggleFavorite(drama.id);
        setLoading(false);
        router.refresh();
        onInteract?.();
    };

    return (
        <article className="group relative overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:shadow-xl dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
            {/* Poster Image */}
            <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                <Link href={`/drama/${drama.id}`} className="absolute inset-0 z-0 overflow-hidden block">
                    <Image
                        src={drama.poster_path}
                        alt={`Poster for ${drama.name}`}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        unoptimized
                    />
                </Link>

                {/* Badges Overlay */}
                <div className="absolute top-2 left-2 flex flex-col gap-1.5 pointer-events-none z-10">
                    {seen && (
                        <div className="rounded-full bg-sage-500/90 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm border border-white/20">
                            Watched
                        </div>
                    )}
                    {initialStats && initialStats.seenCount > 0 && (
                        <div className="rounded-full bg-blue-600/80 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm border border-white/20 flex items-center gap-1">
                            {initialStats.seenCount} Seen
                        </div>
                    )}
                    {drama.watchProviders && drama.watchProviders.length > 0 && (
                        <div className="rounded-full bg-zinc-900/80 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm border border-white/20 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            {drama.watchProviders[0]}
                        </div>
                    )}
                </div>

                {/* Avg Rating Floating Badge */}
                {initialStats && initialStats.avgRating > 0 && (
                    <div className="absolute top-2 right-2 z-10 rounded-lg bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-2 py-1 text-[10px] font-bold text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-100 dark:border-zinc-800 flex items-center gap-1">
                        <StarIcon className="h-2.5 w-2.5 text-amber-500 fill-amber-500" />
                        {initialStats.avgRating.toFixed(1)}
                    </div>
                )}

                {/* Heart / Favorite Toggle Button */}
                <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-2">
                    <button
                        onClick={handleReset}
                        disabled={loading}
                        className="p-2.5 rounded-full bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm shadow-lg border border-zinc-100 dark:border-zinc-700 transition-all hover:scale-110 active:scale-95 text-zinc-400 hover:text-rose-600"
                        title="Reset all stats for this drama"
                    >
                        <ResetIcon className="h-4 w-4" />
                    </button>
                    <button
                        onClick={handleFavorite}
                        disabled={loading}
                        className="p-2.5 rounded-full bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm shadow-lg border border-zinc-100 dark:border-zinc-700 transition-all hover:scale-110 active:scale-95 group"
                        aria-label={initialStats?.isFavorite ? "Remove from favorites" : "Add to favorites"}
                    >
                        <HeartIcon
                            className={`h-5 w-5 transition-colors ${isFavorite
                                ? 'fill-rose-500 text-rose-500'
                                : 'text-zinc-400 group-hover:text-rose-400'
                                }`}
                        />
                    </button>
                </div>
            </div>

            {/* Info Content */}
            <div className="p-4 space-y-3">
                <Link href={`/drama/${drama.id}`} className="block group/title">
                    <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1 leading-snug group-hover/title:text-sage-600 transition-colors">
                        {drama.name}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {new Date(drama.first_air_date).getFullYear()} • {drama.watchProviders?.join(', ') || 'Various'}
                    </p>
                </Link>

                {/* Characters Section */}
                <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Cast</p>
                    <div className="flex -space-x-2">
                        {drama.characters?.map((char) => (
                            <div key={char.id} className="relative h-7 w-7 rounded-full border-2 border-white dark:border-zinc-900 overflow-hidden bg-zinc-100 shadow-sm" title={`${char.actorName}`}>
                                {char.profile_path ? (
                                    <Image
                                        src={char.profile_path}
                                        alt={char.actorName || "Actor profile"}
                                        fill
                                        className="object-cover"
                                        sizes="28px"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-[8px] font-bold text-zinc-400 bg-zinc-100">
                                        {char.actorName?.[0] || "?"}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Controls */}
                <div className="pt-3 border-t border-zinc-50 dark:border-zinc-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Seen?</span>
                        </div>
                        <button
                            onClick={handleSeen}
                            disabled={loading}
                            aria-label={seen ? "Mark as not seen" : "Mark as seen"}
                            className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors focus:outline-none ${seen ? 'bg-sage-600' : 'bg-zinc-200 dark:bg-zinc-700'
                                } ${loading ? 'opacity-50 cursor-wait' : ''}`}
                        >
                            <span
                                className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${seen ? 'translate-x-4' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Rate</span>
                        <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                                <button
                                    key={star}
                                    disabled={loading}
                                    onClick={() => handleRating(star)}
                                    aria-label={`Rate ${star} stars`}
                                    className={`transition-transform active:scale-90 ${loading ? 'opacity-50 cursor-wait' : ''}`}
                                >
                                    <StarIcon
                                        className={`h-3 w-3 ${star <= (rating || 0)
                                            ? 'fill-amber-400 text-amber-400'
                                            : 'text-zinc-200 dark:text-zinc-700'
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </article>
    );
}

function StarIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
        </svg>
    );
}

function HeartIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001Z" />
        </svg>
    );
}
function ResetIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
    );
}
