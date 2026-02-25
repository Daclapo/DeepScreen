'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeftRight, X, Search, Star, Clock, Calendar, DollarSign, Film, Tv } from 'lucide-react';
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

    const [items, setItems] = useState<(CompareItem | null)[]>([null, null]);
    const [searchSlot, setSearchSlot] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');

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
            runtime: mediaType === 'movie' ? `${detail.runtime || 0} min` : `${detail.number_of_episodes || 0} ${tM('episodes')}`,
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
        (r: { media_type?: string }) => r.media_type === 'movie' || r.media_type === 'tv'
    );

    const bothFilled = items[0] !== null && items[1] !== null;

    // Comparison rows
    const comparisonRows = bothFilled ? [
        { label: tM('rating'), values: items.map(i => i ? `⭐ ${i.rating.toFixed(1)}` : '—'), highlight: (items[0]!.rating > items[1]!.rating) ? 0 : items[0]!.rating < items[1]!.rating ? 1 : -1 },
        { label: tM('votes'), values: items.map(i => i ? i.votes.toLocaleString() : '—'), highlight: (items[0]!.votes > items[1]!.votes) ? 0 : items[0]!.votes < items[1]!.votes ? 1 : -1 },
        { label: tM('genres'), values: items.map(i => i?.genres || '—'), highlight: -1 },
        { label: tM('runtime'), values: items.map(i => i?.runtime || '—'), highlight: -1 },
        { label: tM('status'), values: items.map(i => i?.status || '—'), highlight: -1 },
        ...(items[0]?.mediaType === 'movie' && items[1]?.mediaType === 'movie' ? [
            { label: tM('budget'), values: items.map(i => i?.budget || '—'), highlight: -1 },
            { label: tM('revenue'), values: items.map(i => i?.revenue || '—'), highlight: -1 },
        ] : []),
        ...(items[0]?.mediaType === 'tv' && items[1]?.mediaType === 'tv' ? [
            { label: tM('seasons'), values: items.map(i => i?.seasons != null ? String(i.seasons) : '—'), highlight: -1 },
            { label: tM('episodes'), values: items.map(i => i?.episodes != null ? String(i.episodes) : '—'), highlight: -1 },
        ] : []),
    ] : [];

    return (
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
            <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>

            {/* Slots */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-start mb-8">
                {/* Slot 0 */}
                <CompareSlot
                    item={items[0]}
                    onSearch={() => { setSearchSlot(0); setSearchQuery(''); setDebouncedQuery(''); }}
                    onRemove={() => removeItem(0)}
                    tM={tM}
                    t={t}
                />

                {/* VS */}
                <div className="hidden md:flex items-center justify-center pt-16">
                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary">
                        <ArrowLeftRight className="h-5 w-5" />
                    </div>
                </div>

                {/* Slot 1 */}
                <CompareSlot
                    item={items[1]}
                    onSearch={() => { setSearchSlot(1); setSearchQuery(''); setDebouncedQuery(''); }}
                    onRemove={() => removeItem(1)}
                    tM={tM}
                    t={t}
                />
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
            {bothFilled && (
                <div className="rounded-xl border border-border overflow-hidden bg-card">
                    {comparisonRows.map((row, i) => (
                        <div key={row.label} className={`grid grid-cols-[1fr_auto_1fr] gap-4 px-4 py-3 ${i > 0 ? 'border-t border-border/50' : ''}`}>
                            <div className={`text-sm text-right ${row.highlight === 0 ? 'font-semibold text-primary' : ''}`}>
                                {row.values[0]}
                            </div>
                            <div className="text-xs text-muted-foreground text-center w-24 flex items-center justify-center">
                                {row.label}
                            </div>
                            <div className={`text-sm ${row.highlight === 1 ? 'font-semibold text-primary' : ''}`}>
                                {row.values[1]}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!bothFilled && (
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
}: {
    item: CompareItem | null;
    onSearch: () => void;
    onRemove: () => void;
    tM: (key: string) => string;
    t: (key: string) => string;
}) {
    if (!item) {
        return (
            <button
                onClick={onSearch}
                className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-border rounded-xl hover:border-primary/50 hover:bg-accent/30 transition-colors cursor-pointer"
            >
                <Search className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">{t('searchToAdd')}</p>
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
