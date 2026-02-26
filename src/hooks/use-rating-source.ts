'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import { OMDB_KEY_STORAGE_KEY, RATING_SOURCE_STORAGE_KEY, DEFAULT_RATING_SOURCE } from '@/lib/constants';
import type { RatingSource } from '@/lib/constants';

function getSnapshot(): { ratingSource: RatingSource; omdbKey: string | null } {
    if (typeof window === 'undefined') {
        return { ratingSource: DEFAULT_RATING_SOURCE, omdbKey: null };
    }
    const source = (localStorage.getItem(RATING_SOURCE_STORAGE_KEY) as RatingSource) || DEFAULT_RATING_SOURCE;
    const key = localStorage.getItem(OMDB_KEY_STORAGE_KEY);
    return { ratingSource: source, omdbKey: key };
}

/**
 * Hook to reactively track the rating source (tvmaze | imdb) and OMDb API key.
 * Listens for 'rating-source-change' and 'omdb-key-change' events to stay in sync
 * with footer toggle and settings page.
 */
export function useRatingSource() {
    const [state, setState] = useState(getSnapshot);

    useEffect(() => {
        const update = () => setState(getSnapshot());

        window.addEventListener('rating-source-change', update);
        window.addEventListener('omdb-key-change', update);
        window.addEventListener('storage', update);

        // Initial read
        update();

        return () => {
            window.removeEventListener('rating-source-change', update);
            window.removeEventListener('omdb-key-change', update);
            window.removeEventListener('storage', update);
        };
    }, []);

    return state;
}
