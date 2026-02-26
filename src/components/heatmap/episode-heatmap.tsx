'use client';

import { useRef, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/components/layout/theme-provider';
import { Button } from '@/components/ui/button';
import { HEATMAP_COLORS, HEATMAP_COLORS_CLASSIC } from '@/lib/constants';
import type { EpisodeRating } from '@/types';

type ColorScale = 'default' | 'classic';
type ScaleMode = 'relative' | 'absolute';

interface EpisodeHeatmapProps {
    episodeRatings: EpisodeRating[];
    onSeasonChange?: (season: number | null) => void;
}

export function EpisodeHeatmap({ episodeRatings, onSeasonChange }: EpisodeHeatmapProps) {
    const t = useTranslations('heatmap');
    const { theme } = useTheme();
    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
    const [colorScale, setColorScale] = useState<ColorScale>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('HEATMAP_COLOR_SCALE') as ColorScale) || 'classic';
        }
        return 'classic';
    });
    const [scaleMode, setScaleMode] = useState<ScaleMode>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('HEATMAP_SCALE_MODE') as ScaleMode) || 'absolute';
        }
        return 'absolute';
    });

    const handleSeasonChange = (season: number | null) => {
        setSelectedSeason(season);
        onSeasonChange?.(season);
    };

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
        if (scaleMode === 'absolute') return { min: 4, max: 10 };
        const rated = filteredEpisodes.filter((e) => e.rating !== null);
        if (rated.length === 0) return { min: 4, max: 10 };
        const ratings = rated.map((e) => e.rating!);
        return { min: Math.min(...ratings), max: Math.max(...ratings) };
    }, [filteredEpisodes, scaleMode]);

    // Season averages
    const seasonAverages = useMemo(() => {
        const map = new Map<number, number[]>();
        for (const ep of episodeRatings) {
            if (ep.rating !== null) {
                const existing = map.get(ep.season) || [];
                existing.push(ep.rating);
                map.set(ep.season, existing);
            }
        }
        const result: Record<number, number> = {};
        for (const [season, ratings] of map) {
            result[season] = ratings.reduce((a, b) => a + b, 0) / ratings.length;
        }
        return result;
    }, [episodeRatings]);

    const getDefaultColors = () => theme === 'dark' ? HEATMAP_COLORS.dark : HEATMAP_COLORS.light;
    const getClassicColors = () => theme === 'dark' ? HEATMAP_COLORS_CLASSIC.dark : HEATMAP_COLORS_CLASSIC.light;

    const getRatingColor = (rating: number | null): string => {
        if (rating === null) {
            return colorScale === 'classic' ? getClassicColors().noData : getDefaultColors().noData;
        }
        const { min, max } = ratingRange;
        const range = max - min || 1;
        const normalized = Math.max(0, Math.min(1, (rating - min) / range)); // 0 to 1

        if (colorScale === 'classic') {
            const c = getClassicColors();
            if (normalized <= 0.25) return interpolateColor(c.low, c.midLow, normalized * 4);
            if (normalized <= 0.5) return interpolateColor(c.midLow, c.mid, (normalized - 0.25) * 4);
            if (normalized <= 0.75) return interpolateColor(c.mid, c.midHigh, (normalized - 0.5) * 4);
            return interpolateColor(c.midHigh, c.high, (normalized - 0.75) * 4);
        }

        const c = getDefaultColors();
        if (normalized <= 0.5) return interpolateColor(c.low, c.mid, normalized * 2);
        return interpolateColor(c.mid, c.high, (normalized - 0.5) * 2);
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

    const getLegendGradient = () => {
        if (colorScale === 'classic') {
            const c = getClassicColors();
            return `linear-gradient(to right, ${c.low}, ${c.midLow}, ${c.mid}, ${c.midHigh}, ${c.high})`;
        }
        const c = getDefaultColors();
        return `linear-gradient(to right, ${c.low}, ${c.mid}, ${c.high})`;
    };

    return (
        <div ref={containerRef} className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-lg font-semibold">{t('title')}</h3>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    {/* Color palette toggle */}
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground">{t('colors')}</span>
                        <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
                            <button
                                onClick={() => setColorScale('classic')}
                                className={`px-2 py-0.5 text-[10px] rounded transition-colors ${colorScale === 'classic' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                {t('scaleClassic')}
                            </button>
                            <button
                                onClick={() => setColorScale('default')}
                                className={`px-2 py-0.5 text-[10px] rounded transition-colors ${colorScale === 'default' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                {t('scaleDefault')}
                            </button>
                        </div>
                    </div>
                    {/* Scale Mode toggle */}
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground">{t('colorScale')}</span>
                        <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
                            <button
                                onClick={() => setScaleMode('absolute')}
                                className={`px-2 py-0.5 text-[10px] rounded transition-colors ${scaleMode === 'absolute' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                {t('modeAbsolute')}
                            </button>
                            <button
                                onClick={() => setScaleMode('relative')}
                                className={`px-2 py-0.5 text-[10px] rounded transition-colors ${scaleMode === 'relative' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                {t('modeRelative')}
                            </button>
                        </div>
                    </div>
                    {/* Season filter */}
                    <div className="flex items-center gap-1 flex-wrap">
                        <Button
                            variant={selectedSeason === null ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleSeasonChange(null)}
                            className="text-xs h-7"
                        >
                            {t('allSeasons')}
                        </Button>
                        {seasons.map((s) => (
                            <Button
                                key={s}
                                variant={selectedSeason === s ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleSeasonChange(s)}
                                className="text-xs h-7 px-2"
                            >
                                S{s}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Heatmap grid */}
            <div className="overflow-x-auto rounded-lg border border-border bg-card p-4">
                {/* Column headers */}
                <div className="flex gap-1 mb-1 pl-20">
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
                    const avg = seasonAverages[season];
                    return (
                        <div key={season} className="flex items-center gap-1 mb-1">
                            <div className="w-10 shrink-0 text-xs text-muted-foreground font-medium text-right pr-1">
                                S{season}
                            </div>
                            {/* Season average badge */}
                            <div className="w-9 shrink-0 text-center">
                                {avg !== undefined && (
                                    <span className="text-[10px] font-semibold px-1 py-0.5 rounded bg-muted text-foreground">
                                        {avg.toFixed(1)}
                                    </span>
                                )}
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
                        style={{ background: getLegendGradient() }}
                    />
                    <span className="text-xs text-muted-foreground">{ratingRange.max.toFixed(1)}</span>
                    <div className="ml-4 flex items-center gap-1">
                        <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: colorScale === 'classic' ? getClassicColors().noData : getDefaultColors().noData, border: '1px dashed var(--border)' }}
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
