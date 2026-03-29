export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { getWatched, getInteractionStats } from '@/lib/actions';
import KdramaCard from '@/components/KdramaCard';
import ClearButton from '@/components/ClearButton';
import ListSearch from '@/components/ListSearch';
import Link from 'next/link';
import { Kdrama, InteractionStats } from '@/lib/tmdb';

async function WatchedList({ q }: { q: string }) {
    const watched = await getWatched();

    const filteredWatched = q
        ? watched.filter((d: Kdrama) => d.name.toLowerCase().includes(q.toLowerCase()))
        : watched;

    if (filteredWatched.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-sage-50 rounded-full flex items-center justify-center mb-6">
                    <CheckIcon className="h-10 w-10 text-sage-300" />
                </div>
                <h2 className="text-2xl font-bold text-sage-900 mb-2">No watched dramas found</h2>
                <p className="text-sage-600 mb-8 max-w-md">
                    {q ? `No watched dramas matching "${q}".` : 'Keep track of your journey! Toggle the "Seen?" switch on any drama to add it here.'}
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

    const ids = filteredWatched.map((d: Kdrama) => d.id);
    const stats = await getInteractionStats(ids);

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6 md:gap-8">
            {filteredWatched.map((drama: Kdrama, index: number) => (
                <KdramaCard
                    key={`${drama.id}-${index}`}
                    drama={drama}
                    initialStats={stats.find((s: InteractionStats) => s.tmdbId === drama.id)}
                />
            ))}
        </div>
    );
}

export default async function WatchedPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
    const resolvedParams = await searchParams;
    const q = resolvedParams.q || '';

    return (
        <div className="min-h-screen bg-transparent">
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-sage-100/50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-[150px]">
                        <Link href="/" className="p-2 hover:bg-sage-50 rounded-xl transition-colors shrink-0">
                            <ArrowLeftIcon className="h-6 w-6 text-sage-600" />
                        </Link>
                        <div className="hidden sm:block">
                            <h1 className="text-xl font-bold text-sage-900 tracking-tight whitespace-nowrap">Watched History</h1>
                            <p className="text-xs font-semibold text-sage-500 uppercase tracking-widest whitespace-nowrap">
                                Your Journey
                            </p>
                        </div>
                    </div>

                    <ListSearch />

                    <div className="flex items-center gap-4 flex-shrink-0">
                        <ClearButton type="watched" />
                        <div className="w-[1px] h-6 bg-sage-100 hidden md:block" />
                        <Link href="/best" className="hidden sm:block text-sm font-bold text-sage-600 hover:text-sage-700 transition-colors">
                            Best
                        </Link>
                        <Link href="/favorites" className="hidden sm:block text-sm font-bold text-sage-600 hover:text-sage-700 transition-colors">
                            Favorites
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12 md:px-12">
                <Suspense key={q} fallback={<div className="animate-pulse grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6 md:gap-8 overflow-hidden">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="aspect-[2/3] bg-sage-100 rounded-2xl" />
                    ))}
                </div>}>
                    <WatchedList q={q} />
                </Suspense>
            </main>
        </div>
    );
}

function CheckIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
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
