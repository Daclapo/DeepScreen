'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Star, Calendar, Clock, DollarSign, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TMDB_IMAGE_BASE, TMDB_POSTER_SIZES, TMDB_BACKDROP_SIZES, TMDB_PROFILE_SIZES } from '@/lib/constants';
import { MOVIE_GENRES } from '@/lib/constants';
import { MediaCard } from '@/components/media/media-card';
import { useTheme } from '@/components/layout/theme-provider';
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
    const similar = movie.recommendations?.results?.slice(0, 10) || movie.similar?.results?.slice(0, 10) || [];

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
                            <div className="hidden sm:block relative h-48 w-32 rounded-lg overflow-hidden shadow-2xl border border-border/30 flex-shrink-0">
                                <Image src={posterUrl} alt={movie.title} fill className="object-cover" />
                            </div>
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
                                {movie.vote_average > 0 && (
                                    <span className="flex items-center gap-1 text-sm">
                                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                                        <span className="font-semibold">{movie.vote_average.toFixed(1)}</span>
                                        <span className="text-muted-foreground">({movie.vote_count.toLocaleString()} {t('votes')})</span>
                                    </span>
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
                            <h2 className="text-lg font-semibold mb-3">{t('overview')}</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                {movie.overview || t('noOverview')}
                            </p>
                        </section>

                        {/* Key Info */}
                        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {director && (
                                <InfoRow icon={<Star className="h-4 w-4" />} label={t('director')} value={director.name} />
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
