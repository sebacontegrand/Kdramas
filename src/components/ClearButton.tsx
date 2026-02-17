'use client';

import { useState } from 'react';
import { clearAllFavorites, clearAllWatched, clearAllRatings } from '@/lib/actions';

interface ClearButtonProps {
    type: 'favorites' | 'watched' | 'best';
}

export default function ClearButton({ type }: ClearButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleClear = async () => {
        const confirmMessage = `Are you sure you want to clear all your ${type === 'best' ? 'ratings' : type}? This action cannot be undone.`;
        if (!confirm(confirmMessage)) return;

        setLoading(true);
        try {
            if (type === 'favorites') await clearAllFavorites();
            else if (type === 'watched') await clearAllWatched();
            else if (type === 'best') await clearAllRatings();
        } catch (error) {
            console.error(`Error clearing ${type}:`, error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleClear}
            disabled={loading}
            className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold border border-rose-100/50 hover:bg-rose-100 hover:text-rose-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
            <TrashIcon className="h-3 w-3" />
            {loading ? 'Clearing...' : `Clear All`}
        </button>
    );
}

function TrashIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
        </svg>
    );
}
