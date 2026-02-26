'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Star, Calendar, Clock, Globe, Tv, Loader2, Play, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TMDB_IMAGE_BASE, TMDB_POSTER_SIZES, TMDB_BACKDROP_SIZES, TMDB_PROFILE_SIZES } from '@/lib/constants';
import { MediaCard } from '@/components/media/media-card';
import { EpisodeHeatmap } from '@/components/heatmap/episode-heatmap';
import { EpisodeList } from '@/components/heatmap/episode-list';
import { SeasonTrendChart } from '@/components/heatmap/season-trend-chart';
import { EpisodeRatingChart } from '@/components/heatmap/episode-rating-chart';
import { BingeCalculator } from '@/components/series/binge-calculator';
import { useTheme } from '@/components/layout/theme-provider';
import { useRatingSource } from '@/hooks/use-rating-source';
import { CountryFlag } from '@/components/ui/country-flag';
import { OMDB_KEY_STORAGE_KEY } from '@/lib/constants';
import type { TMDBSeriesDetail, EpisodeRating, OMDbSeasonResponse } from '@/types';

interface Props {
    series: TMDBSeriesDetail;
    episodeRatings: EpisodeRating[];
}

export function SeriesDetailClient({ series, episodeRatings: tvmazeRatings }: Props) {
    const locale = useLocale();
    const t = useTranslations('media');
    const { theme } = useTheme();
    const [heatmapSeason, setHeatmapSeason] = useState<number | null>(null);
    const { ratingSource, omdbKey } = useRatingSource();

    // OMDb episode rating fetching
    const [omdbRatings, setOmdbRatings] = useState<Record<string, number | null>>({});
    const [omdbLoading, setOmdbLoading] = useState(false);

    const imdbId = series.external_ids?.imdb_id;
    const seasons = useMemo(() => {
        const set = new Set(tvmazeRatings.map(e => e.season));
        return Array.from(set).sort((a, b) => a - b);
    }, [tvmazeRatings]);

    useEffect(() => {
        if (ratingSource !== 'imdb' || !omdbKey || !imdbId || seasons.length === 0) {
            setOmdbRatings({});
            return;
        }

        let cancelled = false;
        setOmdbLoading(true);

        const fetchOmdbRatings = async () => {
            const allRatings: Record<string, number | null> = {};
            for (const season of seasons) {
                try {
                    const res = await fetch(`/api/omdb?i=${imdbId}&season=${season}`, {
                        headers: { 'x-omdb-key': omdbKey },
                    });
                    const data: OMDbSeasonResponse = await res.json();
                    if (data.Episodes) {
                        for (const ep of data.Episodes) {
                            const epNum = parseInt(ep.Episode, 10);
                            const rating = ep.imdbRating !== 'N/A' ? parseFloat(ep.imdbRating) : null;
                            allRatings[`${season}-${epNum}`] = rating;
                        }
                    }
                } catch {
                    // If one season fails, continue with others
                }
            }
            if (!cancelled) {
                setOmdbRatings(allRatings);
                setOmdbLoading(false);
            }
        };

        fetchOmdbRatings();
        return () => { cancelled = true; };
    }, [ratingSource, omdbKey, imdbId, seasons]);

    // Merge ratings: use OMDb if available, otherwise fall back to TVMaze
    const episodeRatings = useMemo(() => {
        if (ratingSource !== 'imdb' || Object.keys(omdbRatings).length === 0) {
            return tvmazeRatings;
        }
        return tvmazeRatings.map(ep => {
            const key = `${ep.season}-${ep.episode}`;
            const imdbRating = omdbRatings[key];
            return {
                ...ep,
                rating: imdbRating !== undefined ? imdbRating : ep.rating,
                imdbRating: imdbRating ?? null,
            };
        });
    }, [tvmazeRatings, omdbRatings, ratingSource]);

    const backdropUrl = series.backdrop_path
        ? `${TMDB_IMAGE_BASE}/${TMDB_BACKDROP_SIZES.large}${series.backdrop_path}`
        : null;
    const posterUrl = series.poster_path
        ? `${TMDB_IMAGE_BASE}/${TMDB_POSTER_SIZES.large}${series.poster_path}`
        : null;

    const creator = series.created_by?.[0];
    const firstYear = series.first_air_date?.slice(0, 4);
    const lastYear = series.last_air_date?.slice(0, 4);
    const yearRange = firstYear && lastYear && firstYear !== lastYear ? `${firstYear}–${lastYear}` : firstYear;
    const firstAirDate = series.first_air_date ? new Date(series.first_air_date) : null;
    const daysUntilRelease = firstAirDate
        ? Math.ceil((firstAirDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null;
    const isUpcoming = daysUntilRelease !== null && daysUntilRelease >= 0 && series.status !== 'Returning Series' && series.status !== 'Ended';

    // External links
    const imdbUrl = imdbId ? `https://www.imdb.com/title/${imdbId}/` : null;
    const genres = series.genres?.map(g => g.name) || [];
    const cast = series.credits?.cast?.slice(0, 12) || [];

    const allSimilar = series.recommendations?.results || series.similar?.results || [];
    const [recsPage, setRecsPage] = useState(0);
    const recsVisible = Math.min((recsPage + 1) * 10, 50, allSimilar.length);
    const similar = allSimilar.slice(0, recsVisible);

    // On-demand IMDb rating
    const [imdbSeriesRating, setImdbSeriesRating] = useState<string | null>(null);
    const [imdbSeriesLoading, setImdbSeriesLoading] = useState(false);
    const fetchImdbSeriesRating = useCallback(async () => {
        const key = localStorage.getItem(OMDB_KEY_STORAGE_KEY);
        const iid = series.external_ids?.imdb_id;
        if (!key || !iid) return;
        setImdbSeriesLoading(true);
        try {
            const res = await fetch(`/api/omdb?i=${iid}`, { headers: { 'x-omdb-key': key } });
            const data = await res.json();
            if (data.imdbRating && data.imdbRating !== 'N/A') {
                setImdbSeriesRating(data.imdbRating);
            }
        } catch { /* silently fail */ }
        setImdbSeriesLoading(false);
    }, [series.external_ids?.imdb_id]);

    const networks = series.networks || [];

    // Find YouTube trailer
    const trailer = series.videos?.results?.find(
        v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
    );

    const statusMap: Record<string, string> = {
        'Returning Series': t('returningSeries'),
        'Ended': t('ended'),
        'Canceled': t('cancelled'),
        'In Production': t('inProduction'),
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

                <div className="absolute bottom-0 left-0 right-0 px-4 pb-8 sm:px-6">
                    <div className="mx-auto max-w-7xl flex gap-6 items-end">
                        {posterUrl && (
                            <div className="hidden sm:block relative h-48 w-32 rounded-lg overflow-hidden shadow-2xl border border-border/30 flex-shrink-0">
                                <Image src={posterUrl} alt={series.name} fill className="object-cover" />
                            </div>
                        )}
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <Badge variant="secondary" className="text-xs">{t('series')}</Badge>
                                {yearRange && <span className="text-sm text-muted-foreground">{yearRange}</span>}
                                {series.status && (
                                    <Badge variant="outline" className="text-xs">{statusMap[series.status] || series.status}</Badge>
                                )}
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-bold mb-1">{series.name}</h1>
                            {series.tagline && (
                                <p className="text-sm text-muted-foreground italic mb-2">{series.tagline}</p>
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
                                        {series.vote_average > 0 && (
                                            <span className="flex items-center gap-1 text-sm">
                                                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                                                <span className="font-semibold">{series.vote_average.toFixed(1)}</span>
                                                <span className="text-muted-foreground text-xs">TMDB</span>
                                            </span>
                                        )}
                                        {imdbSeriesRating && (
                                            <span className="flex items-center gap-1 text-sm">
                                                <span className="font-bold text-yellow-400 text-xs bg-yellow-400/10 px-1.5 py-0.5 rounded">IMDb</span>
                                                <span className="font-semibold">{imdbSeriesRating}</span>
                                            </span>
                                        )}
                                        {!imdbSeriesRating && series.external_ids?.imdb_id && (
                                            <button
                                                onClick={fetchImdbSeriesRating}
                                                disabled={imdbSeriesLoading}
                                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors opacity-70 hover:opacity-100"
                                            >
                                                <span className="font-medium text-yellow-400/70 bg-yellow-400/5 px-1.5 py-0.5 rounded text-[10px]">{imdbSeriesLoading ? '...' : 'IMDb'}</span>
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
                                <span className="text-sm text-muted-foreground">
                                    {series.number_of_seasons} {t('seasons')} · {series.number_of_episodes} {t('episodes')}
                                </span>
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
                        <TabsTrigger value="episodes">{t('episodes')}</TabsTrigger>
                        <TabsTrigger value="stats">{t('stats')}</TabsTrigger>
                        <TabsTrigger value="binge">Binge</TabsTrigger>
                        <TabsTrigger value="recommendations">{t('recommendations')}</TabsTrigger>
                    </TabsList>

                    {/* Overview + Cast (merged) */}
                    <TabsContent value="overview" className="space-y-8 mt-6">
                        <section>
                            <h2 className="text-lg font-semibold mb-1">{t('synopsis')}</h2>
                            {/* Country flags */}
                            {series.origin_country && series.origin_country.length > 0 && (
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-xs text-muted-foreground">{t('origin')}:</span>
                                    {series.origin_country.map(code => (
                                        <CountryFlag key={code} countryCode={code} title={code} className="shadow-sm" />
                                    ))}
                                </div>
                            )}
                            <p className="text-muted-foreground leading-relaxed">
                                {series.overview || t('noOverview')}
                            </p>
                        </section>

                        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {creator && (
                                <InfoRow
                                    icon={<Star className="h-4 w-4" />}
                                    label={t('creator')}
                                    value={
                                        <Link href={`/${locale}/person/${creator.id}`} className="hover:text-primary transition-colors hover:underline">
                                            {creator.name}
                                        </Link>
                                    }
                                />
                            )}
                            {series.first_air_date && (
                                <InfoRow icon={<Calendar className="h-4 w-4" />} label={t('firstAired')} value={series.first_air_date} />
                            )}
                            {series.last_air_date && (
                                <InfoRow icon={<Calendar className="h-4 w-4" />} label={t('lastAired')} value={series.last_air_date} />
                            )}
                            {networks.length > 0 && (
                                <InfoRow icon={<Tv className="h-4 w-4" />} label={t('network')} value={networks.map(n => n.name).join(', ')} />
                            )}
                        </section>

                        {/* Cast (merged) */}
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

                    {/* Episodes (Heatmap) */}
                    <TabsContent value="episodes" className="mt-6">
                        {/* Rating source indicator */}
                        <div className="flex items-center gap-2 mb-4">
                            <Badge variant="secondary" className="text-xs gap-1">
                                {ratingSource === 'imdb' ? '⭐ IMDb' : '📊 TVMaze'}
                            </Badge>
                            {omdbLoading && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    Loading IMDb ratings...
                                </span>
                            )}
                        </div>
                        <EpisodeHeatmap episodeRatings={episodeRatings} onSeasonChange={setHeatmapSeason} />
                        <EpisodeList episodeRatings={episodeRatings} selectedSeason={heatmapSeason} />
                    </TabsContent>

                    {/* Stats */}
                    <TabsContent value="stats" className="space-y-6 mt-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard label={t('rating')} value={series.vote_average > 0 ? series.vote_average.toFixed(1) : '—'} />
                            <StatCard label={t('votes')} value={series.vote_count > 0 ? series.vote_count.toLocaleString() : '—'} />
                            <StatCard label={t('seasons')} value={String(series.number_of_seasons)} />
                            <StatCard label={t('episodes')} value={String(series.number_of_episodes)} />
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <SeasonTrendChart episodeRatings={episodeRatings} />
                            <EpisodeRatingChart episodeRatings={episodeRatings} />
                        </div>
                    </TabsContent>

                    {/* Binge Calculator */}
                    <TabsContent value="binge" className="mt-6">
                        <div className="max-w-lg">
                            <BingeCalculator
                                totalEpisodes={series.number_of_episodes}
                                episodeRunTime={series.episode_run_time || []}
                                seriesName={series.name}
                            />
                        </div>
                    </TabsContent>

                    {/* Recommendations */}
                    <TabsContent value="recommendations" className="mt-6">
                        {similar.length > 0 ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {similar.map(s => (
                                        <MediaCard
                                            key={s.id}
                                            id={s.id}
                                            title={s.name}
                                            posterPath={s.poster_path}
                                            mediaType="tv"
                                            year={s.first_air_date?.slice(0, 4)}
                                            rating={s.vote_average}
                                            releaseDate={s.first_air_date}
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
