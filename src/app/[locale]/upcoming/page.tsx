'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MediaCard } from '@/components/media/media-card';
import { MediaGridSkeleton } from '@/components/media/skeletons';

export default function UpcomingPage() {
    const locale = useLocale();
    const t = useTranslations('upcoming');
    const language = locale === 'es' ? 'es-ES' : 'en-US';
    const [tab, setTab] = useState<'movie' | 'tv'>('movie');

    const today = new Date().toISOString().split('T')[0];

    const { data: movieData, isLoading: moviesLoading } = useQuery({
        queryKey: ['upcoming', 'movies', language],
        queryFn: async () => {
            const res = await fetch(`/api/tmdb/movie/upcoming?language=${language}&page=1`);
            return res.json();
        },
    });

    const { data: tvData, isLoading: tvLoading } = useQuery({
        queryKey: ['upcoming', 'tv', language, today],
        queryFn: async () => {
            const res = await fetch(`/api/tmdb/discover/tv?language=${language}&first_air_date.gte=${today}&sort_by=popularity.desc&page=1`);
            return res.json();
        },
    });

    const upcomingMovies = (movieData?.results || []).filter(
        (m: { release_date: string }) => m.release_date && m.release_date > today
    );

    const upcomingSeries = tvData?.results || [];

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            <h1 className="text-2xl font-bold mb-1">{t('title')}</h1>
            <p className="text-sm text-muted-foreground mb-6">{t('subtitle')}</p>

            <Tabs value={tab} onValueChange={(v) => setTab(v as 'movie' | 'tv')} className="mb-6">
                <TabsList>
                    <TabsTrigger value="movie">{t('upcomingMovies')}</TabsTrigger>
                    <TabsTrigger value="tv">{t('upcomingSeries')}</TabsTrigger>
                </TabsList>
            </Tabs>

            {tab === 'movie' ? (
                moviesLoading ? (
                    <MediaGridSkeleton count={20} />
                ) : upcomingMovies.length === 0 ? (
                    <div className="flex items-center justify-center py-24 text-muted-foreground">
                        No upcoming movies found
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {upcomingMovies.map((m: { id: number; title: string; poster_path: string | null; release_date: string; vote_average: number }) => (
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
                )
            ) : (
                tvLoading ? (
                    <MediaGridSkeleton count={20} />
                ) : upcomingSeries.length === 0 ? (
                    <div className="flex items-center justify-center py-24 text-muted-foreground">
                        No upcoming series found
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {upcomingSeries.map((s: { id: number; name: string; poster_path: string | null; first_air_date: string; vote_average: number }) => (
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
                )
            )}
        </div>
    );
}
