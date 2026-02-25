'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { EpisodeRating } from '@/types';

interface SeasonTrendChartProps {
    episodeRatings: EpisodeRating[];
}

export function SeasonTrendChart({ episodeRatings }: SeasonTrendChartProps) {
    const tH = useTranslations('heatmap');
    const tM = useTranslations('media');

    const seasonAverages = useMemo(() => {
        const seasonMap = new Map<number, number[]>();
        for (const ep of episodeRatings) {
            if (ep.rating !== null) {
                const existing = seasonMap.get(ep.season) || [];
                existing.push(ep.rating);
                seasonMap.set(ep.season, existing);
            }
        }
        return Array.from(seasonMap.entries())
            .map(([season, ratings]) => ({
                season,
                avg: ratings.reduce((a, b) => a + b, 0) / ratings.length,
                count: ratings.length,
            }))
            .sort((a, b) => a.season - b.season);
    }, [episodeRatings]);

    if (seasonAverages.length < 2) return null;

    const maxRating = Math.max(...seasonAverages.map(s => s.avg));
    const minRating = Math.min(...seasonAverages.map(s => s.avg));
    const range = maxRating - minRating || 1;
    const chartHeight = 160;
    const padTop = 20;
    const padBottom = 30;
    const usableHeight = chartHeight - padTop - padBottom;

    // Trend direction
    const first = seasonAverages[0].avg;
    const last = seasonAverages[seasonAverages.length - 1].avg;
    const trending = last > first ? 'up' : last < first ? 'down' : 'flat';

    return (
        <div className="rounded-lg border border-border p-4 bg-card">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">{tH('avgRating')} per {tM('season')}</h3>
                <div className="flex items-center gap-1 text-xs">
                    {trending === 'up' ? (
                        <><TrendingUp className="h-3.5 w-3.5 text-green-500" /> <span className="text-green-500">+{(last - first).toFixed(1)}</span></>
                    ) : trending === 'down' ? (
                        <><TrendingDown className="h-3.5 w-3.5 text-red-500" /> <span className="text-red-500">{(last - first).toFixed(1)}</span></>
                    ) : null}
                </div>
            </div>

            {/* Chart */}
            <div className="relative" style={{ height: chartHeight }}>
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-between text-[10px] text-muted-foreground" style={{ top: padTop, bottom: padBottom }}>
                    <span>{maxRating.toFixed(1)}</span>
                    <span>{minRating.toFixed(1)}</span>
                </div>

                {/* Bars + line */}
                <div className="ml-10 mr-2 relative" style={{ height: chartHeight }}>
                    <svg width="100%" height={chartHeight} className="overflow-visible">
                        {/* Grid lines */}
                        {[0, 0.25, 0.5, 0.75, 1].map(pct => {
                            const y = padTop + (1 - pct) * usableHeight;
                            return <line key={pct} x1="0" y1={y} x2="100%" y2={y} stroke="currentColor" className="text-border" strokeDasharray="2,4" />;
                        })}

                        {/* Bars */}
                        {seasonAverages.map((s, i) => {
                            const barWidth = 100 / seasonAverages.length;
                            const x = i * barWidth + barWidth * 0.15;
                            const w = barWidth * 0.7;
                            const normalizedHeight = ((s.avg - minRating) / range) * usableHeight;
                            const y = padTop + usableHeight - normalizedHeight;
                            const ratio = (s.avg - minRating) / range;
                            const hue = ratio * 120; // 0=red, 120=green

                            return (
                                <g key={s.season}>
                                    <rect
                                        x={`${x}%`}
                                        y={y}
                                        width={`${w}%`}
                                        height={normalizedHeight}
                                        rx={3}
                                        fill={`hsl(${hue}, 70%, 50%)`}
                                        opacity={0.8}
                                    />
                                    {/* Rating label */}
                                    <text
                                        x={`${x + w / 2}%`}
                                        y={y - 4}
                                        textAnchor="middle"
                                        className="fill-foreground text-[10px] font-medium"
                                    >
                                        {s.avg.toFixed(1)}
                                    </text>
                                    {/* Season label */}
                                    <text
                                        x={`${x + w / 2}%`}
                                        y={chartHeight - 5}
                                        textAnchor="middle"
                                        className="fill-muted-foreground text-[10px]"
                                    >
                                        S{s.season}
                                    </text>
                                </g>
                            );
                        })}

                        {/* Trend line */}
                        {seasonAverages.length > 1 && (
                            <polyline
                                points={seasonAverages.map((s, i) => {
                                    const barWidth = 100 / seasonAverages.length;
                                    const x = i * barWidth + barWidth / 2;
                                    const normalizedY = padTop + usableHeight - ((s.avg - minRating) / range) * usableHeight;
                                    return `${x}%,${normalizedY}`;
                                }).join(' ')}
                                fill="none"
                                stroke="hsl(var(--primary))"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        )}

                        {/* Dots on trend line */}
                        {seasonAverages.map((s, i) => {
                            const barWidth = 100 / seasonAverages.length;
                            const x = i * barWidth + barWidth / 2;
                            const normalizedY = padTop + usableHeight - ((s.avg - minRating) / range) * usableHeight;
                            return (
                                <circle
                                    key={`dot-${s.season}`}
                                    cx={`${x}%`}
                                    cy={normalizedY}
                                    r={3}
                                    fill="hsl(var(--primary))"
                                    stroke="hsl(var(--background))"
                                    strokeWidth={1.5}
                                />
                            );
                        })}
                    </svg>
                </div>
            </div>
        </div>
    );
}
