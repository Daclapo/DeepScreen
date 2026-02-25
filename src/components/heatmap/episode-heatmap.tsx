'use client';

import { useRef, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/components/layout/theme-provider';
import { Button } from '@/components/ui/button';
import { HEATMAP_COLORS } from '@/lib/constants';
import type { EpisodeRating } from '@/types';

interface EpisodeHeatmapProps {
    episodeRatings: EpisodeRating[];
}

export function EpisodeHeatmap({ episodeRatings }: EpisodeHeatmapProps) {
    const t = useTranslations('heatmap');
    const { theme } = useTheme();
    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedSeason, setSelectedSeason] = useState<number | null>(null);

    const seasons = useMemo(() => {
        const seasonSet = new Set(episodeRatings.map((e) => e.season));
        return Array.from(seasonSet).sort((a, b) => a - b);
    }, [episodeRatings]);

    const filteredEpisodes = useMemo(() => {
        if (selectedSeason === null) return episodeRatings;
        return episodeRatings.filter((e) => e.season === selectedSeason);
    }, [episodeRatings, selectedSeason]);

    const maxEpisodesInSeason = useMemo(() => {
        const counts: Record<number, number> = {};
        for (const ep of filteredEpisodes) {
            counts[ep.season] = Math.max(counts[ep.season] || 0, ep.episode);
        }
        return Math.max(...Object.values(counts), 1);
    }, [filteredEpisodes]);

    const displaySeasons = useMemo(() => {
        if (selectedSeason !== null) return [selectedSeason];
        return seasons;
    }, [selectedSeason, seasons]);

    const ratingRange = useMemo(() => {
        const rated = filteredEpisodes.filter((e) => e.rating !== null);
        if (rated.length === 0) return { min: 0, max: 10 };
        const ratings = rated.map((e) => e.rating!);
        return { min: Math.min(...ratings), max: Math.max(...ratings) };
    }, [filteredEpisodes]);

    const colors = theme === 'dark' ? HEATMAP_COLORS.dark : HEATMAP_COLORS.light;

    const getRatingColor = (rating: number | null): string => {
        if (rating === null) return colors.noData;
        const { min, max } = ratingRange;
        const range = max - min || 1;
        const normalized = (rating - min) / range; // 0 to 1

        // Interpolate between low, mid, high
        if (normalized <= 0.5) {
            return interpolateColor(colors.low, colors.mid, normalized * 2);
        }
        return interpolateColor(colors.mid, colors.high, (normalized - 0.5) * 2);
    };

    const getTextColor = (rating: number | null): string => {
        if (rating === null) return theme === 'dark' ? '#4a5568' : '#a0aec0';
        const { min, max } = ratingRange;
        const range = max - min || 1;
        const normalized = (rating - min) / range;
        if (theme === 'dark') {
            return normalized > 0.4 ? '#0a0a0a' : '#e2e8f0';
        }
        return normalized > 0.6 ? '#ffffff' : '#1a202c';
    };

    return (
        <div ref={containerRef} className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-lg font-semibold">{t('title')}</h3>
                <div className="flex items-center gap-1 flex-wrap">
                    <Button
                        variant={selectedSeason === null ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedSeason(null)}
                        className="text-xs h-7"
                    >
                        {t('allSeasons')}
                    </Button>
                    {seasons.map((s) => (
                        <Button
                            key={s}
                            variant={selectedSeason === s ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedSeason(s)}
                            className="text-xs h-7 px-2"
                        >
                            S{s}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Heatmap grid */}
            <div className="overflow-x-auto rounded-lg border border-border bg-card p-4">
                {/* Column headers */}
                <div className="flex gap-1 mb-1 pl-12">
                    {Array.from({ length: maxEpisodesInSeason }, (_, i) => (
                        <div
                            key={i}
                            className="flex-shrink-0 w-10 text-center text-[10px] text-muted-foreground font-medium"
                        >
                            E{i + 1}
                        </div>
                    ))}
                </div>

                {/* Rows */}
                {displaySeasons.map((season) => {
                    const seasonEpisodes = filteredEpisodes.filter((e) => e.season === season);
                    return (
                        <div key={season} className="flex items-center gap-1 mb-1">
                            <div className="w-10 shrink-0 text-xs text-muted-foreground font-medium text-right pr-1">
                                S{season}
                            </div>
                            <div className="flex gap-1">
                                {Array.from({ length: maxEpisodesInSeason }, (_, i) => {
                                    const ep = seasonEpisodes.find((e) => e.episode === i + 1);
                                    if (!ep) {
                                        return <div key={i} className="w-10 h-10 shrink-0" />;
                                    }
                                    return (
                                        <div
                                            key={i}
                                            className="group relative w-10 h-10 shrink-0 rounded cursor-default flex items-center justify-center text-xs font-mono font-medium transition-transform hover:scale-110 hover:z-10"
                                            style={{
                                                backgroundColor: getRatingColor(ep.rating),
                                                color: getTextColor(ep.rating),
                                                border: ep.rating === null ? '1px dashed var(--border)' : 'none',
                                            }}
                                        >
                                            {ep.rating !== null ? ep.rating.toFixed(1) : '—'}

                                            {/* Tooltip */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 rounded-lg bg-popover border border-border shadow-lg p-2.5 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 text-left">
                                                <div className="text-xs font-semibold text-popover-foreground truncate">{ep.title}</div>
                                                <div className="text-[10px] text-muted-foreground mt-0.5">
                                                    S{ep.season}E{ep.episode}
                                                    {ep.airDate && ` · ${ep.airDate}`}
                                                </div>
                                                {ep.rating !== null && (
                                                    <div className="text-xs mt-1 font-medium text-popover-foreground">
                                                        Rating: {ep.rating.toFixed(1)}
                                                    </div>
                                                )}
                                                {ep.rating === null && (
                                                    <div className="text-[10px] italic text-muted-foreground mt-1">{t('noRating')}</div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}

                {/* Color legend */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
                    <span className="text-xs text-muted-foreground">{ratingRange.min.toFixed(1)}</span>
                    <div
                        className="flex-1 h-2 rounded-full max-w-xs"
                        style={{
                            background: `linear-gradient(to right, ${colors.low}, ${colors.mid}, ${colors.high})`,
                        }}
                    />
                    <span className="text-xs text-muted-foreground">{ratingRange.max.toFixed(1)}</span>
                    <div className="ml-4 flex items-center gap-1">
                        <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: colors.noData, border: '1px dashed var(--border)' }}
                        />
                        <span className="text-xs text-muted-foreground">{t('noRating')}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Color interpolation helper
function interpolateColor(color1: string, color2: string, factor: number): string {
    const hex2rgb = (hex: string) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return [r, g, b];
    };

    const rgb2hex = (r: number, g: number, b: number) =>
        '#' + [r, g, b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('');

    const [r1, g1, b1] = hex2rgb(color1);
    const [r2, g2, b2] = hex2rgb(color2);

    return rgb2hex(
        r1 + (r2 - r1) * factor,
        g1 + (g2 - g1) * factor,
        b1 + (b2 - b1) * factor
    );
}
