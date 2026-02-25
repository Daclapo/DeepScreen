'use client';

import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight } from 'lucide-react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MediaCard } from '@/components/media/media-card';
import { SEARCH_DEBOUNCE_MS } from '@/lib/constants';
import type { TMDBMultiResult, TMDBMovie, TMDBSeries } from '@/types';

interface HomeClientProps {
    trending: TMDBMultiResult[];
    topMovies: TMDBMovie[];
    topSeries: TMDBSeries[];
    translations: {
        heroTitle: string;
        heroSubtitle: string;
        trendingToday: string;
        topRatedSeries: string;
        topRatedMovies: string;
        exploreAll: string;
    };
}

interface SearchSuggestion {
    id: number;
    title: string;
    media_type: 'movie' | 'tv';
    year: string;
    poster_path: string | null;
}

export function HomeClient({ trending, topMovies, topSeries, translations: t }: HomeClientProps) {
    const locale = useLocale();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const searchContainerRef = useRef<HTMLDivElement>(null);

    // Click outside to close
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const fetchSuggestions = useCallback(async (query: string) => {
        if (query.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }
        try {
            const lang = locale === 'es' ? 'es-ES' : 'en-US';
            const res = await fetch(`/api/tmdb/search/multi?query=${encodeURIComponent(query)}&language=${lang}`);
            const data = await res.json();
            const filtered: SearchSuggestion[] = (data.results || [])
                .filter((r: { media_type: string }) => r.media_type === 'movie' || r.media_type === 'tv')
                .slice(0, 6)
                .map((r: { id: number; media_type: 'movie' | 'tv'; title?: string; name?: string; release_date?: string; first_air_date?: string; poster_path: string | null }) => ({
                    id: r.id,
                    title: r.media_type === 'movie' ? r.title : r.name,
                    media_type: r.media_type,
                    year: (r.media_type === 'movie' ? r.release_date : r.first_air_date)?.slice(0, 4) || '',
                    poster_path: r.poster_path,
                }));
            setSuggestions(filtered);
            setShowSuggestions(filtered.length > 0);
            setSelectedIndex(-1);
        } catch {
            setSuggestions([]);
        }
    }, [locale]);

    const handleSearchInput = (value: string) => {
        setSearchQuery(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchSuggestions(value), SEARCH_DEBOUNCE_MS);
    };

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/${locale}/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setShowSuggestions(false);
        }
    };

    const handleSuggestionClick = (s: SearchSuggestion) => {
        const route = s.media_type === 'movie' ? `/${locale}/movie/${s.id}` : `/${locale}/series/${s.id}`;
        router.push(route);
        setShowSuggestions(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => Math.max(prev - 1, -1));
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault();
            handleSuggestionClick(suggestions[selectedIndex]);
        }
    };

    const getMediaTitle = (result: TMDBMultiResult): string => {
        if (result.media_type === 'movie') return result.title;
        if (result.media_type === 'tv') return result.name;
        return '';
    };

    const getMediaYear = (result: TMDBMultiResult): string => {
        if (result.media_type === 'movie') return result.release_date?.slice(0, 4) || '';
        if (result.media_type === 'tv') return result.first_air_date?.slice(0, 4) || '';
        return '';
    };

    const getMediaPoster = (result: TMDBMultiResult): string | null => {
        if (result.media_type === 'person') return null;
        return result.poster_path;
    };

    const getMediaRating = (result: TMDBMultiResult): number | undefined => {
        if (result.media_type === 'person') return undefined;
        return result.vote_average;
    };

    const getMediaReleaseDate = (result: TMDBMultiResult): string | undefined => {
        if (result.media_type === 'movie') return result.release_date;
        if (result.media_type === 'tv') return result.first_air_date;
        return undefined;
    };

    return (
        <div className="flex flex-col">
            {/* Hero section */}
            <section className="relative flex flex-col items-center justify-center px-4 py-24 sm:py-32">
                {/* Background gradient */}
                <div className="absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[800px] rounded-full bg-primary/5 blur-3xl" />
                </div>

                <h1 className="max-w-2xl text-center text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                    {t.heroTitle}
                </h1>
                <p className="mt-4 max-w-lg text-center text-muted-foreground text-base sm:text-lg">
                    {t.heroSubtitle}
                </p>

                {/* Search bar */}
                <div className="relative mt-8 w-full max-w-xl" ref={searchContainerRef}>
                    <form onSubmit={handleSubmit}>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => handleSearchInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                                placeholder={locale === 'es' ? 'Buscar películas y series...' : 'Search movies and series...'}
                                className="h-12 w-full rounded-xl border border-border bg-card pl-12 pr-4 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent shadow-sm"
                            />
                        </div>
                    </form>

                    {/* Suggestions */}
                    {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-border bg-popover shadow-xl overflow-hidden z-50">
                            {suggestions.map((s, i) => (
                                <button
                                    key={`${s.media_type}-${s.id}`}
                                    type="button"
                                    onClick={() => handleSuggestionClick(s)}
                                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${i === selectedIndex ? 'bg-accent' : 'hover:bg-accent/50'
                                        }`}
                                >
                                    {s.poster_path ? (
                                        <img
                                            src={`https://image.tmdb.org/t/p/w92${s.poster_path}`}
                                            alt=""
                                            className="h-12 w-8 rounded object-cover"
                                        />
                                    ) : (
                                        <div className="h-12 w-8 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">?</div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{s.title}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {s.media_type === 'movie' ? 'Movie' : 'Series'}{s.year ? ` · ${s.year}` : ''}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Content sections */}
            <div className="mx-auto w-full max-w-7xl space-y-12 px-4 pb-16 sm:px-6">
                {/* Trending */}
                <Section
                    title={t.trendingToday}
                    actionLabel={t.exploreAll}
                    actionHref={`/${locale}/discover`}
                >
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {trending
                            .filter((r): r is TMDBMultiResult & { media_type: 'movie' | 'tv' } => r.media_type !== 'person')
                            .map((result) => (
                                <MediaCard
                                    key={`${result.media_type}-${result.id}`}
                                    id={result.id}
                                    title={getMediaTitle(result)}
                                    posterPath={getMediaPoster(result)}
                                    mediaType={result.media_type}
                                    year={getMediaYear(result)}
                                    rating={getMediaRating(result)}
                                    releaseDate={getMediaReleaseDate(result)}
                                />
                            ))}
                    </div>
                </Section>

                {/* Top Rated Movies */}
                <Section
                    title={t.topRatedMovies}
                    actionLabel={t.exploreAll}
                    actionHref={`/${locale}/discover?type=movie&sort=vote_average.desc`}
                >
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {topMovies.map((movie) => (
                            <MediaCard
                                key={movie.id}
                                id={movie.id}
                                title={movie.title}
                                posterPath={movie.poster_path}
                                mediaType="movie"
                                year={movie.release_date?.slice(0, 4)}
                                rating={movie.vote_average}
                                releaseDate={movie.release_date}
                            />
                        ))}
                    </div>
                </Section>

                {/* Top Rated Series */}
                <Section
                    title={t.topRatedSeries}
                    actionLabel={t.exploreAll}
                    actionHref={`/${locale}/discover?type=tv&sort=vote_average.desc`}
                >
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {topSeries.map((series) => (
                            <MediaCard
                                key={series.id}
                                id={series.id}
                                title={series.name}
                                posterPath={series.poster_path}
                                mediaType="tv"
                                year={series.first_air_date?.slice(0, 4)}
                                rating={series.vote_average}
                                releaseDate={series.first_air_date}
                            />
                        ))}
                    </div>
                </Section>
            </div>
        </div>
    );
}

function Section({
    title,
    actionLabel,
    actionHref,
    children,
}: {
    title: string;
    actionLabel: string;
    actionHref: string;
    children: React.ReactNode;
}) {
    return (
        <section>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground" asChild>
                    <a href={actionHref}>
                        {actionLabel}
                        <ArrowRight className="h-4 w-4" />
                    </a>
                </Button>
            </div>
            {children}
        </section>
    );
}
