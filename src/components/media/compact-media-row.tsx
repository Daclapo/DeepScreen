'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Star, Clock } from 'lucide-react';
import { TMDB_IMAGE_BASE, TMDB_POSTER_SIZES, MOVIE_GENRES, TV_GENRES } from '@/lib/constants';
import { buildMoviePath, buildSeriesPath } from '@/lib/slug';

interface CompactMediaRowProps {
    id: number;
    title: string;
    posterPath: string | null;
    mediaType: 'movie' | 'tv';
    year?: string;
    rating?: number;
    genres?: number[];
    releaseDate?: string;
    overview?: string;
}

function isUpcoming(releaseDate?: string): boolean {
    if (!releaseDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(releaseDate) > today;
}

export function CompactMediaRow({ id, title, posterPath, mediaType, year, rating, genres, releaseDate, overview }: CompactMediaRowProps) {
    const locale = useLocale();
    const t = useTranslations('media');

    const href = mediaType === 'movie' ? buildMoviePath(locale, id, title) : buildSeriesPath(locale, id, title);
    const posterUrl = posterPath ? `${TMDB_IMAGE_BASE}/${TMDB_POSTER_SIZES.small}${posterPath}` : null;
    const upcoming = isUpcoming(releaseDate);
    const genreMap = mediaType === 'movie' ? MOVIE_GENRES : TV_GENRES;
    const genreNames = (genres || []).slice(0, 3).map(id => genreMap[id]?.[locale as 'en' | 'es'] || '').filter(Boolean);

    return (
        <Link
            href={href}
            className="flex items-center gap-4 p-3 rounded-lg border border-border/50 bg-card hover:border-primary/30 hover:bg-accent/30 transition-all group"
        >
            <div className="relative h-16 w-11 rounded overflow-hidden flex-shrink-0 bg-muted">
                {posterUrl ? (
                    <Image src={posterUrl} alt="" fill sizes="44px" className="object-cover" />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-[8px]">?</div>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium truncate group-hover:text-primary transition-colors">{title}</h3>
                    {year && <span className="text-xs text-muted-foreground flex-shrink-0">{year}</span>}
                </div>
                {genreNames.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">{genreNames.join(' · ')}</p>
                )}
                {overview && (
                    <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-1">{overview}</p>
                )}
            </div>

            <div className="flex-shrink-0">
                {upcoming ? (
                    <span className="flex items-center gap-1 rounded-md bg-amber-500/90 px-2 py-1 text-xs font-medium text-black">
                        <Clock className="h-3 w-3" />
                        {t('upcoming')}
                    </span>
                ) : rating !== undefined && rating > 0 ? (
                    <span className="flex items-center gap-1 text-sm">
                        <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                        <span className="font-semibold">{rating.toFixed(1)}</span>
                    </span>
                ) : null}
            </div>
        </Link>
    );
}
