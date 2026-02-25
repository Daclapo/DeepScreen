'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Grid3X3, List, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { MediaCard } from '@/components/media/media-card';
import { CompactMediaRow } from '@/components/media/compact-media-row';
import { MediaGridSkeleton } from '@/components/media/skeletons';
import { MOVIE_GENRES, TV_GENRES, DEFAULT_MIN_VOTES, ITEMS_PER_PAGE_OPTIONS } from '@/lib/constants';
import type { MediaType } from '@/types';

export default function DiscoverPage() {
    const locale = useLocale();
    const t = useTranslations('discover');
    const language = locale === 'es' ? 'es-ES' : 'en-US';

    const [mediaType, setMediaType] = useState<MediaType>('movie');
    const [genres, setGenres] = useState<number[]>([]);
    const [sortBy, setSortBy] = useState('popularity.desc');
    const [yearFrom, setYearFrom] = useState('');
    const [yearTo, setYearTo] = useState('');
    const [ratingMin, setRatingMin] = useState('');
    const [ratingMax, setRatingMax] = useState('');
    const [minVotes, setMinVotes] = useState(String(DEFAULT_MIN_VOTES));
    const [page, setPage] = useState(1);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [perPage, setPerPage] = useState(20);
    const [showFilters, setShowFilters] = useState(true);

    const genreMap = mediaType === 'movie' ? MOVIE_GENRES : TV_GENRES;

    // Auto-set min votes when sorting by rating
    useEffect(() => {
        if (sortBy.startsWith('vote_average')) {
            setMinVotes(String(DEFAULT_MIN_VOTES));
        }
    }, [sortBy]);

    // Reset page on filter change
    useEffect(() => {
        setPage(1);
    }, [mediaType, genres, sortBy, yearFrom, yearTo, ratingMin, ratingMax, minVotes, perPage]);

    const queryParams = useMemo(() => {
        const params: Record<string, string> = {
            sort_by: sortBy,
            page: String(page),
            'vote_count.gte': minVotes || '0',
        };
        if (genres.length > 0) {
            params.with_genres = genres.join(',');
        }
        if (mediaType === 'movie') {
            if (yearFrom) params['primary_release_date.gte'] = `${yearFrom}-01-01`;
            if (yearTo) params['primary_release_date.lte'] = `${yearTo}-12-31`;
        } else {
            if (yearFrom) params['first_air_date.gte'] = `${yearFrom}-01-01`;
            if (yearTo) params['first_air_date.lte'] = `${yearTo}-12-31`;
        }
        if (ratingMin) params['vote_average.gte'] = ratingMin;
        if (ratingMax) params['vote_average.lte'] = ratingMax;
        return params;
    }, [sortBy, page, genres, yearFrom, yearTo, ratingMin, ratingMax, minVotes, mediaType]);

    const { data, isLoading } = useQuery({
        queryKey: ['discover', mediaType, queryParams, language],
        queryFn: async () => {
            const searchParams = new URLSearchParams({ ...queryParams, language });
            const endpoint = mediaType === 'movie' ? 'discover/movie' : 'discover/tv';
            const res = await fetch(`/api/tmdb/${endpoint}?${searchParams}`);
            return res.json();
        },
    });

    const results = data?.results || [];
    const totalPages = Math.min(data?.total_pages || 0, 500);
    const totalResults = data?.total_results || 0;

    const toggleGenre = (id: number) => {
        setGenres(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
    };

    const clearFilters = () => {
        setGenres([]);
        setYearFrom('');
        setYearTo('');
        setRatingMin('');
        setRatingMax('');
        setMinVotes(sortBy.startsWith('vote_average') ? String(DEFAULT_MIN_VOTES) : '0');
        setSortBy('popularity.desc');
        setPage(1);
    };

    const sortOptions = [
        { value: 'popularity.desc', label: `${t('popularity')} ↓` },
        { value: 'popularity.asc', label: `${t('popularity')} ↑` },
        { value: 'vote_average.desc', label: `${t('ratingSort')} ↓` },
        { value: 'vote_average.asc', label: `${t('ratingSort')} ↑` },
        { value: mediaType === 'movie' ? 'primary_release_date.desc' : 'first_air_date.desc', label: `${t('releaseDate')} ↓` },
        { value: mediaType === 'movie' ? 'primary_release_date.asc' : 'first_air_date.asc', label: `${t('releaseDate')} ↑` },
    ];

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">{t('title')}</h1>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewMode('grid')} data-active={viewMode === 'grid'}>
                        <Grid3X3 className={`h-4 w-4 ${viewMode === 'grid' ? 'text-primary' : ''}`} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewMode('list')} data-active={viewMode === 'list'}>
                        <List className={`h-4 w-4 ${viewMode === 'list' ? 'text-primary' : ''}`} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 sm:hidden" onClick={() => setShowFilters(!showFilters)}>
                        <SlidersHorizontal className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Media type tabs */}
            <Tabs value={mediaType} onValueChange={(v) => setMediaType(v as MediaType)} className="mb-6">
                <TabsList>
                    <TabsTrigger value="movie">{t('movies')}</TabsTrigger>
                    <TabsTrigger value="tv">{t('tvShows')}</TabsTrigger>
                </TabsList>
            </Tabs>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Filters sidebar */}
                <aside className={`w-full lg:w-72 flex-shrink-0 space-y-6 ${showFilters ? '' : 'hidden lg:block'}`}>
                    <div className="rounded-lg border border-border p-4 bg-card space-y-5">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-semibold">{t('filters')}</h2>
                            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={clearFilters}>
                                {t('clearFilters')}
                            </Button>
                        </div>

                        {/* Sort */}
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-2 block">{t('sortBy')}</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            >
                                {sortOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Min votes */}
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-2 block">{t('minVotes')}</label>
                            <Input
                                type="number"
                                value={minVotes}
                                onChange={(e) => setMinVotes(e.target.value)}
                                placeholder="0"
                                className="text-sm"
                                min="0"
                            />
                        </div>

                        <Separator />

                        {/* Year range */}
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-2 block">{t('yearRange')}</label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    value={yearFrom}
                                    onChange={(e) => setYearFrom(e.target.value)}
                                    placeholder={t('from')}
                                    min="1900"
                                    max="2030"
                                    className="text-sm"
                                />
                                <span className="text-muted-foreground text-xs">—</span>
                                <Input
                                    type="number"
                                    value={yearTo}
                                    onChange={(e) => setYearTo(e.target.value)}
                                    placeholder={t('to')}
                                    min="1900"
                                    max="2030"
                                    className="text-sm"
                                />
                            </div>
                        </div>

                        {/* Rating range */}
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-2 block">{t('ratingRange')}</label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    value={ratingMin}
                                    onChange={(e) => setRatingMin(e.target.value)}
                                    placeholder="0"
                                    min="0"
                                    max="10"
                                    step="0.5"
                                    className="text-sm"
                                />
                                <span className="text-muted-foreground text-xs">—</span>
                                <Input
                                    type="number"
                                    value={ratingMax}
                                    onChange={(e) => setRatingMax(e.target.value)}
                                    placeholder="10"
                                    min="0"
                                    max="10"
                                    step="0.5"
                                    className="text-sm"
                                />
                            </div>
                        </div>

                        <Separator />

                        {/* Genres */}
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-2 block">{t('allGenres')}</label>
                            <div className="flex flex-wrap gap-1.5">
                                {Object.entries(genreMap).map(([id, names]) => {
                                    const genreId = Number(id);
                                    const active = genres.includes(genreId);
                                    return (
                                        <Badge
                                            key={id}
                                            variant={active ? 'default' : 'outline'}
                                            className="cursor-pointer text-[10px] px-2 py-0.5"
                                            onClick={() => toggleGenre(genreId)}
                                        >
                                            {names[locale as 'en' | 'es']}
                                        </Badge>
                                    );
                                })}
                            </div>
                        </div>

                        <Separator />

                        {/* Per page */}
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-2 block">{t('perPage')}</label>
                            <div className="flex gap-2">
                                {ITEMS_PER_PAGE_OPTIONS.map(n => (
                                    <Badge
                                        key={n}
                                        variant={perPage === n ? 'default' : 'outline'}
                                        className="cursor-pointer"
                                        onClick={() => setPerPage(n)}
                                    >
                                        {n}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Results */}
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm text-muted-foreground">
                            {totalResults > 0 ? t('showingResults', { count: totalResults.toLocaleString() }) : ''}
                        </p>
                    </div>

                    {isLoading ? (
                        <MediaGridSkeleton count={perPage} />
                    ) : results.length === 0 ? (
                        <div className="flex items-center justify-center py-24 text-muted-foreground">
                            No results found
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {results.slice(0, perPage).map((item: Record<string, unknown>) => {
                                const title = (item.title || item.name || '') as string;
                                const date = (item.release_date || item.first_air_date || '') as string;
                                return (
                                    <MediaCard
                                        key={item.id as number}
                                        id={item.id as number}
                                        title={title}
                                        posterPath={item.poster_path as string | null}
                                        mediaType={mediaType}
                                        year={date?.slice(0, 4)}
                                        rating={item.vote_average as number}
                                        releaseDate={date}
                                        showMediaType={false}
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {results.slice(0, perPage).map((item: Record<string, unknown>) => {
                                const title = (item.title || item.name || '') as string;
                                const date = (item.release_date || item.first_air_date || '') as string;
                                return (
                                    <CompactMediaRow
                                        key={item.id as number}
                                        id={item.id as number}
                                        title={title}
                                        posterPath={item.poster_path as string | null}
                                        mediaType={mediaType}
                                        year={date?.slice(0, 4)}
                                        rating={item.vote_average as number}
                                        genres={item.genre_ids as number[]}
                                        releaseDate={date}
                                        overview={item.overview as string}
                                    />
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-8">
                            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(1)}>
                                <ChevronsLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            {/* Page numbers */}
                            {getPageNumbers(page, totalPages).map((p, i) => (
                                p === '...' ? (
                                    <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground text-sm">…</span>
                                ) : (
                                    <Button
                                        key={p}
                                        variant={p === page ? 'default' : 'outline'}
                                        size="sm"
                                        className="h-8 w-8 p-0 text-xs"
                                        onClick={() => setPage(p as number)}
                                    >
                                        {p}
                                    </Button>
                                )
                            ))}

                            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(totalPages)}>
                                <ChevronsRight className="h-4 w-4" />
                            </Button>

                            <span className="ml-2 text-xs text-muted-foreground">
                                {t('page', { current: page, total: totalPages })}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function getPageNumbers(current: number, total: number): (number | string)[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | string)[] = [];
    if (current <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(total);
    } else if (current >= total - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = total - 4; i <= total; i++) pages.push(i);
    } else {
        pages.push(1);
        pages.push('...');
        pages.push(current - 1);
        pages.push(current);
        pages.push(current + 1);
        pages.push('...');
        pages.push(total);
    }
    return pages;
}
