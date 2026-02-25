import { TMDB_API_BASE } from '@/lib/constants';
import type {
    TMDBPaginatedResponse,
    TMDBMovie,
    TMDBSeries,
    TMDBMultiResult,
    TMDBMovieDetail,
    TMDBSeriesDetail,
    TMDBSeasonDetail,
    TMDBExternalIds,
    TMDBPersonDetail,
    TMDBPersonCombinedCredits,
} from '@/types';

const API_KEY = process.env.TMDB_API_KEY!;

async function tmdbFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${TMDB_API_BASE}${endpoint}`);
    url.searchParams.set('api_key', API_KEY);
    for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
    }

    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) {
        throw new Error(`TMDB API error: ${res.status} ${res.statusText}`);
    }
    return res.json();
}

// Search

export async function searchMulti(
    query: string,
    page = 1,
    language = 'en-US'
): Promise<TMDBPaginatedResponse<TMDBMultiResult>> {
    return tmdbFetch('/search/multi', { query, page: String(page), language, include_adult: 'false' });
}

export async function searchMovies(
    query: string,
    page = 1,
    language = 'en-US'
): Promise<TMDBPaginatedResponse<TMDBMovie>> {
    return tmdbFetch('/search/movie', { query, page: String(page), language, include_adult: 'false' });
}

export async function searchTV(
    query: string,
    page = 1,
    language = 'en-US'
): Promise<TMDBPaginatedResponse<TMDBSeries>> {
    return tmdbFetch('/search/tv', { query, page: String(page), language, include_adult: 'false' });
}

export async function searchPerson(
    query: string,
    page = 1,
    language = 'en-US'
): Promise<TMDBPaginatedResponse<TMDBPersonDetail>> {
    return tmdbFetch('/search/person', { query, page: String(page), language, include_adult: 'false' });
}

// Trending

export async function getTrending(
    mediaType: 'movie' | 'tv' | 'all' = 'all',
    timeWindow: 'day' | 'week' = 'day',
    language = 'en-US'
): Promise<TMDBPaginatedResponse<TMDBMultiResult>> {
    return tmdbFetch(`/trending/${mediaType}/${timeWindow}`, { language });
}

// Discover

export async function discoverMovies(
    params: Record<string, string>,
    language = 'en-US'
): Promise<TMDBPaginatedResponse<TMDBMovie>> {
    return tmdbFetch('/discover/movie', { ...params, language, include_adult: 'false' });
}

export async function discoverTV(
    params: Record<string, string>,
    language = 'en-US'
): Promise<TMDBPaginatedResponse<TMDBSeries>> {
    return tmdbFetch('/discover/tv', { ...params, language, include_adult: 'false' });
}

// Details

export async function getMovieDetails(
    id: number,
    language = 'en-US'
): Promise<TMDBMovieDetail> {
    return tmdbFetch(`/movie/${id}`, { language, append_to_response: 'credits,external_ids,similar,recommendations' });
}

export async function getSeriesDetails(
    id: number,
    language = 'en-US'
): Promise<TMDBSeriesDetail> {
    return tmdbFetch(`/tv/${id}`, { language, append_to_response: 'credits,external_ids,similar,recommendations' });
}

export async function getSeasonDetails(
    seriesId: number,
    seasonNumber: number,
    language = 'en-US'
): Promise<TMDBSeasonDetail> {
    return tmdbFetch(`/tv/${seriesId}/season/${seasonNumber}`, { language });
}

// External IDs

export async function getExternalIds(
    seriesId: number
): Promise<TMDBExternalIds> {
    return tmdbFetch(`/tv/${seriesId}/external_ids`);
}

// Top rated

export async function getTopRatedMovies(
    page = 1,
    language = 'en-US'
): Promise<TMDBPaginatedResponse<TMDBMovie>> {
    return tmdbFetch('/movie/top_rated', { page: String(page), language });
}

export async function getTopRatedTV(
    page = 1,
    language = 'en-US'
): Promise<TMDBPaginatedResponse<TMDBSeries>> {
    return tmdbFetch('/tv/top_rated', { page: String(page), language });
}

// Upcoming

export async function getUpcomingMovies(
    page = 1,
    language = 'en-US'
): Promise<TMDBPaginatedResponse<TMDBMovie>> {
    return tmdbFetch('/movie/upcoming', { page: String(page), language });
}

// Person

export async function getPersonDetails(
    id: number,
    language = 'en-US'
): Promise<TMDBPersonDetail> {
    return tmdbFetch(`/person/${id}`, { language });
}

export async function getPersonCombinedCredits(
    id: number,
    language = 'en-US'
): Promise<TMDBPersonCombinedCredits> {
    return tmdbFetch(`/person/${id}/combined_credits`, { language });
}
