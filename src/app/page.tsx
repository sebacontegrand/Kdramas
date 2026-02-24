'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getKdramas, getInteractionStats, searchKdramasAction } from '@/lib/actions';
import { Kdrama } from '@/lib/tmdb';
import KdramaCard from '@/components/KdramaCard';
import Link from 'next/link';
import OriginLanding from '@/components/OriginLanding';

type SortOption = 'default' | 'popularity' | 'latest' | 'oldest' | 'rating-highest' | 'rating-lowest';

export default function Home() {
  const [kdramas, setKdramas] = useState<Kdrama[]>([]);
  const [interactionStats, setInteractionStats] = useState<Record<number, { avgRating: number, seenCount: number, isFavorite?: boolean, score?: number, hasSeen?: boolean }>>({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const isLoadingRef = useRef(false);
  const [hasMore, setHasMore] = useState(true);
  const hasMoreRef = useRef(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedActor, setSelectedActor] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [originCountry, setOriginCountry] = useState('KR');
  const [allActors, setAllActors] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if onboarding was already shown this session
  useEffect(() => {
    const hasOnboarded = sessionStorage.getItem('has_onboarded');
    if (!hasOnboarded) {
      setShowOnboarding(true);
    }
  }, []);

  const handleOriginSelect = (origin: string) => {
    setOriginCountry(origin);
    setShowOnboarding(false);
    sessionStorage.setItem('has_onboarded', 'true');
  };

  const refreshStats = useCallback(async (ids: number[]) => {
    if (ids.length === 0) return;
    const stats = await getInteractionStats(ids);
    const statsMap: Record<number, any> = {};
    stats.forEach(s => {
      statsMap[s.tmdbId] = s;
    });
    setInteractionStats(prev => ({ ...prev, ...statsMap }));
  }, []);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoadingRef.current || !hasMoreRef.current) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMoreRef.current && !isLoadingRef.current) {
        setPage(prev => prev + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, []);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Reset when origin or search changes
  useEffect(() => {
    setPage(1);
    setKdramas([]);
    setHasMore(true);
    hasMoreRef.current = true;
  }, [originCountry, debouncedSearchTerm]);

  useEffect(() => {
    async function loadData() {
      if (isLoadingRef.current || !hasMoreRef.current) return;

      setLoading(true);
      isLoadingRef.current = true;

      // If there is a debounced search term, use searchKdramasAction.
      // Note: TMDB search endpoint doesn't support with_origin_country out of the box in the same way,
      // but we will apply the search action.
      let data: Kdrama[] = [];
      if (debouncedSearchTerm.trim() !== '') {
        data = await searchKdramasAction(debouncedSearchTerm, page);
        // We can optionally filter searched data further locally by originCountry if needed, 
        // but typically TMDB search ignores it.
      } else {
        data = await getKdramas(page, originCountry);
      }

      if (data.length === 0) {
        setHasMore(false);
        hasMoreRef.current = false;
        setLoading(false);
        isLoadingRef.current = false;
        return;
      }

      const newIds = data.map(d => d.id);
      await refreshStats(newIds);

      setKdramas(prev => {
        // If it's a new search or new origin, prev should be empty due to previous useEffect,
        // but just in case, we append.
        const newData = page === 1 ? data : [...prev, ...data];
        const uniqueData = Array.from(new Map(newData.map(item => [item.id, item])).values());

        const actors = new Set<string>();
        uniqueData.forEach(d => d.characters?.forEach((c: { actorName: string }) => actors.add(c.actorName)));
        setAllActors(Array.from(actors).sort());

        return uniqueData;
      });

      if (data.length < 10) {
        setHasMore(false);
        hasMoreRef.current = false;
      }

      setLoading(false);
      isLoadingRef.current = false;
    }
    loadData();
  }, [page, originCountry, debouncedSearchTerm, refreshStats]);

  const sortedAndFilteredDramas = kdramas
    .filter(drama => {
      // We removed the local search filter here because we are fetching search results from server.
      const matchesActor = !selectedActor || drama.characters?.some((c: { actorName: string }) => c.actorName === selectedActor);
      return matchesActor;
    })
    .sort((a, b) => {
      if (sortBy === 'default') return 0;
      if (sortBy === 'popularity') return (b.popularity || 0) - (a.popularity || 0);
      if (sortBy === 'latest') return new Date(b.first_air_date).getTime() - new Date(a.first_air_date).getTime();
      if (sortBy === 'oldest') return new Date(a.first_air_date).getTime() - new Date(b.first_air_date).getTime();

      const statA = interactionStats[a.id] || { avgRating: 0 };
      const statB = interactionStats[b.id] || { avgRating: 0 };
      if (sortBy === 'rating-highest') return (statB.avgRating || 0) - (statA.avgRating || 0);
      if (sortBy === 'rating-lowest') return (statA.avgRating || 0) - (statB.avgRating || 0);

      return 0;
    });

  return (
    <div className="min-h-screen bg-transparent transition-colors duration-500">
      {showOnboarding && <OriginLanding onSelect={handleOriginSelect} />}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-sage-100/50 px-6 py-6 md:px-12">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-black text-rose-600 tracking-tighter transition-all duration-300 hover:scale-[1.02] cursor-default drop-shadow-sm">
                  KDRAMA FEVER
                </h1>
                <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-white bg-rose-500 px-2 py-0.5 rounded-full flex items-center gap-1.5 shadow-sm">
                  🇦🇷 AR EDITION
                </span>
                <p className="text-sm text-sage-600 font-bold italic">
                  Your Ultimate Hallyu Vault • Community Hot Takes • Global Tracking
                </p>
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-3 mt-4">
                <Link
                  href="/favorites"
                  className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-sm font-bold border border-rose-100/50 hover:bg-rose-100 transition-colors"
                >
                  <HeartIcon className="h-4 w-4 fill-rose-500" />
                  Favorites
                </Link>
                <Link
                  href="/watched"
                  className="flex items-center gap-2 px-4 py-2 bg-sage-50 text-sage-600 rounded-xl text-sm font-bold border border-sage-100/50 hover:bg-sage-100 transition-colors"
                >
                  <CheckIcon className="h-4 w-4 text-sage-500" />
                  Watched
                </Link>
                <Link
                  href="/best"
                  className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-xl text-sm font-bold border border-amber-100/50 hover:bg-amber-100 transition-colors"
                >
                  <TrophyIcon className="h-4 w-4 text-amber-500" />
                  Best
                </Link>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 bg-sage-100 text-sage-700 rounded-xl text-sm font-bold sm:hidden"
                >
                  <SearchIcon className="h-4 w-4" />
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </button>
              </div>
            </div>

            <div className={`${showFilters ? 'grid' : 'hidden'} sm:grid sm:grid-cols-2 xl:grid-cols-4 gap-3 animate-in fade-in slide-in-from-top-2 duration-300`}>
              {/* Origin Country */}
              <div className="relative group">
                <select
                  value={originCountry}
                  onChange={(e) => setOriginCountry(e.target.value)}
                  aria-label="Filter by origin country"
                  className="w-full px-4 py-2.5 bg-sage-100/30 border border-transparent rounded-2xl text-sm focus:outline-none focus:bg-white focus:border-sage-200 transition-all font-medium appearance-none cursor-pointer pr-10"
                >
                  <option value="KR">🇰🇷 Korean</option>
                  <option value="JP">🇯🇵 Japanese</option>
                  <option value="CN">🇨🇳 Chinese</option>
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                  <ChevronDownIcon className="h-4 w-4 text-sage-400" />
                </div>
              </div>

              {/* Search */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <SearchIcon className="h-4 w-4 text-sage-400 group-focus-within:text-sage-600 transition-colors" />
                </div>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Search dramas"
                  className="w-full pl-11 pr-4 py-2.5 bg-sage-100/30 border border-transparent rounded-2xl text-sm focus:outline-none focus:bg-white focus:border-sage-200 focus:ring-4 focus:ring-sage-100 transition-all font-medium"
                />
              </div>

              {/* Actor Filter */}
              <div className="relative group">
                <select
                  value={selectedActor}
                  onChange={(e) => setSelectedActor(e.target.value)}
                  aria-label="Filter by actor"
                  className="w-full px-4 py-2.5 bg-sage-100/30 border border-transparent rounded-2xl text-sm focus:outline-none focus:bg-white focus:border-sage-200 transition-all font-medium appearance-none cursor-pointer pr-10"
                >
                  <option value="">All Actors</option>
                  {allActors.map(actor => (
                    <option key={actor} value={actor}>{actor}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                  <ChevronDownIcon className="h-4 w-4 text-sage-400" />
                </div>
              </div>

              {/* Sort By */}
              <div className="relative group sm:col-span-2 xl:col-span-1">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  aria-label="Sort options"
                  className="w-full px-4 py-2.5 bg-sage-100/30 border border-transparent rounded-2xl text-sm focus:outline-none focus:bg-white focus:border-sage-200 transition-all font-medium appearance-none cursor-pointer pr-10"
                >
                  <option value="default">Default (Featured)</option>
                  <option value="popularity">TMDB Popularity</option>
                  <option value="rating-highest">Highest Community Rating</option>
                  <option value="rating-lowest">Lowest Community Rating</option>
                  <option value="latest">Latest Released</option>
                  <option value="oldest">Oldest Released</option>
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                  <ChevronDownIcon className="h-4 w-4 text-sage-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 md:px-12">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6 md:gap-8">
          {sortedAndFilteredDramas.map((drama, index) => (
            <div
              key={`${drama.id}-${index}`}
              ref={index === sortedAndFilteredDramas.length - 1 ? lastElementRef : null}
              className="animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: `${(index % 10) * 50}ms` }}
            >
              <KdramaCard
                drama={drama}
                initialStats={interactionStats[drama.id]}
                onInteract={() => refreshStats([drama.id])}
              />
            </div>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-16">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 border-4 border-sage-100 rounded-full" />
              <div className="absolute inset-0 border-4 border-sage-600 rounded-full border-t-transparent animate-spin" />
            </div>
          </div>
        )}

        {!loading && sortedAndFilteredDramas.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="bg-sage-100/50 p-6 rounded-full mb-6">
              <KdramaIcon className="h-12 w-12 text-sage-400" />
            </div>
            <h3 className="text-xl font-semibold text-zinc-900 font-serif">Empty Hearts</h3>
            <p className="text-zinc-500 max-w-xs mt-2 text-sm leading-relaxed">
              We couldn't find any dramas matching your search or filters. Try reset or explore more.
            </p>
            <button
              onClick={() => { setSearchTerm(''); setSelectedActor(''); setSortBy('default'); }}
              className="mt-6 text-sm font-bold text-sage-600 hover:text-sage-700 underline underline-offset-4"
            >
              Clear all filters
            </button>
          </div>
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-12 py-16 border-t border-sage-100 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sage-300">
          Powered by TMDB API • Regional Content Argentina
        </p>
        <p className="text-[10px] text-zinc-400 mt-2">© {new Date().getFullYear()} K-Rating App</p>
      </footer>
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function KdramaIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125Z" />
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

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.504-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.003 0V12m-9 0V4.875c0-.621.504-1.125 1.125-1.125h12.75c.621 0 1.125.504 1.125 1.125V12M12 12h.008v.008H12V12Z" />
    </svg>
  );
}
