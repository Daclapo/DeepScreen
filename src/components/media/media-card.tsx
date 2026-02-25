'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Star, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TMDB_IMAGE_BASE, TMDB_POSTER_SIZES } from '@/lib/constants';

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

export function MediaCard({ id, title, posterPath, mediaType, year, rating, releaseDate, showMediaType = true, className = '' }: MediaCardProps) {
    const locale = useLocale();
    const t = useTranslations('media');
    const href = mediaType === 'movie' ? `/${locale}/movie/${id}` : `/${locale}/series/${id}`;
    const posterUrl = posterPath
        ? `${TMDB_IMAGE_BASE}/${TMDB_POSTER_SIZES.medium}${posterPath}`
        : null;

    const upcoming = isUpcoming(releaseDate);

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
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                        No Image
                    </div>
                )}

                {/* Rating or Upcoming badge */}
                {upcoming ? (
                    <div className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-amber-500/90 backdrop-blur-sm px-1.5 py-0.5 text-xs font-medium text-black">
                        <Clock className="h-3 w-3" />
                        <span>{t('upcoming')}</span>
                    </div>
                ) : rating !== undefined && rating > 0 ? (
                    <div className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-background/80 backdrop-blur-sm px-1.5 py-0.5 text-xs font-medium">
                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                        <span>{rating.toFixed(1)}</span>
                    </div>
                ) : null}

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
                {year && (
                    <span className="text-xs text-muted-foreground">{year}</span>
                )}
            </div>
        </Link>
    );
}
