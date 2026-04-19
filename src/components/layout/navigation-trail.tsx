'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronRight, Home, ArrowLeft } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { deslugifyPathSegment, parseNumericId } from '@/lib/slug';

interface TrailItem {
    href: string;
    label: string;
}

const TRAIL_STORAGE_KEY = 'deepscreen_nav_trail';

function normalizeHref(href: string): string {
    if (!href) return '/';
    const normalized = href.replace(/\/+$/, '');
    return normalized === '' ? '/' : normalized;
}

function readTrail(): TrailItem[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = window.sessionStorage.getItem(TRAIL_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as TrailItem[];
        if (!Array.isArray(parsed)) return [];
        return parsed
            .filter((item) => typeof item?.href === 'string' && typeof item?.label === 'string')
            .map((item) => ({ href: normalizeHref(item.href), label: item.label }));
    } catch {
        return [];
    }
}

function writeTrail(items: TrailItem[]) {
    if (typeof window === 'undefined') return;
    window.sessionStorage.setItem(TRAIL_STORAGE_KEY, JSON.stringify(items.slice(-8)));
}

export function NavigationTrail() {
    const pathname = usePathname();
    const currentPath = useMemo(() => normalizeHref(pathname), [pathname]);
    const locale = useLocale();
    const router = useRouter();
    const tNav = useTranslations('nav');
    const tCommon = useTranslations('common');
    const tMedia = useTranslations('media');
    const tPerson = useTranslations('person');
    const [trail, setTrail] = useState<TrailItem[]>([]);

    const excludedPrefixes = useMemo(
        () => [`/${locale}`, `/${locale}/discover`, `/${locale}/upcoming`, `/${locale}/compare`],
        [locale]
    );

    const isExcluded = useMemo(() => {
        if (currentPath === `/${locale}`) return true;
        return excludedPrefixes.slice(1).some((prefix) => currentPath.startsWith(prefix));
    }, [currentPath, excludedPrefixes, locale]);

    const currentItem = useMemo(() => {
        if (isExcluded) return null;

        const movieMatch = currentPath.match(new RegExp(`^/${locale}/movie/([^/]+)$`));
        if (movieMatch) {
            const segment = movieMatch[1];
            const label = parseNumericId(segment) ? `${tMedia('movie')} #${segment}` : deslugifyPathSegment(segment);
            return { href: currentPath, label };
        }

        const seriesMatch = currentPath.match(new RegExp(`^/${locale}/series/([^/]+)$`));
        if (seriesMatch) {
            const segment = seriesMatch[1];
            const label = parseNumericId(segment) ? `${tMedia('series')} #${segment}` : deslugifyPathSegment(segment);
            return { href: currentPath, label };
        }

        const personMatch = currentPath.match(new RegExp(`^/${locale}/person/([^/]+)$`));
        if (personMatch) {
            const segment = personMatch[1];
            const label = parseNumericId(segment) ? `${tPerson('people')} #${segment}` : deslugifyPathSegment(segment);
            return { href: currentPath, label };
        }

        if (currentPath.startsWith(`/${locale}/search`)) {
            return { href: currentPath, label: tNav('search') };
        }

        if (currentPath.startsWith(`/${locale}/settings`)) {
            return { href: currentPath, label: tNav('settings') };
        }

        return { href: currentPath, label: currentPath.split('/').pop() || 'Page' };
    }, [currentPath, isExcluded, locale, tMedia, tNav, tPerson]);

    useEffect(() => {
        if (!currentItem) {
            setTrail([]);
            return;
        }

        const currentTrail = readTrail();
        const existingIndex = currentTrail.findIndex((item) => normalizeHref(item.href) === currentItem.href);
        const nextTrail = existingIndex >= 0
            ? currentTrail.slice(0, existingIndex + 1).map((item) => normalizeHref(item.href) === currentItem.href ? currentItem : item)
            : [...currentTrail, currentItem].slice(-5);

        writeTrail(nextTrail);
        setTrail(nextTrail);
    }, [currentItem]);

    if (isExcluded || !currentItem) {
        return null;
    }

    const renderTrail = trail.length > 0 ? trail : [currentItem];
    const visibleTrail = renderTrail.length > 4 ? renderTrail.slice(-4) : renderTrail;

    return (
        <div className="mx-auto mt-3 mb-2 flex w-full max-w-7xl items-center gap-2 overflow-x-auto px-4 sm:px-6">
            <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => router.back()}>
                <ArrowLeft className="h-3.5 w-3.5" />
                {tCommon('back')}
            </Button>

            <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                <Link href={`/${locale}`} className="inline-flex items-center hover:text-foreground transition-colors" aria-label={tNav('home')}>
                    <Home className="h-3.5 w-3.5" />
                </Link>

                {visibleTrail.map((item, index) => {
                    const isCurrent = normalizeHref(item.href) === currentPath;
                    return (
                        <div key={`${item.href}-${index}`} className="inline-flex items-center gap-1">
                            <ChevronRight className="h-3.5 w-3.5" />
                            {isCurrent ? (
                                <span className="text-foreground font-medium">{item.label}</span>
                            ) : (
                                <Link href={item.href} className="hover:text-foreground transition-colors">
                                    {item.label}
                                </Link>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
