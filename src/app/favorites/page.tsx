
export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { getFavorites, getInteractionStats } from '@/lib/actions';
import KdramaCard from '@/components/KdramaCard';
import ClearButton from '@/components/ClearButton';
import Link from 'next/link';

async function FavoritesList() {
    const favorites = await getFavorites();

    if (favorites.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-sage-50 rounded-full flex items-center justify-center mb-6">
                    <HeartIcon className="h-10 w-10 text-sage-300" />
                </div>
                <h2 className="text-2xl font-bold text-sage-900 mb-2">No favorites yet</h2>
                <p className="text-sage-600 mb-8 max-w-md">
                    Start exploring and click the heart icon on any K-drama to save it here for later!
                </p>
                <Link
                    href="/"
                    className="px-6 py-3 bg-sage-600 hover:bg-sage-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-sage-200"
                >
                    Explore Dramas
                </Link>
            </div>
        );
    }

    const ids = favorites.map((d: any) => d.id);
    const stats = await getInteractionStats(ids);

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-8">
            {favorites.map((drama: any, index: number) => (
                <KdramaCard
                    key={`${drama.id}-${index}`}
                    drama={drama}
                    initialStats={stats.find((s: any) => s.tmdbId === drama.id)}
                />
            ))}
        </div>
    );
}

export default function FavoritesPage() {
    return (
        <div className="min-h-screen bg-transparent selection:bg-sage-100 italic-selection">
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-sage-100/50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="p-2 hover:bg-sage-50 rounded-xl transition-colors">
                            <ArrowLeftIcon className="h-6 w-6 text-sage-600" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-sage-900 tracking-tight">Your Favorites</h1>
                            <p className="text-xs font-semibold text-sage-500 uppercase tracking-widest">
                                Collection
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <ClearButton type="favorites" />
                        <div className="w-[1px] h-6 bg-sage-100 hidden md:block" />
                        <Link href="/best" className="text-sm font-bold text-sage-600 hover:text-sage-700 transition-colors">
                            Best
                        </Link>
                        <Link href="/watched" className="text-sm font-bold text-sage-600 hover:text-sage-700 transition-colors">
                            Watched
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12 md:px-12">
                <Suspense fallback={<div className="animate-pulse grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-8 overflow-hidden">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="aspect-[2/3] bg-sage-100 rounded-2xl" />
                    ))}
                </div>}>
                    <FavoritesList />
                </Suspense>
            </main>
        </div>
    );
}

function HeartIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001Z" />
        </svg>
    );
}

function ArrowLeftIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
    );
}
