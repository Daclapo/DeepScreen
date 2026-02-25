'use client';

import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { MediaCard } from '@/components/media/media-card';
import { MediaGridSkeleton } from '@/components/media/skeletons';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useState, Suspense } from 'react';

function SearchContent() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';
    const locale = useLocale();
    const t = useTranslations('media');
    const tD = useTranslations('discover');
    const [filter, setFilter] = useState<'all' | 'movie' | 'tv'>('all');
    const [page, setPage] = useState(1);

    const language = locale === 'es' ? 'es-ES' : 'en-US';
    const endpoint = filter === 'all' ? 'search/multi' : filter === 'movie' ? 'search/movie' : 'search/tv';

    const { data, isLoading } = useQuery({
        queryKey: ['search', endpoint, query, page, language],
        queryFn: async () => {
            const res = await fetch(`/api/tmdb/${endpoint}?query=${encodeURIComponent(query)}&page=${page}&language=${language}`);
            return res.json();
        },
        enabled: !!query,
    });

    const results = (data?.results || []).filter(
        (r: { media_type?: string }) => !r.media_type || r.media_type === 'movie' || r.media_type === 'tv'
    );

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            <h1 className="text-2xl font-bold mb-1">{query ? `"${query}"` : ''}</h1>
            {data && (
                <p className="text-sm text-muted-foreground mb-6">
                    {data.total_results || 0} {t('noResults') !== t('noResults') ? '' : 'results'}
                </p>
            )}

            <Tabs value={filter} onValueChange={(v) => { setFilter(v as 'all' | 'movie' | 'tv'); setPage(1); }} className="mb-6">
                <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="movie">{tD('movies')}</TabsTrigger>
                    <TabsTrigger value="tv">{tD('tvShows')}</TabsTrigger>
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {results.map((r: { id: number; media_type?: string; title?: string; name?: string; poster_path: string | null; release_date?: string; first_air_date?: string; vote_average?: number }) => {
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

                    {/* Pagination */}
                    {data && data.total_pages > 1 && (
                        <div className="flex items-center justify-center gap-4 mt-8">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page <= 1}
                                onClick={() => setPage((p) => p - 1)}
                            >
                                Previous
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                {page} / {data.total_pages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page >= data.total_pages}
                                onClick={() => setPage((p) => p + 1)}
                            >
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
