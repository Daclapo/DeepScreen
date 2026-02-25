import { getTranslations } from 'next-intl/server';
import { getTrending, getTopRatedMovies, getTopRatedTV } from '@/lib/api/tmdb';
import { HomeClient } from './home-client';

export default async function HomePage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const language = locale === 'es' ? 'es-ES' : 'en-US';
    const t = await getTranslations({ locale, namespace: 'home' });

    // Fetch server-side data
    const [trending, topMovies, topSeries] = await Promise.all([
        getTrending('all', 'day', language),
        getTopRatedMovies(1, language),
        getTopRatedTV(1, language),
    ]);

    return (
        <HomeClient
            trending={trending.results.slice(0, 10)}
            topMovies={topMovies.results.slice(0, 10)}
            topSeries={topSeries.results.slice(0, 10)}
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
