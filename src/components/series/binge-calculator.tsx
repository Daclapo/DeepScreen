'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Timer, ChevronUp, ChevronDown, Info, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface BingeCalculatorProps {
    totalEpisodes: number;
    episodeRunTime: number[]; // minutes per episode, may be empty
    seriesName: string;
}

export function BingeCalculator({ totalEpisodes, episodeRunTime, seriesName }: BingeCalculatorProps) {
    const t = useTranslations('binge');
    const [preset, setPreset] = useState<'week' | 'twoWeeks' | 'month' | 'twoMonths' | 'custom'>('week');
    const [customDays, setCustomDays] = useState(7);

    const hasRuntimeData = episodeRunTime.length > 0;
    const tmdbAvgRuntime = useMemo(() => {
        if (!hasRuntimeData) return 45;
        return Math.round(episodeRunTime.reduce((a, b) => a + b, 0) / episodeRunTime.length);
    }, [episodeRunTime, hasRuntimeData]);

    const [customRuntime, setCustomRuntime] = useState<number>(tmdbAvgRuntime);

    const avgRuntime = customRuntime;

    const days = useMemo(() => {
        switch (preset) {
            case 'week': return 7;
            case 'twoWeeks': return 14;
            case 'month': return 30;
            case 'twoMonths': return 60;
            case 'custom': return customDays;
        }
    }, [preset, customDays]);

    const totalMinutes = totalEpisodes * avgRuntime;
    const totalHours = Math.floor(totalMinutes / 60);
    const totalMins = Math.round(totalMinutes % 60);

    const epPerDay = totalEpisodes / days;
    const epPerDayRounded = Math.ceil(epPerDay);
    const minutesPerDay = totalMinutes / days;
    const hoursPerDay = Math.floor(minutesPerDay / 60);
    const minsPerDay = Math.round(minutesPerDay % 60);

    if (totalEpisodes === 0) {
        return null;
    }

    const presets = [
        { key: 'week' as const, label: t('week') },
        { key: 'twoWeeks' as const, label: t('twoWeeks') },
        { key: 'month' as const, label: t('month') },
        { key: 'twoMonths' as const, label: t('twoMonths') },
        { key: 'custom' as const, label: t('custom') },
    ];

    const isCustomized = customRuntime !== tmdbAvgRuntime;

    return (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border/50 bg-primary/5">
                <div className="flex items-center gap-2">
                    <Timer className="h-5 w-5 text-primary" />
                    <h3 className="text-base font-semibold">{t('title')}</h3>
                </div>
            </div>
            <div className="px-5 py-5 space-y-5">
                {/* Question */}
                <div>
                    <p className="text-sm text-muted-foreground mb-3">{t('question')}</p>
                    <div className="flex flex-wrap gap-2">
                        {presets.map(p => (
                            <Button
                                key={p.key}
                                variant={preset === p.key ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setPreset(p.key)}
                                className="text-xs"
                            >
                                {p.label}
                            </Button>
                        ))}
                    </div>
                    {preset === 'custom' && (
                        <div className="flex items-center gap-2 mt-3">
                            <div className="flex items-center rounded-md border border-border">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-r-none"
                                    onClick={() => setCustomDays(Math.max(1, customDays - 1))}
                                >
                                    <ChevronDown className="h-3.5 w-3.5" />
                                </Button>
                                <Input
                                    type="number"
                                    value={customDays}
                                    onChange={(e) => setCustomDays(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-16 h-8 text-center border-0 text-sm font-medium rounded-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                    min={1}
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-l-none"
                                    onClick={() => setCustomDays(customDays + 1)}
                                >
                                    <ChevronUp className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                            <span className="text-sm text-muted-foreground">{t('days')}</span>
                        </div>
                    )}
                </div>

                {/* Answer — hero style with prominent time per day */}
                <div className="rounded-lg bg-primary/5 border border-primary/20 px-5 py-4">
                    <p className="text-sm font-semibold text-foreground mb-3">
                        {epPerDayRounded <= 1
                            ? t('yesOne')
                            : t('yes', { epPerDay: epPerDay % 1 === 0 ? String(epPerDayRounded) : `${Math.floor(epPerDay)}-${epPerDayRounded}` })
                        }
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-md bg-primary/10 px-3 py-2.5 text-center">
                            <p className="text-2xl font-bold text-primary">
                                {hoursPerDay > 0 ? `${hoursPerDay}h ${minsPerDay}m` : `${minsPerDay}m`}
                            </p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                                {t('perDay', { hours: String(hoursPerDay), minutes: String(minsPerDay) }).replace(/^~/, '')}
                            </p>
                        </div>
                        <div className="rounded-md bg-primary/10 px-3 py-2.5 text-center">
                            <p className="text-2xl font-bold text-primary">
                                {totalHours > 0 ? `${totalHours}h ${totalMins}m` : `${totalMins}m`}
                            </p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                                Total
                            </p>
                        </div>
                    </div>
                </div>

                {/* Visual breakdown */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                        <p className="text-2xl font-bold text-primary">{totalEpisodes}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Episodes</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center justify-center">
                            <div className="flex items-center rounded-md border border-border bg-background">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-8 rounded-r-none"
                                    onClick={() => setCustomRuntime(Math.max(1, customRuntime - 5))}
                                >
                                    <ChevronDown className="h-3.5 w-3.5" />
                                </Button>
                                <Input
                                    type="number"
                                    value={customRuntime}
                                    onChange={(e) => setCustomRuntime(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-14 h-9 text-center border-0 text-2xl font-bold text-primary p-0 rounded-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                    min={1}
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-8 rounded-l-none"
                                    onClick={() => setCustomRuntime(customRuntime + 5)}
                                >
                                    <ChevronUp className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                            {t('minutesPerEp')}
                        </p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                        <p className="text-2xl font-bold text-primary">{days}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Days</p>
                    </div>
                </div>

                {/* Info banner — different message depending on whether runtime is known */}
                <div className={`rounded-lg px-4 py-3 flex items-start gap-2.5 ${
                    hasRuntimeData
                        ? 'bg-blue-500/5 border border-blue-500/20'
                        : 'bg-amber-500/5 border border-amber-500/20'
                }`}>
                    {hasRuntimeData ? (
                        <Info className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                    )}
                    <p className={`text-xs leading-relaxed ${
                        hasRuntimeData ? 'text-blue-300/80' : 'text-amber-300/80'
                    }`}>
                        {hasRuntimeData
                            ? t('knownRuntime', { minutes: String(tmdbAvgRuntime) })
                            : t('unknownRuntime')
                        }
                    </p>
                </div>

                {/* Reset button when customized and runtime is known */}
                {isCustomized && hasRuntimeData && (
                    <div className="flex justify-end">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-muted-foreground h-7"
                            onClick={() => setCustomRuntime(tmdbAvgRuntime)}
                        >
                            ↩ Reset to {tmdbAvgRuntime} min
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

