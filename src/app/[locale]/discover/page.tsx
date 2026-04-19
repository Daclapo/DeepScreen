'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Grid3X3, List, Rows3, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { MediaCard } from '@/components/media/media-card';
import { CompactMediaRow } from '@/components/media/compact-media-row';
import { DenseMediaRow } from '@/components/media/dense-media-row';
import { MediaGridSkeleton } from '@/components/media/skeletons';
import { MOVIE_GENRES, TV_GENRES } from '@/lib/constants';
import type { MediaType } from '@/types';

const ITEMS_PER_PAGE_OPTIONS = [20, 50, 100, 200, 500] as const;

function isPerPageOption(value: number): value is (typeof ITEMS_PER_PAGE_OPTIONS)[number] {
    return ITEMS_PER_PAGE_OPTIONS.includes(value as (typeof ITEMS_PER_PAGE_OPTIONS)[number]);
}

const DEFAULT_MIN_VOTES_BY_SORT = {
    popularity: 200,
    rating: 800,
    releaseDate: 100,
    voteCount: 500,
    title: 200,
    revenue: 1500,
} as const;

function getSortBucket(sortBy: string): keyof typeof DEFAULT_MIN_VOTES_BY_SORT {
    if (sortBy.startsWith('vote_average')) return 'rating';
    if (sortBy.startsWith('vote_count')) return 'voteCount';
    if (sortBy.startsWith('primary_release_date') || sortBy.startsWith('first_air_date')) return 'releaseDate';
    if (sortBy.startsWith('original_title')) return 'title';
    if (sortBy.startsWith('revenue')) return 'revenue';
    return 'popularity';
}

function getDefaultMinVotes(sortBy: string): number {
    return DEFAULT_MIN_VOTES_BY_SORT[getSortBucket(sortBy)];
}

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
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Read initial values from URL params (from home page "Explore All" links)
    const typeParam = searchParams.get('type');
    const initialType: MediaType = typeParam === 'tv' ? 'tv' : 'movie';
    const initialSort = searchParams.get('sort') || 'popularity.desc';
    const initialPage = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const initialPerPageRaw = Number(searchParams.get('perPage'));
    const initialPerPage: (typeof ITEMS_PER_PAGE_OPTIONS)[number] = isPerPageOption(initialPerPageRaw) ? initialPerPageRaw : 20;
    const initialGenres = (searchParams.get('genres') || '')
        .split(',')
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id) && id > 0);
    const initialViewModeParam = searchParams.get('view');
    const initialViewMode: 'grid' | 'list' | 'dense' =
        initialViewModeParam === 'list' || initialViewModeParam === 'dense' ? initialViewModeParam : 'grid';
    const initialMinVotes = searchParams.get('minVotes') || String(getDefaultMinVotes(initialSort));

    const [mediaType, setMediaType] = useState<MediaType>(initialType);
    const [genres, setGenres] = useState<number[]>(initialGenres);
    const [sortBy, setSortBy] = useState(initialSort);
    const [yearFrom, setYearFrom] = useState(searchParams.get('yearFrom') || '');
    const [yearTo, setYearTo] = useState(searchParams.get('yearTo') || '');
    const [ratingMin, setRatingMin] = useState(searchParams.get('ratingMin') || '');
    const [ratingMax, setRatingMax] = useState(searchParams.get('ratingMax') || '');
    const [minVotes, setMinVotes] = useState<string>(initialMinVotes);
    const [page, setPage] = useState(initialPage);
    const [pageSliderValue, setPageSliderValue] = useState(initialPage);
    const [isPageSliderDragging, setIsPageSliderDragging] = useState(false);
    const [pageInput, setPageInput] = useState(String(initialPage));
    const [viewMode, setViewMode] = useState<'grid' | 'list' | 'dense'>(initialViewMode);
    const [perPage, setPerPage] = useState<(typeof ITEMS_PER_PAGE_OPTIONS)[number]>(initialPerPage);
    const [showFilters, setShowFilters] = useState(false);

    // Advanced Filters
    const [runtimeMin, setRuntimeMin] = useState(searchParams.get('runtimeMin') || '');
    const [runtimeMax, setRuntimeMax] = useState(searchParams.get('runtimeMax') || '');
    const [languageCode, setLanguageCode] = useState(searchParams.get('languageCode') || '');
    const [countryCode, setCountryCode] = useState(searchParams.get('countryCode') || '');

    const genreMap = mediaType === 'movie' ? MOVIE_GENRES : TV_GENRES;
    const hasMountedRef = useRef(false);
    const hasInitializedSortVotesRef = useRef(false);

    // Auto-set min votes when sorting changes
    useEffect(() => {
        if (!hasInitializedSortVotesRef.current) {
            hasInitializedSortVotesRef.current = true;
            return;
        }
        setMinVotes(String(getDefaultMinVotes(sortBy)));
    }, [sortBy]);

    useEffect(() => {
        setPageInput(String(page));
    }, [page]);

    useEffect(() => {
        setPageSliderValue(page);
    }, [page]);

    // Reset page on filter change
    useEffect(() => {
        if (!hasMountedRef.current) {
            hasMountedRef.current = true;
            return;
        }
        setPage(1);
    }, [mediaType, genres, sortBy, yearFrom, yearTo, ratingMin, ratingMax, minVotes, perPage, runtimeMin, runtimeMax, languageCode, countryCode]);

    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        const defaultMinVotes = String(getDefaultMinVotes(sortBy));

        const setParam = (key: string, value?: string) => {
            if (!value) {
                params.delete(key);
                return;
            }
            params.set(key, value);
        };

        setParam('type', mediaType === 'movie' ? undefined : mediaType);
        setParam('sort', sortBy === 'popularity.desc' ? undefined : sortBy);
        setParam('page', page > 1 ? String(page) : undefined);
        setParam('perPage', perPage === 20 ? undefined : String(perPage));
        setParam('genres', genres.length > 0 ? genres.join(',') : undefined);
        setParam('yearFrom', yearFrom || undefined);
        setParam('yearTo', yearTo || undefined);
        setParam('ratingMin', ratingMin || undefined);
        setParam('ratingMax', ratingMax || undefined);
        setParam('minVotes', minVotes && minVotes !== defaultMinVotes ? minVotes : undefined);
        setParam('runtimeMin', runtimeMin || undefined);
        setParam('runtimeMax', runtimeMax || undefined);
        setParam('languageCode', languageCode || undefined);
        setParam('countryCode', countryCode || undefined);
        setParam('view', viewMode === 'grid' ? undefined : viewMode);

        const currentQuery = searchParams.toString();
        const nextQuery = params.toString();

        if (currentQuery !== nextQuery) {
            router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
        }
    }, [
        countryCode,
        genres,
        languageCode,
        mediaType,
        minVotes,
        page,
        pathname,
        perPage,
        ratingMax,
        ratingMin,
        router,
        runtimeMax,
        runtimeMin,
        searchParams,
        sortBy,
        viewMode,
        yearFrom,
        yearTo,
    ]);

    // Calculate how many TMDB pages we need (TMDB returns 20 per page)
    const maxReachablePage = Math.max(1, Math.floor(10000 / perPage));
    const safePage = Math.max(1, Math.min(page, maxReachablePage));
    const tmdbPagesNeeded = Math.ceil(perPage / 20);
    const tmdbStartPage = (safePage - 1) * tmdbPagesNeeded + 1;
    const maxTmdbStartPage = Math.max(1, 500 - tmdbPagesNeeded + 1);
    const safeTmdbStartPage = Math.max(1, Math.min(tmdbStartPage, maxTmdbStartPage));

    useEffect(() => {
        if (page !== safePage) {
            setPage(safePage);
        }
    }, [page, safePage]);

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
        queryKey: ['discover', mediaType, queryParams, language, safeTmdbStartPage, tmdbPagesNeeded],
        queryFn: async () => {
            const endpoint = mediaType === 'movie' ? 'discover/movie' : 'discover/tv';

            const tmdbPages = Array.from({ length: tmdbPagesNeeded }, (_, i) => safeTmdbStartPage + i).filter((p) => p <= 500);
            const responses: Array<{ results?: unknown[]; total_results?: number }> = [];
            const batchSize = 5;

            for (let i = 0; i < tmdbPages.length; i += batchSize) {
                const batch = tmdbPages.slice(i, i + batchSize);
                const batchResponses = await Promise.all(
                    batch.map(async (p) => {
                        const searchP = new URLSearchParams({ ...queryParams, language, page: String(p) });
                        const response = await fetch(`/api/tmdb/${endpoint}?${searchP}`);
                        if (!response.ok) {
                            return { results: [], total_results: 0 };
                        }
                        return response.json();
                    })
                );
                responses.push(...batchResponses);
            }

            const cappedTotalResults = Math.min(responses[0]?.total_results || 0, 10000);
            // Merge results
            return {
                results: responses.flatMap((r) => r.results || []),
                total_pages: Math.ceil(cappedTotalResults / perPage),
                total_results: cappedTotalResults,
            };
        },
    });

    const results = (data?.results || []) as Record<string, unknown>[];
    const totalPages = data?.total_pages || 0;
    const totalResults = data?.total_results || 0;

    const pageSliderProgress = useMemo(() => {
        const maxPage = Math.max(1, totalPages);
        if (maxPage <= 1) return 0;
        const clamped = Math.max(1, Math.min(pageSliderValue, maxPage));
        return ((clamped - 1) / (maxPage - 1)) * 100;
    }, [pageSliderValue, totalPages]);

    useEffect(() => {
        if (totalPages > 0 && page > totalPages) {
            setPage(totalPages);
        }
    }, [page, totalPages]);

    const toggleGenre = (id: number) => {
        setGenres(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
    };

    const clearFilters = () => {
        setGenres([]);
        setYearFrom('');
        setYearTo('');
        setRatingMin('');
        setRatingMax('');
        setSortBy('popularity.desc');
        setMinVotes(String(getDefaultMinVotes('popularity.desc')));
        setRuntimeMin('');
        setRuntimeMax('');
        setLanguageCode('');
        setCountryCode('');
        setPage(1);
    };

    const sortOptions = [
        { value: 'popularity.desc', label: `${t('popularity')} ↓` },
        { value: 'popularity.asc', label: `${t('popularity')} ↑` },
        { value: 'vote_average.desc', label: `${t('ratingSort')} ↓` },
        { value: 'vote_average.asc', label: `${t('ratingSort')} ↑` },
        { value: 'vote_count.desc', label: `${t('votes')} ↓` },
        { value: 'vote_count.asc', label: `${t('votes')} ↑` },
        { value: mediaType === 'movie' ? 'primary_release_date.desc' : 'first_air_date.desc', label: `${t('releaseDate')} ↓` },
        { value: mediaType === 'movie' ? 'primary_release_date.asc' : 'first_air_date.asc', label: `${t('releaseDate')} ↑` },
        ...(mediaType === 'movie' ? [{ value: 'original_title.asc', label: `${t('titleSort')} A-Z` }] : []),
        ...(mediaType === 'movie' ? [{ value: 'original_title.desc', label: `${t('titleSort')} Z-A` }] : []),
        ...(mediaType === 'movie' ? [{ value: 'revenue.desc', label: `${t('revenueSort')} ↓` }] : []),
        ...(mediaType === 'movie' ? [{ value: 'revenue.asc', label: `${t('revenueSort')} ↑` }] : []),
    ];

    const handlePerPageTabChange = (value: string) => {
        const parsed = Number(value);
        if (isPerPageOption(parsed)) {
            setPerPage(parsed);
        }
    };

    const handlePageInputSubmit = () => {
        const parsed = parseInt(pageInput, 10);
        if (Number.isNaN(parsed)) return;
        const maxPageFromData = totalPages > 0 ? totalPages : maxReachablePage;
        const nextPage = Math.max(1, Math.min(parsed, maxPageFromData));
        setPage(nextPage);
    };

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">{t('title')}</h1>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 data-[active=true]:bg-accent/70"
                        title={t('gridView')}
                        aria-label={t('gridView')}
                        onClick={() => setViewMode('grid')}
                        data-active={viewMode === 'grid'}
                    >
                        <Grid3X3 className={`h-4 w-4 ${viewMode === 'grid' ? 'text-primary' : ''}`} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 data-[active=true]:bg-accent/70"
                        title={t('listView')}
                        aria-label={t('listView')}
                        onClick={() => setViewMode('list')}
                        data-active={viewMode === 'list'}
                    >
                        <List className={`h-4 w-4 ${viewMode === 'list' ? 'text-primary' : ''}`} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 data-[active=true]:bg-accent/70"
                        title={t('denseView')}
                        aria-label={t('denseView')}
                        onClick={() => setViewMode('dense')}
                        data-active={viewMode === 'dense'}
                    >
                        <Rows3 className={`h-4 w-4 ${viewMode === 'dense' ? 'text-primary' : ''}`} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 sm:hidden" onClick={() => setShowFilters(!showFilters)}>
                        <SlidersHorizontal className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Media type tabs */}
            <Tabs value={mediaType} onValueChange={(v) => setMediaType(v as MediaType)} className="mb-6">
                <TabsList className="w-full max-w-full justify-start overflow-x-auto md:overflow-visible no-scrollbar">
                    <TabsTrigger className="shrink-0" value="movie">{t('movies')}</TabsTrigger>
                    <TabsTrigger className="shrink-0" value="tv">{t('tvShows')}</TabsTrigger>
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
                                placeholder={String(getDefaultMinVotes(sortBy))}
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
                        <div className="space-y-3 overflow-hidden">
                            <div className="flex items-center justify-between gap-2">
                                <label className="text-xs font-medium text-muted-foreground">{t('perPage')}</label>
                                <span className="text-xs font-semibold tabular-nums">{perPage}</span>
                            </div>

                            <Tabs value={String(perPage)} onValueChange={handlePerPageTabChange}>
                                <TabsList className="grid w-full grid-cols-5 h-auto p-1">
                                    {ITEMS_PER_PAGE_OPTIONS.map((n) => (
                                        <TabsTrigger
                                            key={n}
                                            value={String(n)}
                                            className="min-w-0 px-1 py-1.5 text-[11px] tabular-nums sm:text-xs"
                                        >
                                            {n}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </Tabs>
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
                    ) : viewMode === 'list' ? (
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
                    ) : (
                        <div className="overflow-hidden rounded-lg border border-border/50 bg-card/40">
                            <div className="grid grid-cols-[2.75rem_minmax(0,1fr)_4.5rem] border-b border-border/60 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                <span>{t('rank')}</span>
                                <span>{t('titleSort')}</span>
                                <span className="text-right">{t('ratingSort')}</span>
                            </div>
                            <div className="divide-y divide-border/50">
                                {results.slice(0, perPage).map((item: Record<string, unknown>, index) => {
                                    const title = (item.title || item.name || '') as string;
                                    const date = (item.release_date || item.first_air_date || '') as string;
                                    return (
                                        <DenseMediaRow
                                            key={`dense-${item.id as number}`}
                                            rank={(safePage - 1) * perPage + index + 1}
                                            id={item.id as number}
                                            title={title}
                                            mediaType={mediaType}
                                            year={date?.slice(0, 4)}
                                            rating={item.vote_average as number}
                                            voteCount={item.vote_count as number}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-8 space-y-4">
                            <div className="flex flex-col gap-3 rounded-lg border border-border/50 bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-2">
                                    <label className="text-xs text-muted-foreground">{t('goToPage')}</label>
                                    <Input
                                        type="number"
                                        min="1"
                                        max={Math.max(1, totalPages || maxReachablePage)}
                                        value={pageInput}
                                        onChange={(e) => setPageInput(e.target.value)}
                                        onBlur={handlePageInputSubmit}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handlePageInputSubmit();
                                        }}
                                        className="h-8 w-24 text-xs"
                                    />
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    {t('page', { current: page, total: totalPages })}
                                </span>
                            </div>

                            <div className="relative px-1 pt-6">
                                <span
                                    className={`pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-md border border-border/60 bg-background px-2 py-0.5 text-[10px] font-semibold leading-none shadow-sm tabular-nums transition-all ${isPageSliderDragging ? 'opacity-100' : 'opacity-0'}`}
                                    style={{ left: `clamp(0.875rem, ${pageSliderProgress}%, calc(100% - 0.875rem))` }}
                                >
                                    {pageSliderValue}
                                </span>

                                <Slider
                                    value={[Math.max(1, Math.min(pageSliderValue, Math.max(1, totalPages)))]}
                                    min={1}
                                    max={Math.max(1, totalPages)}
                                    step={1}
                                    onPointerDown={() => setIsPageSliderDragging(true)}
                                    onPointerUp={() => setIsPageSliderDragging(false)}
                                    onPointerCancel={() => setIsPageSliderDragging(false)}
                                    onBlur={() => setIsPageSliderDragging(false)}
                                    onValueChange={(value) => {
                                        setIsPageSliderDragging(true);
                                        setPageSliderValue(value[0] ?? 1);
                                    }}
                                    onValueCommit={(value) => {
                                        setPage(value[0] ?? 1);
                                        setIsPageSliderDragging(false);
                                    }}
                                />
                            </div>

                            <div className="flex items-center justify-start gap-2 overflow-x-auto pb-1 sm:justify-center no-scrollbar">
                            <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" disabled={page <= 1} onClick={() => setPage(1)}>
                                <ChevronsLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            {/* Page numbers */}
                            {getPageNumbers(page, totalPages).map((p, i) => (
                                p === '...' ? (
                                    <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground text-sm shrink-0">…</span>
                                ) : (
                                    <Button
                                        key={p}
                                        variant={p === page ? 'default' : 'outline'}
                                        size="sm"
                                        className="h-8 w-8 shrink-0 p-0 text-xs"
                                        onClick={() => setPage(p as number)}
                                    >
                                        {p}
                                    </Button>
                                )
                            ))}

                            <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" disabled={page >= totalPages} onClick={() => setPage(totalPages)}>
                                <ChevronsRight className="h-4 w-4" />
                            </Button>
                            </div>
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
