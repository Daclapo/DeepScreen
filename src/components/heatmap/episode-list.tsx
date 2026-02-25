'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowUpDown, ArrowUp, ArrowDown, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { EpisodeRating } from '@/types';

interface EpisodeListProps {
    episodeRatings: EpisodeRating[];
    selectedSeason: number | null;
}

type SortKey = 'episode' | 'rating' | 'airDate';
type SortDir = 'asc' | 'desc';

export function EpisodeList({ episodeRatings, selectedSeason }: EpisodeListProps) {
    const t = useTranslations('heatmap');
    const tM = useTranslations('media');
    const [sortKey, setSortKey] = useState<SortKey>('episode');
    const [sortDir, setSortDir] = useState<SortDir>('asc');

    const filtered = useMemo(() => {
        if (selectedSeason === null) return episodeRatings;
        return episodeRatings.filter(e => e.season === selectedSeason);
    }, [episodeRatings, selectedSeason]);

    const sorted = useMemo(() => {
        const arr = [...filtered];
        arr.sort((a, b) => {
            let cmp = 0;
            if (sortKey === 'episode') {
                cmp = a.season !== b.season ? a.season - b.season : a.episode - b.episode;
            } else if (sortKey === 'rating') {
                const rA = a.rating ?? -1;
                const rB = b.rating ?? -1;
                cmp = rA - rB;
            } else if (sortKey === 'airDate') {
                cmp = (a.airDate || '').localeCompare(b.airDate || '');
            }
            return sortDir === 'asc' ? cmp : -cmp;
        });
        return arr;
    }, [filtered, sortKey, sortDir]);

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir(key === 'rating' ? 'desc' : 'asc');
        }
    };

    const SortIcon = ({ col }: { col: SortKey }) => {
        if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
        return sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
    };

    if (sorted.length === 0) return null;

    return (
        <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">{tM('episodes')}</h3>
            <div className="rounded-lg border border-border overflow-hidden bg-card">
                {/* Header */}
                <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/50 border-b border-border text-xs font-medium text-muted-foreground">
                    <button
                        onClick={() => toggleSort('episode')}
                        className="flex items-center gap-1 hover:text-foreground transition-colors w-16"
                    >
                        # <SortIcon col="episode" />
                    </button>
                    <div className="flex-1 min-w-0">{tM('episode')}</div>
                    <button
                        onClick={() => toggleSort('airDate')}
                        className="flex items-center gap-1 hover:text-foreground transition-colors w-24 justify-end"
                    >
                        {tM('releaseDate')} <SortIcon col="airDate" />
                    </button>
                    <button
                        onClick={() => toggleSort('rating')}
                        className="flex items-center gap-1 hover:text-foreground transition-colors w-16 justify-end"
                    >
                        {tM('rating')} <SortIcon col="rating" />
                    </button>
                </div>

                {/* Rows */}
                <div className="max-h-[500px] overflow-y-auto">
                    {sorted.map(ep => (
                        <div
                            key={`${ep.season}-${ep.episode}`}
                            className="flex items-center gap-2 px-4 py-2.5 border-b border-border/50 last:border-b-0 hover:bg-accent/30 transition-colors text-sm"
                        >
                            <span className="w-16 text-xs text-muted-foreground font-mono">
                                S{String(ep.season).padStart(2, '0')}E{String(ep.episode).padStart(2, '0')}
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="truncate font-medium text-sm">{ep.title || `Episode ${ep.episode}`}</p>
                            </div>
                            <span className="w-24 text-right text-xs text-muted-foreground">
                                {ep.airDate || '—'}
                            </span>
                            <span className="w-16 text-right">
                                {ep.rating !== null ? (
                                    <span className="inline-flex items-center gap-0.5 text-sm font-medium">
                                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                        {ep.rating.toFixed(1)}
                                    </span>
                                ) : (
                                    <span className="text-xs text-muted-foreground">—</span>
                                )}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
