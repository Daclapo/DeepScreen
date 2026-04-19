'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Star } from 'lucide-react';
import { buildMoviePath, buildSeriesPath } from '@/lib/slug';

interface DenseMediaRowProps {
    rank: number;
    id: number;
    title: string;
    mediaType: 'movie' | 'tv';
    year?: string;
    rating?: number;
    voteCount?: number;
}

export function DenseMediaRow({ rank, id, title, mediaType, year, rating, voteCount }: DenseMediaRowProps) {
    const locale = useLocale();
    const t = useTranslations('discover');
    const href = mediaType === 'movie' ? buildMoviePath(locale, id, title) : buildSeriesPath(locale, id, title);

    return (
        <Link
            href={href}
            className="grid grid-cols-[2.75rem_minmax(0,1fr)_4.5rem] items-center gap-2 px-2 py-1.5 transition-colors hover:bg-accent/40"
        >
            <span className="text-[11px] tabular-nums text-muted-foreground">#{rank}</span>

            <div className="min-w-0">
                <p className="truncate text-sm font-medium leading-tight">{title}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                    {year || '-'}
                    <span className="mx-1">·</span>
                    {voteCount ? `${voteCount.toLocaleString()} ${t('votes')}` : '—'}
                </p>
            </div>

            <div className="flex items-center justify-end gap-1 text-[11px] tabular-nums text-muted-foreground">
                {rating && rating > 0 ? (
                    <>
                        <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                        <span className="font-semibold text-foreground">{rating.toFixed(1)}</span>
                    </>
                ) : (
                    <span>—</span>
                )}
            </div>
        </Link>
    );
}
