'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Settings } from 'lucide-react';
import { RATING_SOURCE_STORAGE_KEY, OMDB_KEY_STORAGE_KEY, DEFAULT_RATING_SOURCE } from '@/lib/constants';
import type { RatingSource } from '@/lib/constants';

export function Footer() {
    const locale = useLocale();
    const t = useTranslations('app');
    const tF = useTranslations('footer');

    const [ratingSource, setRatingSource] = useState<RatingSource>(DEFAULT_RATING_SOURCE);
    const [hasOmdbKey, setHasOmdbKey] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem(RATING_SOURCE_STORAGE_KEY) as RatingSource | null;
        if (stored) setRatingSource(stored);
        setHasOmdbKey(!!localStorage.getItem(OMDB_KEY_STORAGE_KEY));

        const handler = (e: Event) => {
            const detail = (e as CustomEvent).detail as RatingSource;
            setRatingSource(detail);
        };
        window.addEventListener('rating-source-change', handler);
        return () => window.removeEventListener('rating-source-change', handler);
    }, []);

    const toggleSource = () => {
        const newSource: RatingSource = ratingSource === 'tvmaze' ? 'imdb' : 'tvmaze';
        if (newSource === 'imdb' && !hasOmdbKey) return;
        setRatingSource(newSource);
        localStorage.setItem(RATING_SOURCE_STORAGE_KEY, newSource);
        window.dispatchEvent(new CustomEvent('rating-source-change', { detail: newSource }));
    };

    return (
        <footer className="border-t border-border/50 bg-background/50">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
                    <div>{t('title')} — v0.1.0</div>

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

                        {/* Quick toggle / configure */}
                        {ratingSource === 'tvmaze' && hasOmdbKey && (
                            <>
                                <span>·</span>
                                <button onClick={toggleSource} className="underline hover:text-foreground transition-colors">
                                    {tF('switchToImdb')}
                                </button>
                            </>
                        )}
                        {ratingSource === 'imdb' && (
                            <>
                                <span>·</span>
                                <button onClick={toggleSource} className="underline hover:text-foreground transition-colors">
                                    {tF('switchToTvmaze')}
                                </button>
                            </>
                        )}
                        {ratingSource === 'tvmaze' && !hasOmdbKey && (
                            <>
                                <span>·</span>
                                <Link
                                    href={`/${locale}/settings`}
                                    className="inline-flex items-center gap-1 underline hover:text-foreground transition-colors"
                                >
                                    <Settings className="h-3 w-3" />
                                    {tF('configureImdb')}
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </footer>
    );
}
