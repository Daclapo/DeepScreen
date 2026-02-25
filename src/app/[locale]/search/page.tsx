'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { User } from 'lucide-react';
import { MediaCard } from '@/components/media/media-card';
import { MediaGridSkeleton } from '@/components/media/skeletons';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useState, Suspense } from 'react';
import { TMDB_IMAGE_BASE, TMDB_PROFILE_SIZES } from '@/lib/constants';
import { useTheme } from '@/components/layout/theme-provider';

function SearchContent() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';
    const locale = useLocale();
    const t = useTranslations('media');
    const tD = useTranslations('discover');
    const tP = useTranslations('person');
    const { theme } = useTheme();
    const [filter, setFilter] = useState<'all' | 'movie' | 'tv' | 'person'>('all');
    const [page, setPage] = useState(1);

    const language = locale === 'es' ? 'es-ES' : 'en-US';
    const endpointMap = { all: 'search/multi', movie: 'search/movie', tv: 'search/tv', person: 'search/person' };
    const endpoint = endpointMap[filter];

    const { data, isLoading } = useQuery({
        queryKey: ['search', endpoint, query, page, language],
        queryFn: async () => {
            const res = await fetch(`/api/tmdb/${endpoint}?query=${encodeURIComponent(query)}&page=${page}&language=${language}`);
            return res.json();
        },
        enabled: !!query,
    });

    // Filter results for "all" tab - include movies, tv, and people
    const results = (data?.results || []).filter(
        (r: { media_type?: string }) =>
            filter !== 'all' || !r.media_type || r.media_type === 'movie' || r.media_type === 'tv' || r.media_type === 'person'
    );

    const mediaResults = results.filter((r: { media_type?: string }) =>
        (r.media_type || filter) === 'movie' || (r.media_type || filter) === 'tv'
    );
    const personResults = results.filter((r: { media_type?: string }) =>
        (r.media_type || filter) === 'person'
    );

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            <h1 className="text-2xl font-bold mb-1">{query ? `"${query}"` : ''}</h1>
            {data && (
                <p className="text-sm text-muted-foreground mb-6">
                    {data.total_results || 0} results
                </p>
            )}

            <Tabs value={filter} onValueChange={(v) => { setFilter(v as typeof filter); setPage(1); }} className="mb-6">
                <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="movie">{tD('movies')}</TabsTrigger>
                    <TabsTrigger value="tv">{tD('tvShows')}</TabsTrigger>
                    <TabsTrigger value="person">{tP('people')}</TabsTrigger>
                </TabsList>
            </Tabs>

            {isLoading ? (
                <MediaGridSkeleton count={20} />
            ) : results.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                    <p className="text-lg">{t('noResults')}</p>
                </div>
            ) : (
                <>
                    {/* Media results (movies / tv) */}
                    {(filter === 'all' || filter === 'movie' || filter === 'tv') && mediaResults.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
                            {mediaResults.map((r: { id: number; media_type?: string; title?: string; name?: string; poster_path: string | null; release_date?: string; first_air_date?: string; vote_average?: number }) => {
                                const mediaType = (r.media_type || filter) as 'movie' | 'tv';
                                return (
                                    <MediaCard
                                        key={`${mediaType}-${r.id}`}
                                        id={r.id}
                                        title={mediaType === 'movie' ? r.title || '' : r.name || ''}
                                        posterPath={r.poster_path}
                                        mediaType={mediaType}
                                        year={(mediaType === 'movie' ? r.release_date : r.first_air_date)?.slice(0, 4)}
                                        rating={r.vote_average}
                                    />
                                );
                            })}
                        </div>
                    )}

                    {/* Person results */}
                    {(filter === 'all' || filter === 'person') && personResults.length > 0 && (
                        <>
                            {filter === 'all' && <h2 className="text-lg font-semibold mb-4">{tP('people')}</h2>}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
                                {personResults.map((p: { id: number; name: string; profile_path: string | null; known_for_department?: string }) => (
                                    <Link
                                        key={p.id}
                                        href={`/${locale}/person/${p.id}`}
                                        className="group text-center"
                                    >
                                        <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-2 border border-border/30 bg-muted">
                                            {p.profile_path ? (
                                                <Image
                                                    src={`${TMDB_IMAGE_BASE}/${TMDB_PROFILE_SIZES.medium}${p.profile_path}`}
                                                    alt={p.name}
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
                                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{p.name}</p>
                                        {p.known_for_department && (
                                            <p className="text-xs text-muted-foreground">{p.known_for_department}</p>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Pagination */}
                    {data && data.total_pages > 1 && (
                        <div className="flex items-center justify-center gap-4 mt-8">
                            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                                Previous
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                {page} / {data.total_pages}
                            </span>
                            <Button variant="outline" size="sm" disabled={page >= data.total_pages} onClick={() => setPage((p) => p + 1)}>
                                Next
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6"><MediaGridSkeleton count={20} /></div>}>
            <SearchContent />
        </Suspense>
    );
}
