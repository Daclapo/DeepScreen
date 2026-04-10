'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { MediaCard } from '@/components/media/media-card';
import { MediaGridSkeleton } from '@/components/media/skeletons';
import { MOVIE_GENRES, TV_GENRES } from '@/lib/constants';
import type { MediaType } from '@/types';

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

export default function UpcomingPage() {
    const locale = useLocale();
    const t = useTranslations('upcoming');
    const tD = useTranslations('discover');
    const language = locale === 'es' ? 'es-ES' : 'en-US';
    const [tab, setTab] = useState<MediaType>('movie');
    const [genres, setGenres] = useState<number[]>([]);
    const [sortBy, setSortBy] = useState('popularity.desc');
    const [page, setPage] = useState(1);

    // Advanced Filters
    const [runtimeMin, setRuntimeMin] = useState('');
    const [runtimeMax, setRuntimeMax] = useState('');
    const [languageCode, setLanguageCode] = useState('');
    const [countryCode, setCountryCode] = useState('');

    const today = new Date().toISOString().split('T')[0];
    const genreMap = tab === 'movie' ? MOVIE_GENRES : TV_GENRES;

    const queryParams = useMemo(() => {
        const params: Record<string, string> = {
            sort_by: sortBy,
            page: String(page),
        };
        if (tab === 'movie') {
            params['primary_release_date.gte'] = today;
        } else {
            params['first_air_date.gte'] = today;
        }
        if (genres.length > 0) {
            params.with_genres = genres.join(',');
        }
        if (runtimeMin) params['with_runtime.gte'] = runtimeMin;
        if (runtimeMax) params['with_runtime.lte'] = runtimeMax;
        if (languageCode) params.with_original_language = languageCode;
        if (countryCode) params.with_origin_country = countryCode;
        return params;
    }, [tab, sortBy, page, genres, today, runtimeMin, runtimeMax, languageCode, countryCode]);

    const { data, isLoading } = useQuery({
        queryKey: ['upcoming', tab, queryParams, language],
        queryFn: async () => {
            const searchParams = new URLSearchParams({ ...queryParams, language });
            const endpoint = tab === 'movie' ? 'discover/movie' : 'discover/tv';
            const res = await fetch(`/api/tmdb/${endpoint}?${searchParams}`);
            return res.json();
        },
    });

    const results = data?.results || [];
    const totalPages = Math.min(data?.total_pages || 0, 500);

    const toggleGenre = (id: number) => {
        setGenres(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
    };

    const sortOptions = [
        { value: 'popularity.desc', label: `${tD('popularity')} ↓` },
        { value: 'popularity.asc', label: `${tD('popularity')} ↑` },
        { value: tab === 'movie' ? 'primary_release_date.desc' : 'first_air_date.desc', label: `${tD('releaseDate')} ↓` },
        { value: tab === 'movie' ? 'primary_release_date.asc' : 'first_air_date.asc', label: `${tD('releaseDate')} ↑` },
    ];

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            <h1 className="text-2xl font-bold mb-1">{t('title')}</h1>
            <p className="text-sm text-muted-foreground mb-6">{t('subtitle')}</p>

            <Tabs value={tab} onValueChange={(v) => setTab(v as MediaType)} className="mb-6">
                <TabsList className="w-full max-w-full justify-start overflow-x-auto md:overflow-visible no-scrollbar">
                    <TabsTrigger className="shrink-0" value="movie">{t('upcomingMovies')}</TabsTrigger>
                    <TabsTrigger className="shrink-0" value="tv">{t('upcomingSeries')}</TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Filters row */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-[180px] h-8 text-xs bg-background">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                {sortOptions.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {(genres.length > 0 || runtimeMin || runtimeMax || languageCode) && (
                            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => {
                                setGenres([]);
                                setRuntimeMin('');
                                setRuntimeMax('');
                                setLanguageCode('');
                            }}>
                                {tD('clearFilters')}
                            </Button>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-3">
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
            </div>

            <Accordion type="single" collapsible className="w-full sm:w-[600px] border border-border rounded-xl bg-card shadow-sm mb-6">
                <AccordionItem value="advanced" className="border-none">
                    <AccordionTrigger className="text-sm font-semibold py-2 hover:no-underline px-4 hover:bg-accent/50 rounded-t transition-colors">
                        {tD('advancedFilters')}
                    </AccordionTrigger>
                    <AccordionContent className="pt-4 pb-4 px-4 border-t border-border/50">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {/* Runtime */}
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-2 block">{tD('runtimeMin')}</label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        value={runtimeMin}
                                        onChange={(e) => setRuntimeMin(e.target.value)}
                                        placeholder="0"
                                        min="0"
                                        className="text-sm h-8"
                                    />
                                    <span className="text-muted-foreground text-xs">—</span>
                                    <Input
                                        type="number"
                                        value={runtimeMax}
                                        onChange={(e) => setRuntimeMax(e.target.value)}
                                        placeholder="400"
                                        min="0"
                                        className="text-sm h-8"
                                    />
                                </div>
                            </div>

                            {/* Language */}
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-2 block">{tD('language')}</label>
                                <Select value={languageCode || 'all'} onValueChange={(v) => setLanguageCode(v === 'all' ? '' : v)}>
                                    <SelectTrigger className="w-full h-8 text-xs bg-background">
                                        <SelectValue placeholder={tD('allLanguages')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {LANGUAGES.map(opt => (
                                            <SelectItem key={opt.code || 'all'} value={opt.code || 'all'} className="text-xs">
                                                {opt.code === '' ? tD('allLanguages') : opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Country of Origin */}
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-2 block">{tD('originCountry')}</label>
                                <Select value={countryCode || 'all'} onValueChange={(v) => setCountryCode(v === 'all' ? '' : v)}>
                                    <SelectTrigger className="w-full h-8 text-xs bg-background">
                                        <SelectValue placeholder={tD('allCountries')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {COUNTRIES.map(opt => (
                                            <SelectItem key={opt.code || 'all'} value={opt.code || 'all'} className="text-xs">
                                                {opt.code === '' ? tD('allCountries') : opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

            {/* Results */}
            {isLoading ? (
                <MediaGridSkeleton count={20} />
            ) : results.length === 0 ? (
                <div className="flex items-center justify-center py-24 text-muted-foreground">
                    No upcoming {tab === 'movie' ? 'movies' : 'series'} found
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {results.map((item: Record<string, unknown>) => {
                        const title = (item.title || item.name || '') as string;
                        const date = (item.release_date || item.first_air_date || '') as string;
                        return (
                            <MediaCard
                                key={item.id as number}
                                id={item.id as number}
                                title={title}
                                posterPath={item.poster_path as string | null}
                                mediaType={tab}
                                year={date?.slice(0, 4)}
                                rating={item.vote_average as number}
                                releaseDate={date}
                                showMediaType={false}
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
                    <span className="text-sm text-muted-foreground px-3">
                        {tD('page', { current: page, total: totalPages })}
                    </span>
                    <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(totalPages)}>
                        <ChevronsRight className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
