import { notFound, redirect } from 'next/navigation';
import { getMovieDetails, searchMovies } from '@/lib/api/tmdb';
import { MovieDetailClient } from './movie-detail-client';
import { findBestMatchBySlug, parseNumericId, slugToSearchQuery, slugifyPathSegment } from '@/lib/slug';

export default async function MovieDetailPage({
    params,
}: {
    params: Promise<{ locale: string; id: string }>;
}) {
    const { locale, id } = await params;
    const language = locale === 'es' ? 'es-ES' : 'en-US';
    const rawId = decodeURIComponent(id);

    let tmdbId = parseNumericId(rawId);

    if (!tmdbId) {
        const search = await searchMovies(slugToSearchQuery(rawId), 1, language);
        const match = findBestMatchBySlug(rawId, search.results || [], (item) => item.title);
        if (!match) {
            notFound();
        }
        tmdbId = match.id;
    }

    const movie = await getMovieDetails(tmdbId, language);
    const canonicalSlug = slugifyPathSegment(movie.title);
    if (rawId !== canonicalSlug) {
        redirect(`/${locale}/movie/${canonicalSlug}`);
    }

    return <MovieDetailClient movie={movie} />;
}
