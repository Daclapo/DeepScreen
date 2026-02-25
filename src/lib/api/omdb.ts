import { OMDB_API_BASE } from '@/lib/constants';
import type { OMDbMovie, OMDbSeasonResponse } from '@/types';

async function omdbFetch<T>(params: Record<string, string>, apiKey: string): Promise<T> {
    const url = new URL(OMDB_API_BASE);
    url.searchParams.set('apikey', apiKey);
    for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
    }

    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) {
        throw new Error(`OMDb API error: ${res.status}`);
    }
    const data = await res.json();
    if (data.Response === 'False') {
        throw new Error(data.Error || 'OMDb returned an error');
    }
    return data;
}

export async function getByImdbId(imdbId: string, apiKey: string): Promise<OMDbMovie> {
    return omdbFetch({ i: imdbId, plot: 'full' }, apiKey);
}

export async function getSeasonEpisodes(
    imdbId: string,
    season: number,
    apiKey: string
): Promise<OMDbSeasonResponse> {
    return omdbFetch({ i: imdbId, Season: String(season) }, apiKey);
}

export async function validateApiKey(apiKey: string): Promise<boolean> {
    try {
        // Test with a known IMDb ID (The Matrix)
        await omdbFetch({ i: 'tt0133093' }, apiKey);
        return true;
    } catch {
        return false;
    }
}
