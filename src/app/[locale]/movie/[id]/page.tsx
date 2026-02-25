import { getMovieDetails } from '@/lib/api/tmdb';
import { MovieDetailClient } from './movie-detail-client';

export default async function MovieDetailPage({
    params,
}: {
    params: Promise<{ locale: string; id: string }>;
}) {
    const { locale, id } = await params;
    const language = locale === 'es' ? 'es-ES' : 'en-US';

    const movie = await getMovieDetails(parseInt(id, 10), language);

    return <MovieDetailClient movie={movie} />;
}
