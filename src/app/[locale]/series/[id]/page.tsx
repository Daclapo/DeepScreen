import { getSeriesDetails, getExternalIds } from '@/lib/api/tmdb';
import { getShowByImdbId, getEpisodes } from '@/lib/api/tvmaze';
import { SeriesDetailClient } from './series-detail-client';
import type { EpisodeRating } from '@/types';

export default async function SeriesDetailPage({
    params,
}: {
    params: Promise<{ locale: string; id: string }>;
}) {
    const { locale, id } = await params;
    const language = locale === 'es' ? 'es-ES' : 'en-US';
    const tmdbId = parseInt(id, 10);

    const series = await getSeriesDetails(tmdbId, language);

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
