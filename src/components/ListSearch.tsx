'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTransition, useState, useEffect } from 'react';

export default function ListSearch() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const currentQuery = searchParams.get('q') || '';
    const [inputValue, setInputValue] = useState(currentQuery);

    useEffect(() => {
        const handler = setTimeout(() => {
            const params = new URLSearchParams(searchParams);
            if (inputValue) {
                params.set('q', inputValue);
            } else {
                params.delete('q');
            }

            startTransition(() => {
                router.replace(`${pathname}?${params.toString()}`);
            });
        }, 300);

        return () => clearTimeout(handler);
    }, [inputValue, pathname, router, searchParams]);

    return (
        <div className="relative group flex-1 max-w-xs transition-opacity" style={{ opacity: isPending ? 0.7 : 1 }}>
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-4 w-4 text-sage-400 group-focus-within:text-sage-600 transition-colors">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
            </div>
            <input
                type="text"
                placeholder="Search list..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                aria-label="Search within this list"
                className="w-full pl-11 pr-4 py-2 bg-sage-50/50 border border-sage-100 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-sage-300 focus:ring-4 focus:ring-sage-50 transition-all font-medium text-sage-900 placeholder:text-sage-400"
            />
        </div>
    );
}
