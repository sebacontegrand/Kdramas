const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
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
    if (!TMDB_API_KEY || TMDB_API_KEY === 'your_tmdb_api_key_here') {
        // Return mock data if no key is provided
        const allMockData: Kdrama[] = [
            {
                id: 94796,
                name: "Crash Landing on You",
                poster_path: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/6oomDwsUCvS61KEv7kR3ueQNTSO.jpg",
                overview: "A paragliding mishap drops a South Korean heiress in North Korea.",
                first_air_date: "2019-12-14",
                vote_average: 8.8,
                popularity: 250.5,
                watchProviders: ["Netflix"],
                characters: [
                    { id: 1, name: "Yoon Se-ri", actorName: "Son Ye-jin", profile_path: "https://image.tmdb.org/t/p/w200/6i8N2D6m4E8YhHaqD9i3InNfX9P.jpg" },
                    { id: 2, name: "Ri Jeong-hyeok", actorName: "Hyun Bin", profile_path: "https://image.tmdb.org/t/p/w200/9y39CH8CH6N2D6m4E8YhHaqD9i3InNfX9P.jpg" }
                ]
            },
            {
                id: 67915,
                name: "Goblin",
                poster_path: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/8v0BfNskm7fV0V2V2V2V2V2V2V.jpg",
                overview: "In his quest for a bride to break his immortal curse, a 939-year-old guardian of souls meets a bright girl.",
                first_air_date: "2016-12-02",
                vote_average: 8.7,
                popularity: 180.2,
                watchProviders: ["Viki"],
                characters: [
                    { id: 3, name: "Kim Shin", actorName: "Gong Yoo", profile_path: "https://image.tmdb.org/t/p/w200/6H6N2D6m4E8YhHaqD9i3InNfX9P.jpg" },
                    { id: 4, name: "Ji Eun-tak", actorName: "Kim Go-eun", profile_path: "https://image.tmdb.org/t/p/w200/7H6N2D6m4E8YhHaqD9i3InNfX9P.jpg" }
                ]
            },
            {
                id: 110309,
                name: "Alice in Borderland",
                poster_path: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/20mC797v9nuVIdO9Ym9as.jpg",
                overview: "An obsessive gamer and his friends find themselves in a parallel Tokyo where they must compete in games to survive.",
                first_air_date: "2020-12-10",
                vote_average: 8.2,
                popularity: 450.8,
                watchProviders: ["Netflix"],
                characters: [
                    { id: 101, name: "Ryohei Arisu", actorName: "Kento Yamazaki", profile_path: null },
                    { id: 102, name: "Yuzuha Usagi", actorName: "Tao Tsuchiya", profile_path: null }
                ]
            },
            {
                id: 82505,
                name: "The Untamed",
                poster_path: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/7vClS4pYpT76878S978jV0V.jpg",
                overview: "Two talented disciples of rival clans form a friendship and work together to solve a series of mysteries.",
                first_air_date: "2019-06-27",
                vote_average: 8.5,
                popularity: 120.3,
                watchProviders: ["Netflix", "Viki"],
                characters: [
                    { id: 201, name: "Wei Wuxian", actorName: "Xiao Zhan", profile_path: null },
                    { id: 202, name: "Lan Wangji", actorName: "Wang Yibo", profile_path: null }
                ]
            }
        ];

        // In a real scenario, we'd filter mock data by origin country here if we had more. 
        // For now just return the slice.
        return allMockData.slice((page - 1) * 4, page * 4);
    }

    try {
        const response = await fetch(
            `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&with_origin_country=${originCountry}&sort_by=popularity.desc&page=${page}`
        );
        const data = await response.json();

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
