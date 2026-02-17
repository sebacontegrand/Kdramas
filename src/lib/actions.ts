'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { fetchKdramas, fetchKdramaById } from './tmdb';

/**
 * Server Action to fetch K-dramas from TMDB.
 * This keeps the API key secure on the server.
 */
export async function getKdramas(page: number = 1, originCountry: string = 'KR') {
    return await fetchKdramas(page, originCountry);
}

/**
 * Toggles a show as favorite for the guest user.
 */
export async function toggleFavorite(tmdbId: number) {
    try {
        console.log('DEBUG: toggleFavorite for tmdbId:', tmdbId);
        let user = await prisma.user.findUnique({
            where: { username: 'guest_user' }
        });

        if (!user) {
            console.log('DEBUG: guest_user not found, creating...');
            user = await prisma.user.create({
                data: { username: 'guest_user' }
            });
        }

        const rating = await prisma.rating.findUnique({
            where: {
                userId_tmdbId: {
                    userId: user.id,
                    tmdbId: tmdbId
                }
            }
        });

        if (rating) {
            console.log('DEBUG: Updating existing rating for favorite toggle');
            await prisma.rating.update({
                where: { id: rating.id },
                data: { isFavorite: !rating.isFavorite }
            });
        } else {
            console.log('DEBUG: Creating new rating for favorite toggle');
            await prisma.rating.create({
                data: {
                    tmdbId: tmdbId,
                    userId: user.id,
                    isFavorite: true,
                    hasSeen: false,
                    score: 0
                }
            });
        }

        revalidatePath('/');
        revalidatePath('/favorites');
    } catch (error) {
        console.error('ERROR in toggleFavorite:', error);
        throw error;
    }
}

/**
 * Fetches all favorite K-dramas for the guest user.
 */
export async function getFavorites() {
    const user = await prisma.user.findUnique({
        where: { username: 'guest_user' },
        include: {
            ratings: {
                where: { isFavorite: true }
            }
        }
    });

    if (!user || user.ratings.length === 0) return [];

    const favoriteIds = user.ratings.map(r => r.tmdbId);
    const dramas = await Promise.all(
        favoriteIds.map(id => fetchKdramaById(id))
    );

    return dramas.filter((d): d is any => d !== null);
}

/**
 * Resets all interactions for a specific K-drama.
 */
export async function resetInteraction(tmdbId: number) {
    const user = await prisma.user.findUnique({
        where: { username: 'guest_user' }
    });

    if (!user) return;

    await prisma.rating.deleteMany({
        where: {
            userId: user.id,
            tmdbId: tmdbId
        }
    });

    revalidatePath('/');
    revalidatePath('/favorites');
    revalidatePath('/watched');
    revalidatePath('/best');
}

/**
 * Toggles the 'seen' status for a K-drama.
 */
export async function toggleSeen(tmdbId: number) {
    try {
        console.log('DEBUG: toggleSeen for tmdbId:', tmdbId);
        let user = await prisma.user.findUnique({
            where: { username: 'guest_user' }
        });

        if (!user) {
            user = await prisma.user.create({
                data: { username: 'guest_user' }
            });
        }

        const rating = await prisma.rating.findUnique({
            where: {
                userId_tmdbId: {
                    userId: user.id,
                    tmdbId: tmdbId
                }
            }
        });

        if (rating) {
            await prisma.rating.update({
                where: { id: rating.id },
                data: { hasSeen: !rating.hasSeen }
            });
        } else {
            await prisma.rating.create({
                data: {
                    tmdbId: tmdbId,
                    userId: user.id,
                    hasSeen: true,
                    isFavorite: false,
                    score: 0
                }
            });
        }

        revalidatePath('/');
        revalidatePath('/watched');
    } catch (error) {
        console.error('ERROR in toggleSeen:', error);
        throw error;
    }
}

/**
 * Updates the score for a show for the guest user.
 */
export async function updateScore(tmdbId: number, score: number) {
    try {
        console.log('DEBUG: updateScore for tmdbId:', tmdbId, 'score:', score);
        let user = await prisma.user.findUnique({
            where: { username: 'guest_user' }
        });

        if (!user) {
            user = await prisma.user.create({
                data: { username: 'guest_user' }
            });
        }

        const rating = await prisma.rating.findUnique({
            where: {
                userId_tmdbId: {
                    userId: user.id,
                    tmdbId: tmdbId
                }
            }
        });

        if (rating) {
            await prisma.rating.update({
                where: { id: rating.id },
                data: { score: score }
            });
        } else {
            await prisma.rating.create({
                data: {
                    tmdbId: tmdbId,
                    userId: user.id,
                    score: score,
                    hasSeen: false,
                    isFavorite: false
                }
            });
        }

        revalidatePath('/');
        revalidatePath('/best');
    } catch (error) {
        console.error('ERROR in updateScore:', error);
        throw error;
    }
}

/**
 * Fetches all watched K-dramas for the guest user.
 */
export async function getWatched() {
    const user = await prisma.user.findUnique({
        where: { username: 'guest_user' },
        include: {
            ratings: {
                where: { hasSeen: true }
            }
        }
    });

    if (!user || user.ratings.length === 0) return [];

    const watchedIds = user.ratings.map(r => r.tmdbId);
    const dramas = await Promise.all(
        watchedIds.map(id => fetchKdramaById(id))
    );

    return dramas.filter((d): d is any => d !== null);
}

/**
 * Fetches the user's rated K-dramas sorted by score (descending).
 */
export async function getTopRated() {
    const user = await prisma.user.findUnique({
        where: { username: 'guest_user' },
        include: {
            ratings: {
                where: { score: { gt: 0 } },
                orderBy: { score: 'desc' }
            }
        }
    });

    if (!user || user.ratings.length === 0) return [];

    // Map through ratings to maintain the database order
    const dramas = await Promise.all(
        user.ratings.map(async (rating) => {
            const drama = await fetchKdramaById(rating.tmdbId);
            return drama;
        })
    );

    return dramas.filter((d): d is any => d !== null);
}

/**
 * Clears all favorites for the guest user.
 */
export async function clearAllFavorites() {
    const user = await prisma.user.findUnique({
        where: { username: 'guest_user' }
    });

    if (!user) return;

    await prisma.rating.updateMany({
        where: { userId: user.id },
        data: { isFavorite: false }
    });

    // Cleanup: Remove records that have no interactions left
    await prisma.rating.deleteMany({
        where: {
            userId: user.id,
            isFavorite: false,
            hasSeen: false,
            score: 0
        }
    });

    revalidatePath('/');
    revalidatePath('/favorites');
}

/**
 * Clears all watched status for the guest user.
 */
export async function clearAllWatched() {
    const user = await prisma.user.findUnique({
        where: { username: 'guest_user' }
    });

    if (!user) return;

    await prisma.rating.updateMany({
        where: { userId: user.id },
        data: { hasSeen: false }
    });

    await prisma.rating.deleteMany({
        where: {
            userId: user.id,
            isFavorite: false,
            hasSeen: false,
            score: 0
        }
    });

    revalidatePath('/');
    revalidatePath('/watched');
}

/**
 * Clears all ratings for the guest user.
 */
export async function clearAllRatings() {
    const user = await prisma.user.findUnique({
        where: { username: 'guest_user' }
    });

    if (!user) return;

    await prisma.rating.updateMany({
        where: { userId: user.id },
        data: { score: 0 }
    });

    await prisma.rating.deleteMany({
        where: {
            userId: user.id,
            isFavorite: false,
            hasSeen: false,
            score: 0
        }
    });

    revalidatePath('/');
    revalidatePath('/best');
}

/**
 * Fetches interaction stats for a list of TMDB IDs.
 */
export async function getInteractionStats(tmdbIds: number[]) {
    if (tmdbIds.length === 0) return [];

    try {
        console.log('DEBUG: Fetching interaction stats for IDs:', tmdbIds);

        const stats = await prisma.rating.groupBy({
            by: ['tmdbId'],
            where: {
                tmdbId: { in: tmdbIds }
            },
            _avg: {
                score: true
            },
            _count: {
                _all: true
            }
        });

        // Get personal stats for the guest user
        const user = await prisma.user.findUnique({
            where: { username: 'guest_user' },
            include: {
                ratings: {
                    where: { tmdbId: { in: tmdbIds } }
                }
            }
        });

        // Specifically count how many actually marked as 'seen'
        const seenCounts = await prisma.rating.groupBy({
            by: ['tmdbId'],
            where: {
                tmdbId: { in: tmdbIds },
                hasSeen: true
            },
            _count: {
                _all: true
            }
        });

        return tmdbIds.map(id => {
            const stat = stats.find((s: any) => s.tmdbId === id);
            const seenStat = seenCounts.find((s: any) => s.tmdbId === id);
            const userRating = user?.ratings.find(r => r.tmdbId === id);

            return {
                tmdbId: id,
                avgRating: stat?._avg?.score || 0,
                totalRatings: stat?._count?._all || 0,
                seenCount: seenStat?._count?._all || 0,
                isFavorite: userRating?.isFavorite || false,
                score: userRating?.score || 0,
                hasSeen: userRating?.hasSeen || false
            };
        });
    } catch (error: any) {
        console.error('ERROR in getInteractionStats:', error);
        // Return empty stats instead of crashing the whole page
        return tmdbIds.map(id => ({
            tmdbId: id,
            avgRating: 0,
            totalRatings: 0,
            seenCount: 0,
            isFavorite: false,
            score: 0,
            hasSeen: false
        }));
    }
}
