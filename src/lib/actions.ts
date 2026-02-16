'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

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
        return {
            tmdbId: id,
            avgRating: stat?._avg.score || 0,
            totalRatings: stat?._count._all || 0,
            seenCount: seenStat?._count._all || 0
        };
    });
}
