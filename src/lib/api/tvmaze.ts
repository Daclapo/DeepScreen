import { TVMAZE_API_BASE } from '@/lib/constants';
import type { TVMazeShow, TVMazeEpisode } from '@/types';

async function tvmazeFetch<T>(endpoint: string): Promise<T> {
    const res = await fetch(`${TVMAZE_API_BASE}${endpoint}`, {
        next: { revalidate: 86400 },  // cache 24h — episode ratings rarely change
    });
    if (!res.ok) {
        throw new Error(`TVMaze API error: ${res.status} ${res.statusText}`);
    }
    return res.json();
}

export async function getShowByImdbId(imdbId: string): Promise<TVMazeShow | null> {
    try {
        const res = await fetch(`${TVMAZE_API_BASE}/lookup/shows?imdb=${imdbId}`, {
            next: { revalidate: 86400 },
        });
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

export async function getEpisodes(tvmazeShowId: number): Promise<TVMazeEpisode[]> {
    return tvmazeFetch(`/shows/${tvmazeShowId}/episodes`);
}

export async function getShowById(tvmazeShowId: number): Promise<TVMazeShow> {
    return tvmazeFetch(`/shows/${tvmazeShowId}`);
}
