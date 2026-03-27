'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Timer, ChevronUp, ChevronDown, Info, AlertTriangle, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface BingeCalculatorProps {
    totalEpisodes: number;
    episodeRunTime: number[]; // minutes per episode, may be empty
    seriesName: string;
}

export function BingeCalculator({ totalEpisodes, episodeRunTime, seriesName }: BingeCalculatorProps) {
    const t = useTranslations('binge');
    const [mode, setMode] = useState<'standard' | 'reverse'>('standard');
    
    // Standard Mode State
    const [preset, setPreset] = useState<'week' | 'twoWeeks' | 'month' | 'twoMonths' | 'custom'>('week');
    const [customDays, setCustomDays] = useState(7);
    
    // Reverse Mode State
    const [watchRate, setWatchRate] = useState(2); // e.g. 2 episodes
    const [rateUnit, setRateUnit] = useState<'day' | 'week'>('day'); // per day or per week

    // Common Runtime State
    const hasRuntimeData = episodeRunTime.length > 0;
    const tmdbAvgRuntime = useMemo(() => {
        if (!hasRuntimeData) return 45;
        return Math.round(episodeRunTime.reduce((a, b) => a + b, 0) / episodeRunTime.length);
    }, [episodeRunTime, hasRuntimeData]);

    const [customRuntime, setCustomRuntime] = useState<number>(tmdbAvgRuntime);
    const avgRuntime = customRuntime;
    const isCustomized = customRuntime !== tmdbAvgRuntime;

    // Standard Calculations
    const daysStandard = useMemo(() => {
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

    const epPerDayStandard = totalEpisodes / daysStandard;
    const epPerDayRounded = Math.ceil(epPerDayStandard);
    const minutesPerDayStandard = totalMinutes / daysStandard;
    const hoursPerDayStandard = Math.floor(minutesPerDayStandard / 60);
    const minsPerDayStandard = Math.round(minutesPerDayStandard % 60);

    // Reverse Calculations
    const daysNeededReverse = useMemo(() => {
        const episodesPerDay = rateUnit === 'day' ? watchRate : watchRate / 7;
        return Math.ceil(totalEpisodes / episodesPerDay);
    }, [totalEpisodes, watchRate, rateUnit]);

    const minutesPerDayReverse = useMemo(() => {
        const episodesPerDay = rateUnit === 'day' ? watchRate : watchRate / 7;
        return episodesPerDay * avgRuntime;
    }, [watchRate, rateUnit, avgRuntime]);

    const hoursPerDayReverse = Math.floor(minutesPerDayReverse / 60);
    const minsPerDayReverse = Math.round(minutesPerDayReverse % 60);

    const formatReverseResult = () => {
        if (daysNeededReverse === 1) return t('reverseResultOne');
        if (daysNeededReverse < 14) return t('reverseResultDays', { days: daysNeededReverse });
        if (daysNeededReverse < 60) return t('reverseResultWeeks', { weeks: Math.round(daysNeededReverse / 7 * 10) / 10 });
        return t('reverseResultMonths', { months: Math.round(daysNeededReverse / 30 * 10) / 10 });
    };

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

    return (
        <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-border/50 bg-primary/5 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                    <Timer className="h-5 w-5 text-primary" />
                    <h3 className="text-base font-semibold">{t('title')}</h3>
                </div>
                
                <Tabs value={mode} onValueChange={(v) => setMode(v as 'standard' | 'reverse')} className="w-auto">
                    <TabsList className="h-8">
                        <TabsTrigger value="standard" className="text-xs">{t('modeStandard') || 'Standard'}</TabsTrigger>
                        <TabsTrigger value="reverse" className="text-xs">{t('modeReverse') || 'Reverse'}</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>
            
            <div className="px-5 py-5 space-y-5 flex-1 select-none">
                {/* Mode Selector / Question */}
                {mode === 'standard' ? (
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
                ) : (
                    <div>
                        <p className="text-sm text-muted-foreground mb-3">{t('reverseQuestion') || 'How many episodes do you watch?'}</p>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center rounded-md border border-border">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 rounded-r-none"
                                    onClick={() => setWatchRate(Math.max(1, watchRate - 1))}
                                >
                                    <ChevronDown className="h-4 w-4" />
                                </Button>
                                <Input
                                    type="number"
                                    value={watchRate}
                                    onChange={(e) => setWatchRate(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-16 h-9 text-center border-0 text-base font-bold text-primary rounded-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                    min={1}
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 rounded-l-none"
                                    onClick={() => setWatchRate(watchRate + 1)}
                                >
                                    <ChevronUp className="h-4 w-4" />
                                </Button>
                            </div>
                            <span className="text-sm font-medium">{t('episodes') || 'episodes'}</span>
                            
                            <div className="flex bg-muted rounded-md p-0.5 ml-2">
                                <button
                                    className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors ${rateUnit === 'day' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                    onClick={() => setRateUnit('day')}
                                >
                                    {t('perDayUnit') || 'per day'}
                                </button>
                                <button
                                    className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors ${rateUnit === 'week' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                    onClick={() => setRateUnit('week')}
                                >
                                    {t('perWeekUnit') || 'per week'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Answer — hero style with prominent results */}
                <div className="rounded-lg bg-primary/5 border border-primary/20 px-5 py-4">
                    <p className="text-sm font-semibold text-foreground mb-3">
                        {mode === 'standard' 
                            ? (epPerDayRounded <= 1
                                ? t('yesOne')
                                : t('yes', { epPerDay: epPerDayStandard % 1 === 0 ? String(epPerDayRounded) : `${Math.floor(epPerDayStandard)}-${epPerDayRounded}` }))
                            : formatReverseResult()
                        }
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-md bg-primary/10 px-3 py-2.5 text-center flex flex-col justify-center items-center min-h-[76px]">
                            {mode === 'standard' ? (
                                <>
                                    <p className="text-2xl font-bold text-primary leading-none mb-1">
                                        {hoursPerDayStandard > 0 ? `${hoursPerDayStandard}h ${minsPerDayStandard}m` : `${minsPerDayStandard}m`}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                                        {t('perDay', { hours: String(hoursPerDayStandard), minutes: String(minsPerDayStandard) }).replace(/^~/, '')}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p className="text-2xl font-bold text-primary leading-none mb-1">
                                        {daysNeededReverse}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                                        {t('daysLabel') || 'Days'}
                                    </p>
                                </>
                            )}
                        </div>
                        <div className="rounded-md bg-primary/10 px-3 py-2.5 text-center flex flex-col justify-center items-center min-h-[76px]">
                            <p className="text-2xl font-bold text-primary leading-none mb-1">
                                {totalHours > 0 ? `${totalHours}h ${totalMins}m` : `${totalMins}m`}
                            </p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                                Total
                            </p>
                        </div>
                    </div>
                    {mode === 'reverse' && (hoursPerDayReverse > 0 || minsPerDayReverse > 0) && (
                        <p className="text-[10px] text-muted-foreground text-center mt-3 pt-3 border-t border-primary/10">
                            You'll be watching ~{hoursPerDayReverse > 0 ? `${hoursPerDayReverse}h ` : ''}{minsPerDayReverse}m per day
                        </p>
                    )}
                </div>

                {/* Visual breakdown (Editable Runtime) */}
                <div className={`grid gap-3 ${mode === 'standard' ? 'grid-cols-3' : 'grid-cols-2'}`}>
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

                    {mode === 'standard' && (
                        <div className="text-center p-3 rounded-lg bg-muted/50">
                            <p className="text-2xl font-bold text-primary">{daysStandard}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Days</p>
                        </div>
                    )}
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

