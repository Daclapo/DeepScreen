'use client';

import { useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Star, Calendar, Clock, Globe, Tv } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TMDB_IMAGE_BASE, TMDB_POSTER_SIZES, TMDB_BACKDROP_SIZES, TMDB_PROFILE_SIZES } from '@/lib/constants';
import { MediaCard } from '@/components/media/media-card';
import { EpisodeHeatmap } from '@/components/heatmap/episode-heatmap';
import { EpisodeList } from '@/components/heatmap/episode-list';
import { SeasonTrendChart } from '@/components/heatmap/season-trend-chart';
import { useTheme } from '@/components/layout/theme-provider';
import type { TMDBSeriesDetail, EpisodeRating } from '@/types';

// ISO country code to emoji flag
function countryToFlag(code: string): string {
    return code
        .toUpperCase()
        .replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397));
}

interface Props {
    series: TMDBSeriesDetail;
    episodeRatings: EpisodeRating[];
}

export function SeriesDetailClient({ series, episodeRatings }: Props) {
    const locale = useLocale();
    const t = useTranslations('media');
    const { theme } = useTheme();
    const [heatmapSeason, setHeatmapSeason] = useState<number | null>(null);

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
    const genres = series.genres?.map(g => g.name) || [];
    const cast = series.credits?.cast?.slice(0, 12) || [];
    const similar = series.recommendations?.results?.slice(0, 10) || series.similar?.results?.slice(0, 10) || [];
    const networks = series.networks || [];

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
                                {series.vote_average > 0 && (
                                    <span className="flex items-center gap-1 text-sm">
                                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                                        <span className="font-semibold">{series.vote_average.toFixed(1)}</span>
                                        <span className="text-muted-foreground">({series.vote_count.toLocaleString()} {t('votes')})</span>
                                    </span>
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
                                        <span key={code} className="text-lg" title={code}>{countryToFlag(code)}</span>
                                    ))}
                                </div>
                            )}
                            <p className="text-muted-foreground leading-relaxed">
                                {series.overview || t('noOverview')}
                            </p>
                        </section>

                        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {creator && (
                                <InfoRow icon={<Star className="h-4 w-4" />} label={t('creator')} value={creator.name} />
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
                        <SeasonTrendChart episodeRatings={episodeRatings} />
                    </TabsContent>

                    {/* Recommendations */}
                    <TabsContent value="recommendations" className="mt-6">
                        {similar.length > 0 ? (
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
                        ) : (
                            <p className="text-muted-foreground text-center py-12">{t('noResults')}</p>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border/50">
            <div className="text-muted-foreground">{icon}</div>
            <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-medium">{value}</p>
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
