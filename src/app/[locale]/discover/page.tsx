'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Grid3X3, List, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { MediaCard } from '@/components/media/media-card';
import { CompactMediaRow } from '@/components/media/compact-media-row';
import { MediaGridSkeleton } from '@/components/media/skeletons';
import { MOVIE_GENRES, TV_GENRES, DEFAULT_MIN_VOTES } from '@/lib/constants';
import type { MediaType } from '@/types';

const ITEMS_PER_PAGE_OPTIONS = [20, 40, 60, 100];

const LANGUAGES = [
    { code: '', label: 'All Languages' },
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
    { code: 'ja', label: '日本語' },
    { code: 'ko', label: '한국어' },
    { code: 'de', label: 'Deutsch' },
    { code: 'it', label: 'Italiano' },
];

const COUNTRIES = [
    { code: '', label: 'All Countries' },
    { code: 'US', label: 'United States' },
    { code: 'GB', label: 'United Kingdom' },
    { code: 'ES', label: 'Spain' },
    { code: 'FR', label: 'France' },
    { code: 'DE', label: 'Germany' },
    { code: 'JP', label: 'Japan' },
    { code: 'KR', label: 'South Korea' },
    { code: 'IT', label: 'Italy' },
    { code: 'IN', label: 'India' },
    { code: 'BR', label: 'Brazil' },
    { code: 'MX', label: 'Mexico' },
    { code: 'CA', label: 'Canada' },
    { code: 'AU', label: 'Australia' },
    { code: 'CN', label: 'China' },
];

export default function DiscoverPage() {
    const locale = useLocale();
    const t = useTranslations('discover');
    const language = locale === 'es' ? 'es-ES' : 'en-US';
    const searchParams = useSearchParams();

    // Read initial values from URL params (from home page "Explore All" links)
    const initialType = (searchParams.get('type') as MediaType) || 'movie';
    const initialSort = searchParams.get('sort') || 'popularity.desc';

    const [mediaType, setMediaType] = useState<MediaType>(initialType);
    const [genres, setGenres] = useState<number[]>([]);
    const [sortBy, setSortBy] = useState(initialSort);
    const [yearFrom, setYearFrom] = useState('');
    const [yearTo, setYearTo] = useState('');
    const [ratingMin, setRatingMin] = useState('');
    const [ratingMax, setRatingMax] = useState('');
    const [minVotes, setMinVotes] = useState<string>('0');
    const [page, setPage] = useState(1);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [perPage, setPerPage] = useState(20);
    const [showFilters, setShowFilters] = useState(false);

    // Advanced Filters
    const [runtimeMin, setRuntimeMin] = useState('');
    const [runtimeMax, setRuntimeMax] = useState('');
    const [languageCode, setLanguageCode] = useState('');
    const [countryCode, setCountryCode] = useState('');

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
    }, [mediaType, genres, sortBy, yearFrom, yearTo, ratingMin, ratingMax, minVotes, perPage, runtimeMin, runtimeMax, languageCode, countryCode]);

    // Calculate how many TMDB pages we need (TMDB returns 20 per page)
    const tmdbPagesNeeded = Math.ceil(perPage / 20);
    const tmdbStartPage = (page - 1) * tmdbPagesNeeded + 1;

    const queryParams = useMemo(() => {
        const params: Record<string, string> = {
            sort_by: sortBy,
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
        if (runtimeMin) params['with_runtime.gte'] = runtimeMin;
        if (runtimeMax) params['with_runtime.lte'] = runtimeMax;
        if (languageCode) params.with_original_language = languageCode;
        if (countryCode) params.with_origin_country = countryCode;
        return params;
    }, [sortBy, genres, yearFrom, yearTo, ratingMin, ratingMax, minVotes, mediaType, runtimeMin, runtimeMax, languageCode, countryCode]);

    // Fetch multiple TMDB pages if perPage > 20
    const { data, isLoading } = useQuery({
        queryKey: ['discover', mediaType, queryParams, language, tmdbStartPage, tmdbPagesNeeded],
        queryFn: async () => {
            const endpoint = mediaType === 'movie' ? 'discover/movie' : 'discover/tv';
            const fetches = Array.from({ length: tmdbPagesNeeded }, (_, i) => {
                const p = tmdbStartPage + i;
                const searchP = new URLSearchParams({ ...queryParams, language, page: String(p) });
                return fetch(`/api/tmdb/${endpoint}?${searchP}`).then(r => r.json());
            });
            const results = await Promise.all(fetches);
            // Merge results
            return {
                results: results.flatMap((r: { results?: unknown[] }) => r.results || []),
                total_pages: Math.ceil((results[0]?.total_results || 0) / perPage),
                total_results: results[0]?.total_results || 0,
            };
        },
    });

    const results = (data?.results || []) as Record<string, unknown>[];
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
        setRuntimeMin('');
        setRuntimeMax('');
        setLanguageCode('');
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
                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {sortOptions.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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

                        {/* Advanced Filters */}
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="advanced" className="border-none">
                                <AccordionTrigger className="text-sm font-semibold py-2 hover:no-underline px-1 hover:bg-accent rounded-t">
                                    {t('advancedFilters')}
                                </AccordionTrigger>
                                <AccordionContent className="space-y-5 pt-3 px-1">
                                    {/* Runtime */}
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground mb-2 block">{t('runtimeMin')}</label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                value={runtimeMin}
                                                onChange={(e) => setRuntimeMin(e.target.value)}
                                                placeholder="0"
                                                min="0"
                                                className="text-sm"
                                            />
                                            <span className="text-muted-foreground text-xs">—</span>
                                            <Input
                                                type="number"
                                                value={runtimeMax}
                                                onChange={(e) => setRuntimeMax(e.target.value)}
                                                placeholder="400"
                                                min="0"
                                                className="text-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* Language */}
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground mb-2 block">{t('language')}</label>
                                        <Select value={languageCode || 'all'} onValueChange={(v) => setLanguageCode(v === 'all' ? '' : v)}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder={t('allLanguages')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {LANGUAGES.map(opt => (
                                                    <SelectItem key={opt.code || 'all'} value={opt.code || 'all'}>
                                                        {opt.code === '' ? t('allLanguages') : opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Country of Origin */}
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground mb-2 block">{t('originCountry')}</label>
                                        <Select value={countryCode || 'all'} onValueChange={(v) => setCountryCode(v === 'all' ? '' : v)}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder={t('allCountries')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {COUNTRIES.map(opt => (
                                                    <SelectItem key={opt.code || 'all'} value={opt.code || 'all'}>
                                                        {opt.code === '' ? t('allCountries') : opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>

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
                                        key={`${item.media_type}-${item.id}`}
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
