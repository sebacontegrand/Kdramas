const TMDB_API_KEY = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export interface Kdrama {
    id: number;
    name: string;
    poster_path: string;
    backdrop_path?: string;
    overview: string;
    first_air_date: string;
    vote_average: number;
    popularity: number;
    origin_country: string[];
    characters?: Character[];
    watchProviders?: string[];
    number_of_episodes?: number;
    number_of_seasons?: number;
    trailerKey?: string;
}

export interface Character {
    id: number;
    name: string;
    actorName: string;
    profile_path: string | null;
}

async function processShows(shows: any[]): Promise<Kdrama[]> {
    if (!TMDB_API_KEY) return [];

    return await Promise.all(
        shows.map(async (show: any) => {
            // Fetch credits
            const creditsPromise = fetch(`${TMDB_BASE_URL}/tv/${show.id}/credits?api_key=${TMDB_API_KEY}`).then(r => r.json()).catch(() => ({}));
            // Fetch watch providers (Region: AR for Argentina)
            const providersPromise = fetch(`${TMDB_BASE_URL}/tv/${show.id}/watch/providers?api_key=${TMDB_API_KEY}`).then(r => r.json()).catch(() => ({}));

            const [creditsData, providersData] = await Promise.all([creditsPromise, providersPromise]);

            const characters = creditsData.cast?.slice(0, 2).map((c: any) => ({
                id: c.id,
                name: c.character,
                actorName: c.name,
                profile_path: c.profile_path ? `https://image.tmdb.org/t/p/w200${c.profile_path}` : null,
            })) || [];

            const providers = providersData.results?.AR?.flatrate?.map((p: any) => p.provider_name) || [];

            return {
                id: show.id,
                name: show.name,
                poster_path: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : "https://www.themoviedb.org/assets/2/v4/glyphicons/basic/glyphicons-basic-38-picture-grey-c2ebdbb057f2a761418593530d7ca200d644d66e552c3a2969911457383a7c67.svg",
                overview: show.overview,
                first_air_date: show.first_air_date,
                vote_average: show.vote_average,
                popularity: show.popularity,
                origin_country: show.origin_country || [],
                characters,
                watchProviders: providers,
            };
        })
    );
}

export async function fetchKdramas(page: number = 1, originCountry: string = 'KR'): Promise<Kdrama[]> {
    if (!TMDB_API_KEY) {
        console.error("TMDB_API_KEY is missing. Please provide it in environment variables.");
        return [];
    }

    try {
        const originParam = originCountry === 'all' ? '' : `&with_origin_country=${originCountry}`;
        const response = await fetch(
            `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}${originParam}&sort_by=popularity.desc&page=${page}`
        );
        const data = await response.json();

        if (!data.results) return [];

        return await processShows(data.results);
    } catch (error) {
        console.error("Error fetching Kdramas:", error);
        return [];
    }
}

export async function searchKdramas(query: string, page: number = 1): Promise<Kdrama[]> {
    if (!TMDB_API_KEY) {
        console.error("TMDB_API_KEY is missing. Please provide it in environment variables.");
        return [];
    }

    try {
        const response = await fetch(
            `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}`
        );
        const data = await response.json();

        if (!data.results) return [];

        return await processShows(data.results);
    } catch (error) {
        console.error("Error searching Kdramas:", error);
        return [];
    }
}

export async function fetchKdramaById(id: number): Promise<Kdrama | null> {
    if (!TMDB_API_KEY) {
        console.error("TMDB_API_KEY is missing. Please provide it in environment variables.");
        return null;
    }

    try {
        const response = await fetch(`${TMDB_BASE_URL}/tv/${id}?api_key=${TMDB_API_KEY}&append_to_response=credits,watch/providers,videos`);
        const show = await response.json();

        if (!show || show.success === false) return null;

        const creditsData = show.credits || {};
        const providersData = show['watch/providers'] || {};
        const videosData = show.videos || {};

        // Get full cast (up to 20 for detail screen)
        const characters = creditsData.cast?.slice(0, 20).map((c: any) => ({
            id: c.id,
            name: c.character,
            actorName: c.name,
            profile_path: c.profile_path ? `https://image.tmdb.org/t/p/w200${c.profile_path}` : null,
        })) || [];

        const providers = providersData.results?.AR?.flatrate?.map((p: any) => p.provider_name) || [];

        // Find YouTube trailer
        const trailer = videosData.results?.find((v: any) => v.site === 'YouTube' && v.type === 'Trailer') ||
            videosData.results?.find((v: any) => v.site === 'YouTube');
        const trailerKey = trailer ? trailer.key : undefined;

        return {
            id: show.id,
            name: show.name,
            poster_path: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : "https://www.themoviedb.org/assets/2/v4/glyphicons/basic/glyphicons-basic-38-picture-grey-c2ebdbb057f2a761418593530d7ca200d644d66e552c3a2969911457383a7c67.svg",
            backdrop_path: show.backdrop_path ? `https://image.tmdb.org/t/p/original${show.backdrop_path}` : undefined,
            overview: show.overview,
            first_air_date: show.first_air_date,
            vote_average: show.vote_average,
            popularity: show.popularity,
            origin_country: show.origin_country || [],
            characters,
            watchProviders: providers,
            number_of_episodes: show.number_of_episodes,
            number_of_seasons: show.number_of_seasons,
            trailerKey
        };
    } catch (error) {
        console.error(`Error fetching Kdrama ${id}:`, error);
        return null;
    }
}
