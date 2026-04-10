import { notFound, redirect } from 'next/navigation';
import { getSeriesDetails } from '@/lib/api/tmdb';
import { searchTV } from '@/lib/api/tmdb';
import { getShowByImdbId, getEpisodes } from '@/lib/api/tvmaze';
import { SeriesDetailClient } from './series-detail-client';
import type { EpisodeRating } from '@/types';
import { findBestMatchBySlug, parseNumericId, slugToSearchQuery, slugifyPathSegment } from '@/lib/slug';

export default async function SeriesDetailPage({
    params,
}: {
    params: Promise<{ locale: string; id: string }>;
}) {
    const { locale, id } = await params;
    const language = locale === 'es' ? 'es-ES' : 'en-US';
    const rawId = decodeURIComponent(id);

    let tmdbId = parseNumericId(rawId);

    if (!tmdbId) {
        const search = await searchTV(slugToSearchQuery(rawId), 1, language);
        const match = findBestMatchBySlug(rawId, search.results || [], (item) => item.name);
        if (!match) {
            notFound();
        }
        tmdbId = match.id;
    }

    const series = await getSeriesDetails(tmdbId, language);
    const canonicalSlug = slugifyPathSegment(series.name);
    if (rawId !== canonicalSlug) {
        redirect(`/${locale}/series/${canonicalSlug}`);
    }

    // Get episode ratings from TVMaze
    let episodeRatings: EpisodeRating[] = [];

    try {
        const imdbId = series.external_ids?.imdb_id;
        if (imdbId) {
            const tvmazeShow = await getShowByImdbId(imdbId);
            if (tvmazeShow) {
                const episodes = await getEpisodes(tvmazeShow.id);
                episodeRatings = episodes
                    .filter((ep) => ep.season > 0 && ep.number > 0) // Filter specials
                    .map((ep) => ({
                        season: ep.season,
                        episode: ep.number,
                        title: ep.name,
                        rating: ep.rating.average,
                        airDate: ep.airdate || null,
                        imdbRating: null, // Will be filled by OMDb on client if key available
                    }));
            }
        }
    } catch {
        // TVMaze lookup failed, continue without episode ratings
    }

    return <SeriesDetailClient series={series} episodeRatings={episodeRatings} />;
}
