'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getKdramas, getInteractionStats } from '@/lib/actions';
import { Kdrama } from '@/lib/tmdb';
import KdramaCard from '@/components/KdramaCard';

type SortOption = 'popularity' | 'latest' | 'oldest' | 'rating-highest' | 'rating-lowest';

export default function Home() {
  const [kdramas, setKdramas] = useState<Kdrama[]>([]);
  const [interactionStats, setInteractionStats] = useState<Record<number, { avgRating: number, seenCount: number }>>({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedActor, setSelectedActor] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('popularity');
  const [originCountry, setOriginCountry] = useState('KR');
  const [allActors, setAllActors] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const refreshStats = useCallback(async (ids: number[]) => {
    const stats = await getInteractionStats(ids);
    const statsMap: Record<number, { avgRating: number, seenCount: number }> = {};
    stats.forEach(s => {
      statsMap[s.tmdbId] = { avgRating: s.avgRating, seenCount: s.seenCount };
    });
    setInteractionStats(prev => ({ ...prev, ...statsMap }));
  }, []);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setPage(prev => prev + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading]);

  // Reset when origin changes
  useEffect(() => {
    setPage(1);
    setKdramas([]);
  }, [originCountry]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getKdramas(page, originCountry);

      const newIds = data.map(d => d.id);
      await refreshStats(newIds);

      setKdramas(prev => {
        const newData = [...prev, ...data];
        // Unique elements by ID
        const uniqueData = Array.from(new Map(newData.map(item => [item.id, item])).values());

        // Update actor list from unique data
        const actors = new Set<string>();
        uniqueData.forEach(d => d.characters?.forEach((c: { actorName: string }) => actors.add(c.actorName)));
        setAllActors(Array.from(actors).sort());

        return uniqueData;
      });

      setLoading(false);
    }
    loadData();
  }, [page, originCountry, refreshStats]);

  const sortedAndFilteredDramas = kdramas
    .filter(drama => {
      const matchesSearch = drama.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesActor = !selectedActor || drama.characters?.some((c: { actorName: string }) => c.actorName === selectedActor);
      return matchesSearch && matchesActor;
    })
    .sort((a, b) => {
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
    <div className="min-h-screen bg-sage-50/50 transition-colors duration-500">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-sage-100/50 px-6 py-6 md:px-12">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-serif font-bold text-zinc-900 tracking-tight">
                Asian Drama Board
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-sage-600 bg-sage-100 px-2 py-0.5 rounded">Argentina View</span>
                <p className="text-sm text-sage-600 font-medium">
                  Streaming info • Community Stats • Multi-Origin
                </p>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-sage-100 text-sage-700 rounded-xl text-sm font-bold sm:hidden"
              >
                <SearchIcon className="h-4 w-4" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
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
              onClick={() => { setSearchTerm(''); setSelectedActor(''); setSortBy('popularity'); }}
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
