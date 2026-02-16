const TMDB_API_KEY = process.env.TMDB_API_KEY;
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
                id: 95074,
                name: "Crash Landing on You",
                poster_path: "https://image.tmdb.org/t/p/w500/3x4EX2D9I8Cj2J3a8u3E9j0b1Gz.jpg",
                overview: "A paragliding mishap drops a South Korean heiress in North Korea.",
                first_air_date: "2019-12-14",
                vote_average: 8.8,
                popularity: 250.5,
                watchProviders: ["Netflix"],
                characters: [
                    { id: 1, name: "Yoon Se-ri", actorName: "Son Ye-jin", profile_path: "https://image.tmdb.org/t/p/w200/nS8vWd6p2Y4Y8D2K4M2I1oX1pY0.jpg" },
                    { id: 2, name: "Ri Jeong-hyeok", actorName: "Hyun Bin", profile_path: "https://image.tmdb.org/t/p/w200/eM3jY2G2R1vM5kX7n1R4u1q1n1R.jpg" }
                ]
            },
            {
                id: 67915,
                name: "Goblin",
                poster_path: "https://image.tmdb.org/t/p/w500/mUqI4pI8uKj2l3o1s9l7c0g7t7g.jpg",
                overview: "In his quest for a bride to break his immortal curse, a 939-year-old guardian of souls meets a bright girl.",
                first_air_date: "2016-12-02",
                vote_average: 8.7,
                popularity: 180.2,
                watchProviders: ["Viki"],
                characters: [
                    { id: 3, name: "Kim Shin", actorName: "Gong Yoo", profile_path: "https://image.tmdb.org/t/p/w200/jI2P5X0h8h4h8r9k7r3n2f9f1d2.jpg" },
                    { id: 4, name: "Ji Eun-tak", actorName: "Kim Go-eun", profile_path: "https://image.tmdb.org/t/p/w200/dE2x8X8X8x2g4o4r0o1c3o6u2e3.jpg" }
                ]
            },
            {
                id: 105650,
                name: "Alice in Borderland",
                poster_path: "https://image.tmdb.org/t/p/w500/oY6w3v1c1t0c0e7h4h5h3f9m4a6.jpg",
                overview: "An obsessive gamer and his friends find themselves in a parallel Tokyo where they must compete in games to survive.",
                first_air_date: "2020-12-10",
                vote_average: 8.2,
                popularity: 450.8,
                watchProviders: ["Netflix"],
                characters: [
                    { id: 101, name: "Ryohei Arisu", actorName: "Kento Yamazaki", profile_path: "https://image.tmdb.org/t/p/w200/jX2x1x3c7c8c3e8e7c1u9o3u8f2.jpg" },
                    { id: 102, name: "Yuzuha Usagi", actorName: "Tao Tsuchiya", profile_path: "https://image.tmdb.org/t/p/w200/bV5x4d5t8t9u3e9t5t9t6r4c1c5.jpg" }
                ]
            },
            {
                id: 89236,
                name: "The Untamed",
                poster_path: "https://image.tmdb.org/t/p/w500/hJjY5x1g4j5g8u2b5o8n7o3a7o4.jpg",
                overview: "Two talented disciples of rival clans form a friendship and work together to solve a series of mysteries.",
                first_air_date: "2019-06-27",
                vote_average: 8.5,
                popularity: 120.3,
                watchProviders: ["Netflix", "Viki"],
                characters: [
                    { id: 201, name: "Wei Wuxian", actorName: "Xiao Zhan", profile_path: "https://image.tmdb.org/t/p/w200/dG7h8g4k2m9h4j2l9a5r8u6w3x4.jpg" },
                    { id: 202, name: "Lan Wangji", actorName: "Wang Yibo", profile_path: "https://image.tmdb.org/t/p/w200/fG5h9j7l3k8o0m7n2p1r5s4t3v2.jpg" }
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
