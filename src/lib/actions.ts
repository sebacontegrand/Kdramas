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
    let user = await prisma.user.findUnique({
        where: { username: 'guest_user' }
    });

    if (!user) {
        user = await prisma.user.create({
            data: { username: 'guest_user' }
        });
    }

    const existingRating = await prisma.rating.findUnique({
        where: {
            userId_tmdbId: {
                userId: user.id,
                tmdbId: tmdbId
            }
        }
    });

    if (existingRating) {
        await prisma.rating.update({
            where: { id: existingRating.id },
            data: { isFavorite: !existingRating.isFavorite }
        });
    } else {
        await prisma.rating.create({
            data: {
                userId: user.id,
                tmdbId: tmdbId,
                score: 0,
                hasSeen: false,
                isFavorite: true
            }
        });
    }

    revalidatePath('/');
    revalidatePath('/favorites');
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
 * Submits or updates a rating for a K-drama.
 * For this simple version, we'll use a hardcoded "Guest" user.
 */
export async function submitRating(tmdbId: number, score: number, hasSeen: boolean) {
    // 1. Ensure a default user exists for this simple interaction version
    let user = await prisma.user.findUnique({
        where: { username: 'guest_user' }
    });

    if (!user) {
        user = await prisma.user.create({
            data: { username: 'guest_user' }
        });
    }

    // 2. Upsert the rating
    await prisma.rating.upsert({
        where: {
            userId_tmdbId: {
                userId: user.id,
                tmdbId: tmdbId
            }
        },
        update: {
            score: score,
            hasSeen: hasSeen
        },
        create: {
            userId: user.id,
            tmdbId: tmdbId,
            score: score,
            hasSeen: hasSeen
        }
    });

    revalidatePath('/');
}

/**
 * Fetches interaction stats for a list of TMDB IDs.
 */
export async function getInteractionStats(tmdbIds: number[]) {
    if (tmdbIds.length === 0) return [];

    const stats = await prisma.rating.groupBy({
        by: ['tmdbId'],
        where: {
            tmdbId: { in: tmdbIds }
        },
        _avg: {
            score: true
        },
        _count: {
            _all: true,
            hasSeen: true
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
            avgRating: stat?._avg.score || 0,
            totalRatings: stat?._count._all || 0,
            seenCount: seenStat?._count._all || 0,
            isFavorite: userRating?.isFavorite || false,
            score: userRating?.score || 0,
            hasSeen: userRating?.hasSeen || false
        };
    });
}
