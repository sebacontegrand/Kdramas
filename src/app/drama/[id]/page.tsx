import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { fetchKdramaById } from '@/lib/tmdb';
import { getInteractionStats, updateScore, toggleSeen, toggleFavorite } from '@/lib/actions';
import KdramaDetailClient from './KdramaDetailClient';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function DramaDetailPage({ params }: PageProps) {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const kdramaId = parseInt(id, 10);

    if (isNaN(kdramaId)) {
        notFound();
    }

    const drama = await fetchKdramaById(kdramaId);

    if (!drama) {
        notFound();
    }

    const statsArray = await getInteractionStats([kdramaId]);
    const initialStats = statsArray[0] || { score: 0, hasSeen: false, isFavorite: false, avgRating: 0, seenCount: 0 };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">
            {/* Backdrop Header */}
            <div className="relative w-full h-[50vh] md:h-[60vh] bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                {drama.backdrop_path ? (
                    <Image
                        src={drama.backdrop_path}
                        alt={`Backdrop for ${drama.name}`}
                        fill
                        className="object-cover opacity-60"
                        priority
                        unoptimized
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-sage-900 to-zinc-900 opacity-60" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-50 via-zinc-50/50 to-transparent dark:from-zinc-950 dark:via-zinc-950/50" />

                {/* Back Button */}
                <div className="absolute top-6 left-6 z-20">
                    <Link href="/" className="inline-flex items-center justify-center p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition-all border border-white/10 shadow-lg">
                        <ArrowLeftIcon className="h-5 w-5" />
                    </Link>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 md:px-12 -mt-32 md:-mt-48 relative z-10">
                <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
                    {/* Left Column: Poster & Actions */}
                    <div className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0">
                        <div className="sticky top-24 space-y-6">
                            <div className="aspect-[2/3] w-full max-w-[240px] md:max-w-none mx-auto relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 dark:border-zinc-800 bg-zinc-800">
                                <Image
                                    src={drama.poster_path}
                                    alt={`Poster for ${drama.name}`}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 33vw"
                                    className="object-cover"
                                    priority
                                    unoptimized
                                />
                            </div>

                            {/* Client Component for Interactions */}
                            <KdramaDetailClient
                                dramaId={drama.id}
                                initialStats={initialStats}
                            />
                        </div>
                    </div>

                    {/* Right Column: Details */}
                    <div className="flex-1 pb-12">
                        <div className="space-y-6">
                            <div>
                                <h1 className="text-3xl md:text-5xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight">
                                    {drama.name}
                                </h1>
                                <p className="text-sm md:text-base text-zinc-500 dark:text-zinc-400 mt-2 font-medium">
                                    {new Date(drama.first_air_date).getFullYear()} • {drama.origin_country[0]}
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 md:gap-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                                {/* TMDB Score */}
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 font-bold border border-green-500/20">
                                        {(drama.vote_average * 10).toFixed(0)}<span className="text-[10px]">%</span>
                                    </div>
                                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">TMDB Score</span>
                                </div>
                                <div className="w-[1px] h-8 bg-zinc-200 dark:bg-zinc-800 hidden md:block" />

                                {/* Community Score */}
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20">
                                        <StarIcon className="h-4 w-4 mr-0.5" />
                                        {initialStats.avgRating > 0 ? initialStats.avgRating.toFixed(1) : '-'}
                                    </div>
                                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Community</span>
                                </div>
                                <div className="w-[1px] h-8 bg-zinc-200 dark:bg-zinc-800 hidden md:block" />

                                {/* Seasons & Episodes */}
                                <div className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-900 px-4 py-2 rounded-xl">
                                    <span>{drama.number_of_seasons} Season{drama.number_of_seasons !== 1 ? 's' : ''}</span>
                                    <span className="text-zinc-400 px-1">•</span>
                                    <span>{drama.number_of_episodes} Episodes</span>
                                </div>
                            </div>

                            <div className="pt-6">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-3">Overview</h3>
                                <p className="text-base text-zinc-700 dark:text-zinc-300 leading-relaxed max-w-3xl">
                                    {drama.overview || 'No overview available.'}
                                </p>
                            </div>

                            {/* Trailer */}
                            {drama.trailerKey && (
                                <div className="pt-8">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4">Official Trailer</h3>
                                    <div className="relative aspect-video w-full max-w-3xl rounded-2xl overflow-hidden shadow-lg border border-zinc-200 dark:border-zinc-800 bg-black">
                                        <iframe
                                            src={`https://www.youtube.com/embed/${drama.trailerKey}?autoplay=0&rel=0`}
                                            title="YouTube video player"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            className="absolute inset-0 w-full h-full"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Cast */}
                            {drama.characters && drama.characters.length > 0 && (
                                <div className="pt-8">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4">Series Cast</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                        {drama.characters.map((char) => (
                                            <div key={char.id} className="flex flex-col gap-2 group">
                                                <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm transition-transform group-hover:scale-105">
                                                    {char.profile_path ? (
                                                        <Image
                                                            src={char.profile_path}
                                                            alt={char.actorName || char.name}
                                                            fill
                                                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                                                            className="object-cover"
                                                            unoptimized
                                                        />
                                                    ) : (
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <UserIcon className="h-12 w-12 text-zinc-300 dark:text-zinc-700" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 leading-tight">
                                                        {char.actorName}
                                                    </p>
                                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-tight mt-0.5">
                                                        {char.name}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function ArrowLeftIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
    );
}

function StarIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
        </svg>
    );
}

function UserIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
    );
}
