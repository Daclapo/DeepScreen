'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { X, Search, Star, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TMDB_IMAGE_BASE, TMDB_POSTER_SIZES, SEARCH_DEBOUNCE_MS } from '@/lib/constants';

interface CompareItem {
    id: number;
    title: string;
    posterPath: string | null;
    mediaType: 'movie' | 'tv';
    year: string;
    rating: number;
    votes: number;
    genres: string;
    runtime: string;
    status: string;
    overview: string;
    budget?: string;
    revenue?: string;
    seasons?: number;
    episodes?: number;
}

export default function ComparePage() {
    const t = useTranslations('compare');
    const tM = useTranslations('media');
    const locale = useLocale();
    const language = locale === 'es' ? 'es-ES' : 'en-US';

    const [items, setItems] = useState<(CompareItem | null)[]>([null, null, null, null]);
    const [searchSlot, setSearchSlot] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');

    // Type locking based on first added item
    const lockedType = items.find(i => i !== null)?.mediaType || null;

    const handleSearchInput = useCallback((value: string) => {
        setSearchQuery(value);
        const timer = setTimeout(() => setDebouncedQuery(value), SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, []);

    const { data: searchResults } = useQuery({
        queryKey: ['compare-search', debouncedQuery, language],
        queryFn: async () => {
            const res = await fetch(`/api/tmdb/search/multi?query=${encodeURIComponent(debouncedQuery)}&language=${language}`);
            return res.json();
        },
        enabled: !!debouncedQuery && searchSlot !== null,
    });

    const selectItem = async (result: { id: number; media_type: string; title?: string; name?: string; poster_path: string | null; release_date?: string; first_air_date?: string; vote_average: number }) => {
        if (searchSlot === null) return;
        const mediaType = result.media_type as 'movie' | 'tv';

        // Fetch full details
        const endpoint = mediaType === 'movie' ? `movie/${result.id}` : `tv/${result.id}`;
        const res = await fetch(`/api/tmdb/${endpoint}?language=${language}`);
        const detail = await res.json();

        const formatCurrency = (v: number) => v > 0 ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v) : '—';

        const item: CompareItem = {
            id: detail.id,
            title: detail.title || detail.name || '',
            posterPath: detail.poster_path,
            mediaType,
            year: (detail.release_date || detail.first_air_date || '').slice(0, 4),
            rating: detail.vote_average || 0,
            votes: detail.vote_count || 0,
            genres: (detail.genres || []).map((g: { name: string }) => g.name).join(', '),
            runtime: mediaType === 'movie'
                ? (detail.runtime && detail.runtime > 0 ? `${detail.runtime} min` : '—')
                : `${detail.number_of_episodes || 0} ${tM('episodes')}`,
            status: detail.status || '',
            overview: detail.overview || '',
            budget: mediaType === 'movie' ? formatCurrency(detail.budget || 0) : undefined,
            revenue: mediaType === 'movie' ? formatCurrency(detail.revenue || 0) : undefined,
            seasons: mediaType === 'tv' ? detail.number_of_seasons : undefined,
            episodes: mediaType === 'tv' ? detail.number_of_episodes : undefined,
        };

        const newItems = [...items];
        newItems[searchSlot] = item;
        setItems(newItems);
        setSearchSlot(null);
        setSearchQuery('');
        setDebouncedQuery('');
    };

    const removeItem = (slot: number) => {
        const newItems = [...items];
        newItems[slot] = null;
        setItems(newItems);
    };

    const filteredSearchResults = (searchResults?.results || []).filter(
        (r: { media_type?: string }) => {
            if (lockedType && r.media_type !== lockedType) return false;
            return r.media_type === 'movie' || r.media_type === 'tv';
        }
    );

    const activeCount = items.filter(Boolean).length;
    const hasAtLeastTwo = activeCount >= 2;

    const getHighlights = (getter: (i: CompareItem) => number, type: 'max' | 'min' = 'max') => {
        const vals = items.map(i => i ? getter(i) : null).filter(v => v !== null) as number[];
        if (vals.length === 0) return items.map(() => false);
        const target = type === 'max' ? Math.max(...vals) : Math.min(...vals);
        return items.map(i => i ? getter(i) === target && target !== 0 : false);
    };

    // Deeper comparison logic (ROI, longevity)
    const getROI = (i: CompareItem) => {
        const rev = parseInt(i.revenue?.replace(/\D/g, '') || '0');
        const bg = parseInt(i.budget?.replace(/\D/g, '') || '0');
        if (bg > 0 && rev > 0) return rev / bg;
        return 0;
    };

    // Comparison rows
    const comparisonRows = hasAtLeastTwo ? [
        { label: tM('rating'), values: items.map(i => i ? `⭐ ${i.rating.toFixed(1)}` : '—'), highlights: getHighlights(i => i.rating, 'max') },
        { label: tM('votes'), values: items.map(i => i ? i.votes.toLocaleString() : '—'), highlights: getHighlights(i => i.votes, 'max') },
        { label: tM('genres'), values: items.map(i => i?.genres || '—'), highlights: items.map(() => false) },
        { label: tM('runtime'), values: items.map(i => i?.runtime || '—'), highlights: items.map(() => false) },
        { label: tM('status'), values: items.map(i => i?.status || '—'), highlights: items.map(() => false) },
        ...(lockedType === 'movie' ? [
            { label: tM('budget'), values: items.map(i => i?.budget || '—'), highlights: getHighlights(i => parseInt(i.budget?.replace(/\D/g, '') || '0'), 'max') },
            { label: tM('revenue'), values: items.map(i => i?.revenue || '—'), highlights: getHighlights(i => parseInt(i.revenue?.replace(/\D/g, '') || '0'), 'max') },
            { label: 'ROI', values: items.map(i => i && getROI(i) > 0 ? `${((getROI(i) - 1) * 100).toFixed(0)}%` : '—'), highlights: getHighlights(i => getROI(i), 'max') },
        ] : []),
        ...(lockedType === 'tv' ? [
            { label: tM('seasons'), values: items.map(i => i?.seasons != null ? String(i.seasons) : '—'), highlights: getHighlights(i => i.seasons || 0, 'max') },
            { label: tM('episodes'), values: items.map(i => i?.episodes != null ? String(i.episodes) : '—'), highlights: getHighlights(i => i.episodes || 0, 'max') },
        ] : []),
    ] : [];

    return (
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
            <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>

            {/* Slots */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 items-start mb-8">
                {items.map((item, index) => (
                    <CompareSlot
                        key={index}
                        item={item}
                        onSearch={() => { setSearchSlot(index); setSearchQuery(''); setDebouncedQuery(''); }}
                        onRemove={() => removeItem(index)}
                        tM={tM}
                        t={t}
                        lockedType={lockedType}
                    />
                ))}
            </div>

            {/* Search overlay */}
            {searchSlot !== null && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-background/80 backdrop-blur-sm" onClick={() => setSearchSlot(null)}>
                    <div className="w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl p-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-2 mb-3">
                            <Search className="h-4 w-4 text-muted-foreground" />
                            <Input
                                autoFocus
                                value={searchQuery}
                                onChange={(e) => handleSearchInput(e.target.value)}
                                placeholder={t('searchToAdd')}
                                className="border-none shadow-none focus-visible:ring-0 text-base"
                            />
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSearchSlot(null)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="max-h-80 overflow-y-auto space-y-1">
                            {filteredSearchResults.map((r: { id: number; media_type: string; title?: string; name?: string; poster_path: string | null; release_date?: string; first_air_date?: string; vote_average: number }) => (
                                <button
                                    key={`${r.media_type}-${r.id}`}
                                    onClick={() => selectItem(r)}
                                    className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-accent/50 transition-colors text-left"
                                >
                                    <div className="relative h-12 w-8 rounded overflow-hidden flex-shrink-0 bg-muted">
                                        {r.poster_path ? (
                                            <Image
                                                src={`${TMDB_IMAGE_BASE}/${TMDB_POSTER_SIZES.small}${r.poster_path}`}
                                                alt=""
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <Film className="h-4 w-4 text-muted-foreground/40" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{r.title || r.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {r.media_type === 'movie' ? '🎬' : '📺'} {(r.release_date || r.first_air_date || '').slice(0, 4)}
                                            {r.vote_average > 0 && ` · ⭐ ${r.vote_average.toFixed(1)}`}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Comparison table */}
            {hasAtLeastTwo && (
                <>
                    <div className="mt-8 space-y-4 md:hidden">
                        {items.map((item, idx) => {
                            if (!item) return null;
                            return (
                                <div key={`mobile-${item.id}-${idx}`} className="rounded-xl border border-border bg-card p-4">
                                    <h3 className="text-sm font-semibold mb-3 truncate">{item.title}</h3>
                                    <div className="space-y-2">
                                        {comparisonRows.map((row) => (
                                            <div key={`mobile-row-${row.label}-${idx}`} className="flex items-center justify-between gap-3 text-xs">
                                                <span className="text-muted-foreground">{row.label}</span>
                                                <span className={row.highlights[idx] ? 'font-semibold text-primary' : ''}>{row.values[idx]}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="hidden md:block rounded-xl border border-border overflow-hidden bg-card mt-8 overflow-x-auto">
                        {/* Header Row */}
                        <div className="grid grid-cols-[120px_repeat(4,1fr)] gap-4 px-4 py-3 bg-muted/50 border-b border-border/50 min-w-[600px]">
                            <div className="text-xs font-semibold text-muted-foreground">{t('metric')}</div>
                            {items.map((item, i) => (
                                <div key={`head-${i}`} className="text-sm font-semibold truncate text-center">
                                    {item ? item.title : ''}
                                </div>
                            ))}
                        </div>

                        {/* Data Rows */}
                        {comparisonRows.map((row, i) => (
                            <div key={row.label} className={`grid grid-cols-[120px_repeat(4,1fr)] gap-4 px-4 py-3 min-w-[600px] hover:bg-muted/20 transition-colors ${i > 0 ? 'border-t border-border/50' : ''}`}>
                                <div className="text-xs font-medium text-muted-foreground flex items-center">
                                    {row.label}
                                </div>
                                {row.values.map((val, rowIdx) => (
                                    <div key={rowIdx} className={`text-sm text-center flex items-center justify-center ${row.highlights[rowIdx] ? 'font-bold text-primary bg-primary/5 rounded py-1' : ''}`}>
                                        {val}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </>
            )}

            {!hasAtLeastTwo && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <p className="text-sm">{t('selectTwo')}</p>
                </div>
            )}
        </div>
    );
}

function CompareSlot({
    item,
    onSearch,
    onRemove,
    tM,
    t,
    lockedType,
}: {
    item: CompareItem | null;
    onSearch: () => void;
    onRemove: () => void;
    tM: (key: string) => string;
    t: (key: string) => string;
    lockedType: 'movie' | 'tv' | null;
}) {
    if (!item) {
        return (
            <button
                onClick={onSearch}
                className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-border rounded-xl hover:border-primary/50 hover:bg-accent/30 transition-colors cursor-pointer h-full min-h-[300px]"
            >
                <Search className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground text-center px-2">
                    {lockedType ? t(`searchToAddLocked${lockedType === 'movie' ? 'Movie' : 'Tv'}`) : t('searchToAdd')}
                </p>
            </button>
        );
    }

    return (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="relative">
                {item.posterPath ? (
                    <div className="relative h-64 w-full">
                        <Image
                            src={`${TMDB_IMAGE_BASE}/${TMDB_POSTER_SIZES.large}${item.posterPath}`}
                            alt={item.title}
                            fill
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                    </div>
                ) : (
                    <div className="h-40 bg-muted flex items-center justify-center">
                        <Film className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 bg-background/60 backdrop-blur-sm hover:bg-background/80"
                    onClick={onRemove}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
            <div className="p-4">
                <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-xs">
                        {item.mediaType === 'movie' ? tM('movie') : tM('series')}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{item.year}</span>
                </div>
                <h3 className="text-lg font-bold mb-1">{item.title}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                    <span className="font-medium text-foreground">{item.rating.toFixed(1)}</span>
                    <span>({item.votes.toLocaleString()} {tM('votes')})</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{item.overview}</p>
            </div>
        </div>
    );
}
