'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Sun, Moon, ExternalLink, Check, X, AlertCircle, Loader2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useTheme } from '@/components/layout/theme-provider';
import { OMDB_KEY_STORAGE_KEY, RATING_SOURCE_STORAGE_KEY, DEFAULT_RATING_SOURCE } from '@/lib/constants';
import type { RatingSource } from '@/lib/constants';

type HeatmapColorScale = 'default' | 'classic';
type HeatmapScaleMode = 'relative' | 'absolute';

export default function SettingsPage() {
    const t = useTranslations('settings');
    const { theme, setTheme } = useTheme();
    const [omdbKey, setOmdbKey] = useState('');
    const [savedKey, setSavedKey] = useState<string | null>(null);
    const [keyStatus, setKeyStatus] = useState<'idle' | 'testing' | 'valid' | 'invalid'>('idle');
    const [ratingSource, setRatingSourceState] = useState<RatingSource>(DEFAULT_RATING_SOURCE);

    useEffect(() => {
        const storedKey = localStorage.getItem(OMDB_KEY_STORAGE_KEY);
        if (storedKey) {
            setSavedKey(storedKey);
            setOmdbKey(storedKey);
            setKeyStatus('valid');
        }
        const storedSource = localStorage.getItem(RATING_SOURCE_STORAGE_KEY) as RatingSource | null;
        if (storedSource && (storedSource === 'tvmaze' || storedSource === 'imdb')) {
            setRatingSourceState(storedSource);
        }
        const storedColor = localStorage.getItem('HEATMAP_COLOR_SCALE') as HeatmapColorScale | null;
        if (storedColor) setHeatmapColor(storedColor);
        const storedScale = localStorage.getItem('HEATMAP_SCALE_MODE') as HeatmapScaleMode | null;
        if (storedScale) setHeatmapScale(storedScale);
    }, []);

    const testKey = async (key: string) => {
        setKeyStatus('testing');
        try {
            const res = await fetch(`/api/omdb?action=validate`, {
                headers: { 'x-omdb-key': key },
            });
            const data = await res.json();
            setKeyStatus(data.valid ? 'valid' : 'invalid');
        } catch {
            setKeyStatus('invalid');
        }
    };

    const saveKey = () => {
        if (omdbKey.trim()) {
            localStorage.setItem(OMDB_KEY_STORAGE_KEY, omdbKey.trim());
            setSavedKey(omdbKey.trim());
            testKey(omdbKey.trim());
            window.dispatchEvent(new Event('omdb-key-change'));
        }
    };

    const removeKey = () => {
        localStorage.removeItem(OMDB_KEY_STORAGE_KEY);
        setSavedKey(null);
        setOmdbKey('');
        setKeyStatus('idle');
        if (ratingSource === 'imdb') {
            setRatingSource('tvmaze');
        }
        window.dispatchEvent(new Event('omdb-key-change'));
    };

    const setRatingSource = (source: RatingSource) => {
        setRatingSourceState(source);
        localStorage.setItem(RATING_SOURCE_STORAGE_KEY, source);
        window.dispatchEvent(new CustomEvent('rating-source-change', { detail: source }));
    };

    const canUseImdb = savedKey && keyStatus === 'valid';

    // Heatmap preferences
    const [heatmapColor, setHeatmapColor] = useState<HeatmapColorScale>('classic');
    const [heatmapScale, setHeatmapScale] = useState<HeatmapScaleMode>('absolute');

    const updateHeatmapColor = (v: HeatmapColorScale) => {
        setHeatmapColor(v);
        localStorage.setItem('HEATMAP_COLOR_SCALE', v);
    };
    const updateHeatmapScale = (v: HeatmapScaleMode) => {
        setHeatmapScale(v);
        localStorage.setItem('HEATMAP_SCALE_MODE', v);
    };

    return (
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
            <h1 className="text-2xl font-bold mb-8">{t('title')}</h1>

            {/* Theme */}
            <section className="mb-8">
                <h2 className="text-lg font-semibold mb-4">{t('theme')}</h2>
                <div className="flex gap-3">
                    <Button
                        variant={theme === 'dark' ? 'default' : 'outline'}
                        onClick={() => setTheme('dark')}
                        className="gap-2"
                    >
                        <Moon className="h-4 w-4" />
                        {t('dark')}
                    </Button>
                    <Button
                        variant={theme === 'light' ? 'default' : 'outline'}
                        onClick={() => setTheme('light')}
                        className="gap-2"
                    >
                        <Sun className="h-4 w-4" />
                        {t('light')}
                    </Button>
                </div>
            </section>

            <Separator className="mb-8" />

            {/* Heatmap Preferences */}
            <section className="mb-8">
                <h2 className="text-lg font-semibold mb-2">{t('heatmapPreferences')}</h2>
                <p className="text-sm text-muted-foreground mb-4">{t('heatmapPreferencesDescription')}</p>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-2 block">{t('heatmapColorScale')}</label>
                        <div className="flex gap-3">
                            <Button
                                variant={heatmapColor === 'classic' ? 'default' : 'outline'}
                                onClick={() => updateHeatmapColor('classic')}
                                size="sm"
                            >
                                Classic
                            </Button>
                            <Button
                                variant={heatmapColor === 'default' ? 'default' : 'outline'}
                                onClick={() => updateHeatmapColor('default')}
                                size="sm"
                            >
                                Default
                            </Button>
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-2 block">{t('heatmapScaleMode')}</label>
                        <div className="flex gap-3">
                            <Button
                                variant={heatmapScale === 'absolute' ? 'default' : 'outline'}
                                onClick={() => updateHeatmapScale('absolute')}
                                size="sm"
                            >
                                {t('heatmapAbsolute')}
                            </Button>
                            <Button
                                variant={heatmapScale === 'relative' ? 'default' : 'outline'}
                                onClick={() => updateHeatmapScale('relative')}
                                size="sm"
                            >
                                {t('heatmapRelative')}
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            <Separator className="mb-8" />

            {/* Rating Source */}
            <section className="mb-8">
                <h2 className="text-lg font-semibold mb-2">{t('ratingSource')}</h2>
                <p className="text-sm text-muted-foreground mb-4">{t('ratingSourceDescription')}</p>
                <div className="flex gap-3">
                    <Button
                        variant={ratingSource === 'tvmaze' ? 'default' : 'outline'}
                        onClick={() => setRatingSource('tvmaze')}
                        className="gap-2"
                    >
                        {t('ratingSourceTvmaze')}
                    </Button>
                    <Button
                        variant={ratingSource === 'imdb' ? 'default' : 'outline'}
                        onClick={() => canUseImdb && setRatingSource('imdb')}
                        disabled={!canUseImdb}
                        className="gap-2"
                    >
                        {t('ratingSourceImdb')}
                    </Button>
                </div>
                {!canUseImdb && (
                    <p className="text-xs text-muted-foreground mt-2">
                        {t('ratingSourceImdbRequiresKey')}
                    </p>
                )}
            </section>

            <Separator className="mb-8" />

            {/* OMDb API Key */}
            <section>
                <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-lg font-semibold">{t('omdbTitle')}</h2>
                    {savedKey && keyStatus === 'valid' && (
                        <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700">
                            <Check className="h-3 w-3" />
                            {t('omdbActive')}
                        </Badge>
                    )}
                    {keyStatus === 'invalid' && (
                        <Badge variant="destructive" className="gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {t('omdbInvalid')}
                        </Badge>
                    )}
                    {!savedKey && keyStatus === 'idle' && (
                        <Badge variant="secondary" className="text-xs">{t('omdbInactive')}</Badge>
                    )}
                </div>

                <p className="text-sm text-muted-foreground mb-4">{t('omdbDescription')}</p>

                {/* Prominent CTA — always visible when no key saved */}
                {!savedKey && (
                    <a
                        href="https://www.omdbapi.com/apikey.aspx"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-lg border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 px-4 py-3 mb-4 transition-colors group"
                    >
                        <span className="text-2xl">🔑</span>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                                {t('omdbGetKey')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {t('omdbGetKeySubtitle')}
                            </p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                    </a>
                )}

                {/* Key input */}
                <div className="flex gap-2 mb-4">
                    <Input
                        type="text"
                        value={omdbKey}
                        onChange={(e) => setOmdbKey(e.target.value)}
                        placeholder={t('omdbKeyPlaceholder')}
                        className="font-mono text-sm"
                    />
                    <Button onClick={saveKey} disabled={!omdbKey.trim() || keyStatus === 'testing'}>
                        {keyStatus === 'testing' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            t('omdbSave')
                        )}
                    </Button>
                    <Button variant="outline" onClick={() => testKey(omdbKey.trim())} disabled={!omdbKey.trim() || keyStatus === 'testing'}>
                        {t('omdbTest')}
                    </Button>
                </div>

                {savedKey && (
                    <Button variant="ghost" size="sm" className="mb-4 text-destructive hover:text-destructive" onClick={removeKey}>
                        <X className="h-4 w-4 mr-1" />
                        {t('omdbRemove')}
                    </Button>
                )}

                {/* Step-by-step accordion */}
                <Accordion type="single" collapsible className="rounded-lg border border-border">
                    <AccordionItem value="how-to" className="border-none">
                        <AccordionTrigger className="px-4 hover:no-underline">
                            <span className="text-sm font-medium">{t('omdbHowToTitle')}</span>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                            <ol className="space-y-3 text-sm">
                                {(['omdbStep1', 'omdbStep2', 'omdbStep3', 'omdbStep4', 'omdbStep5', 'omdbStep6'] as const).map((stepKey, i) => (
                                    <li key={stepKey} className="flex items-start gap-3">
                                        <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-semibold">{i + 1}</span>
                                        <div>
                                            <div>{t(stepKey)}</div>
                                            {i === 0 && (
                                                <a
                                                    href="https://www.omdbapi.com/apikey.aspx"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-primary hover:underline mt-0.5"
                                                >
                                                    omdbapi.com/apikey.aspx
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </section>
        </div>
    );
}
