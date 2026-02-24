'use client';

import { useState } from 'react';
import { updateScore, toggleSeen, toggleFavorite } from '@/lib/actions';
import { useRouter } from 'next/navigation';

interface InteractionStats {
    avgRating: number;
    seenCount: number;
    isFavorite?: boolean;
    score?: number;
    hasSeen?: boolean;
}

interface KdramaDetailClientProps {
    dramaId: number;
    initialStats: InteractionStats;
}

export default function KdramaDetailClient({ dramaId, initialStats }: KdramaDetailClientProps) {
    const router = useRouter();
    const [rating, setRating] = useState(initialStats?.score || 0);
    const [seen, setSeen] = useState(initialStats?.hasSeen || false);
    const [isFavorite, setIsFavorite] = useState(initialStats?.isFavorite || false);
    const [loading, setLoading] = useState(false);

    const handleRating = async (newRating: number) => {
        setRating(newRating);
        setLoading(true);
        await updateScore(dramaId, newRating);
        setLoading(false);
        router.refresh();
    };

    const handleSeen = async () => {
        const newSeen = !seen;
        setSeen(newSeen);
        setLoading(true);
        await toggleSeen(dramaId);
        setLoading(false);
        router.refresh();
    };

    const handleFavorite = async () => {
        const newFavorite = !isFavorite;
        setIsFavorite(newFavorite);
        setLoading(true);
        await toggleFavorite(dramaId);
        setLoading(false);
        router.refresh();
    };

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-xl border border-zinc-200 dark:border-zinc-800 space-y-6">
            <button
                onClick={handleFavorite}
                disabled={loading}
                className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-sm ${isFavorite
                        ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 dark:bg-rose-950/30 dark:border-rose-900 dark:hover:bg-rose-950/50'
                        : 'bg-zinc-50 text-zinc-600 border border-zinc-200 hover:bg-zinc-100 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-700'
                    } ${loading ? 'opacity-50 cursor-wait' : ''}`}
            >
                <HeartIcon className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
                {isFavorite ? 'In Favorites' : 'Add to Favorites'}
            </button>

            <div className="space-y-4 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Mark as Seen</span>
                    <button
                        onClick={handleSeen}
                        disabled={loading}
                        aria-label={seen ? "Mark as not seen" : "Mark as seen"}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-sage-500 focus:ring-offset-2 ${seen ? 'bg-sage-600' : 'bg-zinc-200 dark:bg-zinc-700'
                            } ${loading ? 'opacity-50 cursor-wait' : ''}`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${seen ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Your Rating</span>
                        <span className="text-sm font-bold text-amber-500">{rating > 0 ? `${rating}/10` : '-'}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 justify-between">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                            <button
                                key={star}
                                disabled={loading}
                                onClick={() => handleRating(star)}
                                aria-label={`Rate ${star} stars`}
                                className={`transition-transform hover:scale-110 active:scale-90 ${loading ? 'opacity-50 cursor-wait' : ''}`}
                            >
                                <StarIcon
                                    className={`h-5 w-5 ${star <= rating
                                            ? 'fill-amber-400 text-amber-400'
                                            : 'text-zinc-200 dark:text-zinc-700 hover:text-amber-200 dark:hover:text-amber-900/50'
                                        }`}
                                />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function HeartIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
        </svg>
    );
}

function StarIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.536a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
        </svg>
    );
}
