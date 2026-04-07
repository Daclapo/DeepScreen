import { getTranslations } from 'next-intl/server';
import { getTrending, getTopRatedMovies, getTopRatedTV } from '@/lib/api/tmdb';
import { HomeClient } from './home-client';
import type { TMDBMovie, TMDBMultiResult, TMDBSeries } from '@/types';

const HOME_MIN_VOTES = {
    popularity: 200,
    rating: 800,
} as const;

function isIndianByCountry(item: { origin_country?: string[] }): boolean {
    return Array.isArray(item.origin_country) && item.origin_country.includes('IN');
}

function getHomeTrendingItems(firstPage: TMDBMultiResult[], secondPage: TMDBMultiResult[]) {
    const pool = [...firstPage, ...secondPage];
    return pool
        .filter((item): item is TMDBMultiResult & { media_type: 'movie' | 'tv'; vote_count: number; origin_country?: string[] } => item.media_type === 'movie' || item.media_type === 'tv')
        .filter((item) => item.vote_count >= HOME_MIN_VOTES.popularity)
        .filter((item) => !isIndianByCountry(item))
        .slice(0, 10);
}

function getHomeTopMovies(firstPage: TMDBMovie[], secondPage: TMDBMovie[]) {
    return [...firstPage, ...secondPage]
        .filter((item) => item.vote_count >= HOME_MIN_VOTES.rating)
        .slice(0, 10);
}

function getHomeTopSeries(firstPage: TMDBSeries[], secondPage: TMDBSeries[]) {
    return [...firstPage, ...secondPage]
        .filter((item) => item.vote_count >= HOME_MIN_VOTES.rating)
        .filter((item) => !isIndianByCountry(item))
        .slice(0, 10);
}

export default async function HomePage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const language = locale === 'es' ? 'es-ES' : 'en-US';
    const t = await getTranslations({ locale, namespace: 'home' });

    // Fetch server-side data
    const [trendingPage1, trendingPage2, topMoviesPage1, topMoviesPage2, topSeriesPage1, topSeriesPage2] = await Promise.all([
        getTrending('all', 'day', language, 1),
        getTrending('all', 'day', language, 2),
        getTopRatedMovies(1, language),
        getTopRatedMovies(2, language),
        getTopRatedTV(1, language),
        getTopRatedTV(2, language),
    ]);

    const trending = getHomeTrendingItems(trendingPage1.results, trendingPage2.results);
    const topMovies = getHomeTopMovies(topMoviesPage1.results, topMoviesPage2.results);
    const topSeries = getHomeTopSeries(topSeriesPage1.results, topSeriesPage2.results);

    return (
        <HomeClient
            trending={trending}
            topMovies={topMovies}
            topSeries={topSeries}
            translations={{
                heroTitle: t('heroTitle'),
                heroSubtitle: t('heroSubtitle'),
                trendingToday: t('trendingToday'),
                topRatedSeries: t('topRatedSeries'),
                topRatedMovies: t('topRatedMovies'),
                exploreAll: t('exploreAll'),
            }}
        />
    );
}
