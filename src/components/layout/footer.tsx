'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState, useRef } from 'react';
import { Settings, AlertTriangle } from 'lucide-react';
import { RATING_SOURCE_STORAGE_KEY, OMDB_KEY_STORAGE_KEY, DEFAULT_RATING_SOURCE } from '@/lib/constants';
import type { RatingSource } from '@/lib/constants';

export function Footer() {
    const locale = useLocale();
    const t = useTranslations('app');
    const tF = useTranslations('footer');

    const [ratingSource, setRatingSource] = useState<RatingSource>(DEFAULT_RATING_SOURCE);
    const [hasOmdbKey, setHasOmdbKey] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const tooltipTimeout = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem(RATING_SOURCE_STORAGE_KEY) as RatingSource | null;
        if (stored) setRatingSource(stored);
        setHasOmdbKey(!!localStorage.getItem(OMDB_KEY_STORAGE_KEY));

        const handler = (e: Event) => {
            const detail = (e as CustomEvent).detail as RatingSource;
            setRatingSource(detail);
        };
        const keyHandler = () => {
            setHasOmdbKey(!!localStorage.getItem(OMDB_KEY_STORAGE_KEY));
        };
        window.addEventListener('rating-source-change', handler);
        window.addEventListener('omdb-key-change', keyHandler);
        return () => {
            window.removeEventListener('rating-source-change', handler);
            window.removeEventListener('omdb-key-change', keyHandler);
        };
    }, []);

    const toggleSource = () => {
        const newSource: RatingSource = ratingSource === 'tvmaze' ? 'imdb' : 'tvmaze';
        if (newSource === 'imdb' && !hasOmdbKey) {
            // Show tooltip warning
            setShowTooltip(true);
            if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current);
            tooltipTimeout.current = setTimeout(() => setShowTooltip(false), 4000);
            return;
        }
        setRatingSource(newSource);
        localStorage.setItem(RATING_SOURCE_STORAGE_KEY, newSource);
        window.dispatchEvent(new CustomEvent('rating-source-change', { detail: newSource }));
    };

    return (
        <footer className="border-t border-border/50 bg-background/50">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
                    <div>{t('title')} — v0.2.0</div>

                    <div className="flex items-center gap-4 flex-wrap justify-center">
                        <span>
                            Data by{' '}
                            <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">
                                TMDB
                            </a>
                        </span>
                        <span>·</span>

                        {/* Rating source indicator */}
                        <span className="flex items-center gap-1.5">
                            {tF('ratingSource')}{' '}
                            {ratingSource === 'tvmaze' ? (
                                <a href="https://www.tvmaze.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors font-medium">
                                    TVMaze
                                </a>
                            ) : (
                                <span className="font-medium">IMDb <span className="text-muted-foreground/60">(via OMDb)</span></span>
                            )}
                        </span>

                        {/* Toggle button — always visible */}
                        <span>·</span>
                        <div className="relative">
                            <button
                                onClick={toggleSource}
                                className="underline hover:text-foreground transition-colors"
                            >
                                {ratingSource === 'tvmaze' ? tF('switchToImdb') : tF('switchToTvmaze')}
                            </button>

                            {/* Tooltip for missing OMDb key */}
                            {showTooltip && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 rounded-lg bg-popover border border-border shadow-lg p-3 z-50 animate-in fade-in slide-in-from-bottom-1">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-popover-foreground font-medium">{tF('noOmdbKeyTitle')}</p>
                                            <p className="text-[10px] text-muted-foreground mt-1">{tF('noOmdbKeyMessage')}</p>
                                            <Link
                                                href={`/${locale}/settings`}
                                                className="text-[10px] text-primary underline mt-1 inline-block"
                                                onClick={() => setShowTooltip(false)}
                                            >
                                                {tF('goToSettings')}
                                            </Link>
                                        </div>
                                    </div>
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-border" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
