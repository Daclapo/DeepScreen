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
    };

    const setRatingSource = (source: RatingSource) => {
        setRatingSourceState(source);
        localStorage.setItem(RATING_SOURCE_STORAGE_KEY, source);
        // Dispatch event so other components can react
        window.dispatchEvent(new CustomEvent('rating-source-change', { detail: source }));
    };

    const canUseImdb = savedKey && keyStatus === 'valid';

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
                                <li className="flex items-start gap-3">
                                    <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-semibold">1</span>
                                    <div>
                                        <div>{t('omdbStep1')}</div>
                                        <a
                                            href="https://www.omdbapi.com/apikey.aspx"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-primary hover:underline mt-0.5"
                                        >
                                            omdbapi.com/apikey.aspx
                                            <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-semibold">2</span>
                                    <div>{t('omdbStep2')}</div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-semibold">3</span>
                                    <div>{t('omdbStep3')}</div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-semibold">4</span>
                                    <div>{t('omdbStep4')}</div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-semibold">5</span>
                                    <div>{t('omdbStep5')}</div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-semibold">6</span>
                                    <div>{t('omdbStep6')}</div>
                                </li>
                            </ol>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </section>
        </div>
    );
}
