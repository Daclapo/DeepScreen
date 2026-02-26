'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Star, Calendar, Clock, DollarSign, Globe, Play, X, Maximize2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TMDB_IMAGE_BASE, TMDB_POSTER_SIZES, TMDB_BACKDROP_SIZES, TMDB_PROFILE_SIZES } from '@/lib/constants';
import { MOVIE_GENRES } from '@/lib/constants';
import { MediaCard } from '@/components/media/media-card';
import { useTheme } from '@/components/layout/theme-provider';
import { CountryFlag } from '@/components/ui/country-flag';
import { OMDB_KEY_STORAGE_KEY } from '@/lib/constants';
import type { TMDBMovieDetail } from '@/types';

interface Props {
    movie: TMDBMovieDetail;
}

export function MovieDetailClient({ movie }: Props) {
    const locale = useLocale();
    const t = useTranslations('media');
    const { theme } = useTheme();

    const backdropUrl = movie.backdrop_path
        ? `${TMDB_IMAGE_BASE}/${TMDB_BACKDROP_SIZES.large}${movie.backdrop_path}`
        : null;
    const posterUrl = movie.poster_path
        ? `${TMDB_IMAGE_BASE}/${TMDB_POSTER_SIZES.large}${movie.poster_path}`
        : null;

    const director = movie.credits?.crew?.find(c => c.job === 'Director');
    const year = movie.release_date?.slice(0, 4);
    const genres = movie.genres?.map(g => g.name) || [];
    const cast = movie.credits?.cast?.slice(0, 12) || [];

    const allSimilar = movie.recommendations?.results || movie.similar?.results || [];
    const [recsPage, setRecsPage] = useState(0);
    const recsVisible = Math.min((recsPage + 1) * 10, 50, allSimilar.length);
    const similar = allSimilar.slice(0, recsVisible);

    // Poster lightbox
    const [showLightbox, setShowLightbox] = useState(false);
    const fullPosterUrl = movie.poster_path
        ? `${TMDB_IMAGE_BASE}/${TMDB_POSTER_SIZES.original}${movie.poster_path}`
        : null;

    useEffect(() => {
        if (!showLightbox) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowLightbox(false); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [showLightbox]);

    // External links
    const imdbId = movie.external_ids?.imdb_id;
    const imdbUrl = imdbId ? `https://www.imdb.com/title/${imdbId}/` : null;
    const letterboxdSlug = movie.original_title
        ?.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    const letterboxdUrl = letterboxdSlug ? `https://letterboxd.com/film/${letterboxdSlug}/` : null;

    // On-demand IMDb rating
    const [imdbRating, setImdbRating] = useState<string | null>(null);
    const [imdbLoading, setImdbLoading] = useState(false);
    const fetchImdbRating = useCallback(async () => {
        const key = localStorage.getItem(OMDB_KEY_STORAGE_KEY);
        if (!key || !imdbId) return;
        setImdbLoading(true);
        try {
            const res = await fetch(`/api/omdb?i=${imdbId}`, { headers: { 'x-omdb-key': key } });
            const data = await res.json();
            if (data.imdbRating && data.imdbRating !== 'N/A') {
                setImdbRating(data.imdbRating);
            }
        } catch { /* silently fail */ }
        setImdbLoading(false);
    }, [imdbId]);

    // Release countdown
    const releaseDate = movie.release_date ? new Date(movie.release_date) : null;
    const daysUntilRelease = releaseDate
        ? Math.ceil((releaseDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null;
    const isUpcoming = daysUntilRelease !== null && daysUntilRelease >= 0 && movie.status !== 'Released';

    // Find YouTube trailer
    const trailer = movie.videos?.results?.find(
        v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
    );

    const formatCurrency = (value: number) => {
        if (value === 0) return '—';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
    };

    return (
        <div>
            {/* Hero with backdrop */}
            <div className="relative h-[400px] sm:h-[450px] overflow-hidden">
                {backdropUrl && (
                    <Image
                        src={backdropUrl}
                        alt=""
                        fill
                        className="object-cover object-top"
                        priority
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/20" />

                {/* Movie info overlay */}
                <div className="absolute bottom-0 left-0 right-0 px-4 pb-8 sm:px-6">
                    <div className="mx-auto max-w-7xl flex gap-6 items-end">
                        {posterUrl && (
                            <button
                                onClick={() => setShowLightbox(true)}
                                className="hidden sm:block relative h-48 w-32 rounded-lg overflow-hidden shadow-2xl border border-border/30 flex-shrink-0 cursor-zoom-in group"
                            >
                                <Image src={posterUrl} alt={movie.title} fill className="object-cover" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                    <Maximize2 className="h-5 w-5 text-white opacity-0 group-hover:opacity-80 transition-opacity" />
                                </div>
                            </button>
                        )}
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <Badge variant="secondary" className="text-xs">{t('movie')}</Badge>
                                {year && <span className="text-sm text-muted-foreground">{year}</span>}
                                {movie.status === 'Released' && <span className="text-sm text-muted-foreground">{movie.status}</span>}
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-bold mb-1">{movie.title}</h1>
                            {movie.tagline && (
                                <p className="text-sm text-muted-foreground italic mb-2">{movie.tagline}</p>
                            )}
                            <div className="flex items-center gap-4 flex-wrap">
                                {isUpcoming ? (
                                    <span className="flex items-center gap-1.5 text-sm">
                                        <Calendar className="h-4 w-4 text-blue-400" />
                                        <span className="font-semibold text-blue-400">
                                            {daysUntilRelease === 0
                                                ? t('releaseToday')
                                                : daysUntilRelease === 1
                                                    ? t('releaseTomorrow')
                                                    : t('releaseInDays', { days: daysUntilRelease })}
                                        </span>
                                    </span>
                                ) : (
                                    <>
                                        {movie.vote_average > 0 && (
                                            <span className="flex items-center gap-1 text-sm">
                                                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                                                <span className="font-semibold">{movie.vote_average.toFixed(1)}</span>
                                                <span className="text-muted-foreground text-xs">TMDB</span>
                                            </span>
                                        )}
                                        {imdbRating && (
                                            <span className="flex items-center gap-1 text-sm">
                                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                <span className="font-semibold">{imdbRating}</span>
                                                <span className="text-muted-foreground text-xs">IMDb</span>
                                            </span>
                                        )}
                                        {!imdbRating && imdbId && (
                                            <button
                                                onClick={fetchImdbRating}
                                                disabled={imdbLoading}
                                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                                title="Fetch IMDb rating"
                                            >
                                                <Star className="h-3.5 w-3.5 text-yellow-400/50" />
                                                <span className="text-yellow-400/60 text-[11px]">{imdbLoading ? '...' : 'IMDb ★'}</span>
                                            </button>
                                        )}
                                    </>
                                )}
                                {imdbUrl && (
                                    <a
                                        href={imdbUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-xs hover:opacity-100 opacity-80 transition-opacity"
                                    >
                                        <span className="font-bold text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded text-[11px]">IMDb</span>
                                        <ExternalLink className="h-3 w-3 text-yellow-400/60" />
                                    </a>
                                )}
                                {letterboxdUrl && (
                                    <a
                                        href={letterboxdUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-xs hover:opacity-100 opacity-80 transition-opacity"
                                    >
                                        <span className="font-bold text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded text-[11px]">Letterboxd</span>
                                        <ExternalLink className="h-3 w-3 text-green-400/60" />
                                    </a>
                                )}
                                {movie.runtime && (
                                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <Clock className="h-3.5 w-3.5" />
                                        {movie.runtime} min
                                    </span>
                                )}
                            </div>
                            {genres.length > 0 && (
                                <div className="flex gap-2 mt-3 flex-wrap">
                                    {genres.map(g => (
                                        <Badge key={g} variant="outline" className="text-xs">{g}</Badge>
                                    ))}
                                </div>
                            )}
                            {trailer && (
                                <div className="mt-3">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2"
                                        onClick={() => window.open(`https://www.youtube.com/watch?v=${trailer.key}`, '_blank')}
                                    >
                                        <Play className="h-4 w-4 fill-current" />
                                        {t('watchTrailer')}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content tabs */}
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
                <Tabs defaultValue="overview">
                    <TabsList>
                        <TabsTrigger value="overview">{t('overview')}</TabsTrigger>
                        <TabsTrigger value="stats">{t('stats')}</TabsTrigger>
                        <TabsTrigger value="recommendations">{t('recommendations')}</TabsTrigger>
                    </TabsList>

                    {/* Overview + Cast (merged) */}
                    <TabsContent value="overview" className="space-y-8 mt-6">
                        {/* Synopsis */}
                        <section>
                            <h2 className="text-lg font-semibold mb-1">{t('synopsis')}</h2>
                            {/* Country flags */}
                            {movie.production_countries && movie.production_countries.length > 0 && (
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-xs text-muted-foreground">{t('origin')}:</span>
                                    {movie.production_countries.map(c => (
                                        <CountryFlag key={c.iso_3166_1} countryCode={c.iso_3166_1} title={c.name} className="shadow-sm" />
                                    ))}
                                </div>
                            )}
                            <p className="text-muted-foreground leading-relaxed">
                                {movie.overview || t('noOverview')}
                            </p>
                        </section>

                        {/* Key Info */}
                        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {director && (
                                <InfoRow
                                    icon={<Star className="h-4 w-4" />}
                                    label={t('director')}
                                    value={
                                        <Link href={`/${locale}/person/${director.id}`} className="hover:text-primary transition-colors hover:underline">
                                            {director.name}
                                        </Link>
                                    }
                                />
                            )}
                            {movie.release_date && (
                                <InfoRow icon={<Calendar className="h-4 w-4" />} label={t('releaseDate')} value={movie.release_date} />
                            )}
                            {movie.original_language && (
                                <InfoRow icon={<Globe className="h-4 w-4" />} label={t('originalLanguage')} value={movie.original_language.toUpperCase()} />
                            )}
                            {movie.runtime && (
                                <InfoRow icon={<Clock className="h-4 w-4" />} label={t('runtime')} value={`${movie.runtime} min`} />
                            )}
                        </section>

                        {/* Cast (merged from old Cast tab) */}
                        {cast.length > 0 && (
                            <section>
                                <h2 className="text-lg font-semibold mb-4">{t('cast')}</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    {cast.map(member => (
                                        <Link
                                            key={member.id}
                                            href={`/${locale}/person/${member.id}`}
                                            className="group text-center"
                                        >
                                            <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-2 border border-border/30">
                                                {member.profile_path ? (
                                                    <Image
                                                        src={`${TMDB_IMAGE_BASE}/${TMDB_PROFILE_SIZES.medium}${member.profile_path}`}
                                                        alt={member.name}
                                                        fill
                                                        sizes="150px"
                                                        className="object-cover group-hover:scale-105 transition-transform"
                                                    />
                                                ) : (
                                                    <div
                                                        className="absolute inset-0 flex items-center justify-center"
                                                        style={{ backgroundColor: theme === 'dark' ? 'rgb(21, 27, 33)' : 'rgb(233, 235, 238)' }}
                                                    >
                                                        <Image
                                                            src={theme === 'dark' ? '/images/actor-placeholder-dark.png' : '/images/actor-placeholder-light.png'}
                                                            alt=""
                                                            fill
                                                            sizes="150px"
                                                            className="object-contain p-2"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{member.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{member.character}</p>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}
                    </TabsContent>

                    {/* Stats */}
                    <TabsContent value="stats" className="space-y-6 mt-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard label={t('rating')} value={movie.vote_average > 0 ? movie.vote_average.toFixed(1) : '—'} />
                            <StatCard label={t('votes')} value={movie.vote_count > 0 ? movie.vote_count.toLocaleString() : '—'} />
                            <StatCard label={t('budget')} value={formatCurrency(movie.budget)} />
                            <StatCard label={t('revenue')} value={formatCurrency(movie.revenue)} />
                        </div>
                        {movie.budget > 0 && movie.revenue > 0 && (
                            <div className="rounded-lg border border-border p-4 bg-card">
                                <p className="text-sm text-muted-foreground">ROI</p>
                                <p className="text-2xl font-bold">
                                    {((movie.revenue / movie.budget - 1) * 100).toFixed(0)}%
                                </p>
                            </div>
                        )}
                    </TabsContent>

                    {/* Recommendations */}
                    <TabsContent value="recommendations" className="mt-6">
                        {similar.length > 0 ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {similar.map(m => (
                                        <MediaCard
                                            key={m.id}
                                            id={m.id}
                                            title={m.title}
                                            posterPath={m.poster_path}
                                            mediaType="movie"
                                            year={m.release_date?.slice(0, 4)}
                                            rating={m.vote_average}
                                            releaseDate={m.release_date}
                                        />
                                    ))}
                                </div>
                                {allSimilar.length > 10 && (
                                    <div className="flex justify-center gap-3">
                                        {recsVisible < Math.min(50, allSimilar.length) && (
                                            <Button variant="outline" onClick={() => setRecsPage(p => p + 1)}>
                                                {t('showMore')}
                                            </Button>
                                        )}
                                        {recsPage > 0 && (
                                            <Button variant="outline" onClick={() => setRecsPage(0)}>
                                                {t('showLess')}
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center py-12">{t('noResults')}</p>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            {/* Poster Lightbox */}
            {showLightbox && fullPosterUrl && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm cursor-zoom-out"
                    onClick={() => setShowLightbox(false)}
                >
                    <button
                        className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center z-10"
                        onClick={() => setShowLightbox(false)}
                    >
                        <X className="h-5 w-5 text-white" />
                    </button>
                    <div className="relative max-h-[90vh] max-w-[90vw]" onClick={e => e.stopPropagation()}>
                        <Image
                            src={fullPosterUrl}
                            alt={movie.title}
                            width={800}
                            height={1200}
                            className="object-contain max-h-[90vh] rounded-lg shadow-2xl"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border/50">
            <div className="text-muted-foreground">{icon}</div>
            <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <div className="text-sm font-medium">{value}</div>
            </div>
        </div>
    );
}

function StatCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border border-border p-4 bg-card">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="text-xl font-bold">{value}</p>
        </div>
    );
}
