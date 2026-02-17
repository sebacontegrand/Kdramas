const TMDB_API_KEY = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export interface Kdrama {
    id: number;
    name: string;
    poster_path: string;
    overview: string;
    first_air_date: string;
    vote_average: number;
    popularity: number;
    characters?: Character[];
    watchProviders?: string[];
}

export interface Character {
    id: number;
    name: string;
    actorName: string;
    profile_path: string | null;
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

        const kdramas = await Promise.all(
            data.results.map(async (show: any) => {
                // Fetch credits
                const creditsPromise = fetch(`${TMDB_BASE_URL}/tv/${show.id}/credits?api_key=${TMDB_API_KEY}`).then(r => r.json());
                // Fetch watch providers (Region: AR for Argentina)
                const providersPromise = fetch(`${TMDB_BASE_URL}/tv/${show.id}/watch/providers?api_key=${TMDB_API_KEY}`).then(r => r.json());

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
                    characters,
                    watchProviders: providers,
                };
            })
        );

        return kdramas;
    } catch (error) {
        console.error("Error fetching Kdramas:", error);
        return [];
    }
}

export async function fetchKdramaById(id: number): Promise<Kdrama | null> {
    if (!TMDB_API_KEY) {
        console.error("TMDB_API_KEY is missing. Please provide it in environment variables.");
        return null;
    }

    try {
        const response = await fetch(`${TMDB_BASE_URL}/tv/${id}?api_key=${TMDB_API_KEY}`);
        const show = await response.json();

        if (!show || show.success === false) return null;

        const [creditsResponse, providersResponse] = await Promise.all([
            fetch(`${TMDB_BASE_URL}/tv/${id}/credits?api_key=${TMDB_API_KEY}`),
            fetch(`${TMDB_BASE_URL}/tv/${id}/watch/providers?api_key=${TMDB_API_KEY}`)
        ]);

        const creditsData = await creditsResponse.json();
        const providersData = await providersResponse.json();

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
            characters,
            watchProviders: providers,
        };
    } catch (error) {
        console.error(`Error fetching Kdrama ${id}:`, error);
        return null;
    }
}
