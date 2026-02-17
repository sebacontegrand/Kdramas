
export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { getTopRated, getInteractionStats } from '@/lib/actions';
import KdramaCard from '@/components/KdramaCard';
import ClearButton from '@/components/ClearButton';
import Link from 'next/link';

async function BestList() {
    const best = await getTopRated();

    if (best.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
                    <TrophyIcon className="h-10 w-10 text-amber-400" />
                </div>
                <h2 className="text-2xl font-bold text-sage-900 mb-2">Finding your gems...</h2>
                <p className="text-sage-600 mb-8 max-w-md">
                    Rate your favorite dramas 8/10 or higher to see them featured in this "Best" collection!
                </p>
                <Link
                    href="/"
                    className="px-6 py-3 bg-sage-600 hover:bg-sage-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-sage-200"
                >
                    Start Rating
                </Link>
            </div>
        );
    }

    const ids = best.map((d: any) => d.id);
    const stats = await getInteractionStats(ids);

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-8">
            {best.map((drama: any, index: number) => (
                <div key={`${drama.id}-${index}`} className="relative">
                    {index < 3 && (
                        <div className={`absolute -top-2 -left-2 z-10 w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white font-bold text-xs ${index === 0 ? 'bg-amber-400 text-amber-950' :
                            index === 1 ? 'bg-slate-300 text-slate-800' :
                                'bg-orange-400 text-orange-950'
                            }`}>
                            #{index + 1}
                        </div>
                    )}
                    <KdramaCard
                        drama={drama}
                        initialStats={stats.find((s: any) => s.tmdbId === drama.id)}
                    />
                </div>
            ))}
        </div>
    );
}

export default function BestPage() {
    return (
        <div className="min-h-screen bg-transparent">
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-sage-100/50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="p-2 hover:bg-sage-50 rounded-xl transition-colors">
                            <ArrowLeftIcon className="h-6 w-6 text-sage-600" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-sage-900 tracking-tight">My Best Gems</h1>
                            <p className="text-xs font-semibold text-amber-500 uppercase tracking-widest">
                                The Elite List
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <ClearButton type="best" />
                        <div className="w-[1px] h-6 bg-sage-100 hidden md:block" />
                        <Link href="/favorites" className="text-sm font-bold text-sage-600 hover:text-sage-700 transition-colors">
                            Favorites
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
                    <BestList />
                </Suspense>
            </main>
        </div>
    );
}

function TrophyIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.504-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.003 0V12m-9 0V4.875c0-.621.504-1.125 1.125-1.125h12.75c.621 0 1.125.504 1.125 1.125V12M12 12h.008v.008H12V12Z" />
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
