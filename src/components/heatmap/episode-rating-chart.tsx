'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import type { EpisodeRating } from '@/types';

interface EpisodeRatingChartProps {
    episodeRatings: EpisodeRating[];
}

/**
 * Ratingraph-style episode rating scatter/line chart.
 * Shows all episodes plotted chronologically with their ratings.
 */
export function EpisodeRatingChart({ episodeRatings }: EpisodeRatingChartProps) {
    const tH = useTranslations('heatmap');

    const ratedEpisodes = useMemo(() =>
        episodeRatings.filter(e => e.rating !== null).sort((a, b) => a.season - b.season || a.episode - b.episode),
        [episodeRatings]
    );

    if (ratedEpisodes.length < 2) return null;

    const minRating = Math.min(...ratedEpisodes.map(e => e.rating!));
    const maxRating = Math.max(...ratedEpisodes.map(e => e.rating!));
    const avgRating = ratedEpisodes.reduce((sum, e) => sum + e.rating!, 0) / ratedEpisodes.length;

    // Chart dimensions
    const chartWidth = 100; // percentage
    const chartHeight = 200;
    const padTop = 25;
    const padBottom = 30;
    const padLeft = 35;
    const padRight = 10;
    const usableWidth = chartWidth;
    const usableHeight = chartHeight - padTop - padBottom;

    const ratingToY = (rating: number) => {
        const range = maxRating - minRating || 1;
        return padTop + usableHeight - ((rating - minRating) / range) * usableHeight;
    };

    // Season boundaries for vertical separators
    const seasonBoundaries = useMemo(() => {
        const boundaries: { index: number; season: number }[] = [];
        let prevSeason = -1;
        ratedEpisodes.forEach((ep, i) => {
            if (ep.season !== prevSeason) {
                boundaries.push({ index: i, season: ep.season });
                prevSeason = ep.season;
            }
        });
        return boundaries;
    }, [ratedEpisodes]);

    // Color per season (cycling)
    const seasonColors = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
    const getSeasonColor = (season: number) => seasonColors[(season - 1) % seasonColors.length];

    return (
        <div className="rounded-lg border border-border p-4 bg-card">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">{tH('avgRating')} — All Episodes</h3>
                <span className="text-xs text-muted-foreground">
                    Avg: <span className="font-semibold text-foreground">{avgRating.toFixed(2)}</span>
                </span>
            </div>

            <div className="relative" style={{ height: chartHeight }}>
                <svg width="100%" height={chartHeight} className="overflow-visible" viewBox={`0 0 ${ratedEpisodes.length * 10 + padLeft + padRight} ${chartHeight}`} preserveAspectRatio="none">
                    {/* Y-axis grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map(pct => {
                        const rating = minRating + pct * (maxRating - minRating);
                        const y = ratingToY(rating);
                        return (
                            <g key={pct}>
                                <line x1={padLeft} y1={y} x2={ratedEpisodes.length * 10 + padLeft} y2={y} stroke="currentColor" className="text-border" strokeDasharray="2,4" />
                                <text x={padLeft - 4} y={y + 3} textAnchor="end" className="fill-muted-foreground" style={{ fontSize: '8px' }}>
                                    {rating.toFixed(1)}
                                </text>
                            </g>
                        );
                    })}

                    {/* Average line */}
                    <line
                        x1={padLeft}
                        y1={ratingToY(avgRating)}
                        x2={ratedEpisodes.length * 10 + padLeft}
                        y2={ratingToY(avgRating)}
                        stroke="hsl(var(--primary))"
                        strokeWidth={1}
                        strokeDasharray="4,4"
                        opacity={0.5}
                    />

                    {/* Season separators */}
                    {seasonBoundaries.map(({ index, season }) => {
                        if (index === 0) return null;
                        const x = padLeft + index * 10;
                        return (
                            <line key={`sep-${season}`} x1={x} y1={padTop} x2={x} y2={chartHeight - padBottom} stroke="currentColor" className="text-border" strokeDasharray="2,2" />
                        );
                    })}

                    {/* Data points and lines */}
                    {ratedEpisodes.map((ep, i) => {
                        const x = padLeft + i * 10 + 5;
                        const y = ratingToY(ep.rating!);
                        const color = getSeasonColor(ep.season);
                        const nextEp = ratedEpisodes[i + 1];
                        return (
                            <g key={`${ep.season}-${ep.episode}`}>
                                {nextEp && nextEp.season === ep.season && (
                                    <line
                                        x1={x}
                                        y1={y}
                                        x2={padLeft + (i + 1) * 10 + 5}
                                        y2={ratingToY(nextEp.rating!)}
                                        stroke={color}
                                        strokeWidth={1.5}
                                        opacity={0.6}
                                    />
                                )}
                                <circle cx={x} cy={y} r={3} fill={color} stroke="hsl(var(--background))" strokeWidth={1} />
                            </g>
                        );
                    })}

                    {/* Season labels at bottom */}
                    {seasonBoundaries.map(({ index, season }) => {
                        const nextBoundary = seasonBoundaries.find(b => b.season === season + 1);
                        const endIndex = nextBoundary ? nextBoundary.index : ratedEpisodes.length;
                        const midX = padLeft + ((index + endIndex) / 2) * 10;
                        return (
                            <text key={`label-${season}`} x={midX} y={chartHeight - 8} textAnchor="middle" fill={getSeasonColor(season)} style={{ fontSize: '9px', fontWeight: 600 }}>
                                S{season}
                            </text>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
}
