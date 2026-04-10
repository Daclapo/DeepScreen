'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Star, Film, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TMDB_IMAGE_BASE, TMDB_POSTER_SIZES } from '@/lib/constants';
import { buildMoviePath, buildSeriesPath } from '@/lib/slug';

interface MediaCardProps {
    id: number;
    title: string;
    posterPath: string | null;
    mediaType: 'movie' | 'tv';
    year?: string;
    rating?: number;
    releaseDate?: string;
    showMediaType?: boolean;
    className?: string;
}

function isUpcoming(releaseDate?: string): boolean {
    if (!releaseDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const release = new Date(releaseDate);
    return release > today;
}

function getDaysUntil(releaseDate: string): number | null {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const release = new Date(releaseDate);
    release.setHours(0, 0, 0, 0);
    const diff = release.getTime() - today.getTime();
    if (diff < 0) return null;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function MediaCard({ id, title, posterPath, mediaType, year, rating, releaseDate, showMediaType = true, className = '' }: MediaCardProps) {
    const locale = useLocale();
    const t = useTranslations('media');
    const href = mediaType === 'movie' ? buildMoviePath(locale, id, title) : buildSeriesPath(locale, id, title);
    const posterUrl = posterPath
        ? `${TMDB_IMAGE_BASE}/${TMDB_POSTER_SIZES.medium}${posterPath}`
        : null;

    const upcoming = isUpcoming(releaseDate);
    const daysUntil = releaseDate ? getDaysUntil(releaseDate) : null;

    return (
        <Link
            href={href}
            className={`group relative flex flex-col rounded-lg overflow-hidden bg-card border border-border/50 transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 ${className}`}
        >
            {/* Poster */}
            <div className="relative aspect-[2/3] bg-muted overflow-hidden">
                {posterUrl ? (
                    <Image
                        src={posterUrl}
                        alt={title}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 200px"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted">
                        <Film className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                )}

                {/* Rating badge */}
                {rating !== undefined && rating > 0 && !upcoming && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-background/80 backdrop-blur-sm px-1.5 py-0.5 text-xs font-medium">
                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                        <span>{rating.toFixed(1)}</span>
                    </div>
                )}

                {/* Media type badge */}
                {showMediaType && (
                    <Badge
                        variant="secondary"
                        className="absolute top-2 left-2 text-[10px] px-1.5 py-0 bg-background/80 backdrop-blur-sm"
                    >
                        {mediaType === 'movie' ? t('movie') : t('series')}
                    </Badge>
                )}
            </div>

            {/* Info */}
            <div className="flex flex-col gap-1 p-3">
                <h3 className="text-sm font-medium leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                    {title}
                </h3>
                <div className="flex items-center gap-2">
                    {year && (
                        <span className="text-xs text-muted-foreground">{year}</span>
                    )}
                    {upcoming && daysUntil !== null && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                            {daysUntil === 0 ? (
                                <>
                                    <Calendar className="h-3 w-3" />
                                    <span>Today</span>
                                </>
                            ) : daysUntil === 1 ? (
                                'Tomorrow'
                            ) : (
                                `in ${daysUntil} days`
                            )}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}
