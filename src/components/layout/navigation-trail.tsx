'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronRight, Home, ArrowLeft } from 'lucide-react';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';

interface TrailItem {
    href: string;
    label: string;
}

const TRAIL_STORAGE_KEY = 'deepscreen_nav_trail';

function readTrail(): TrailItem[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = window.sessionStorage.getItem(TRAIL_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as TrailItem[];
        if (!Array.isArray(parsed)) return [];
        return parsed.filter((item) => typeof item?.href === 'string' && typeof item?.label === 'string');
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
    const locale = useLocale();
    const router = useRouter();
    const tNav = useTranslations('nav');
    const tCommon = useTranslations('common');
    const tMedia = useTranslations('media');
    const tPerson = useTranslations('person');

    const excludedPrefixes = useMemo(
        () => [`/${locale}`, `/${locale}/discover`, `/${locale}/upcoming`, `/${locale}/compare`],
        [locale]
    );

    const isExcluded = useMemo(() => {
        if (pathname === `/${locale}`) return true;
        return excludedPrefixes.slice(1).some((prefix) => pathname.startsWith(prefix));
    }, [excludedPrefixes, locale, pathname]);

    const currentItem = useMemo(() => {
        if (isExcluded) return null;

        const movieMatch = pathname.match(new RegExp(`^/${locale}/movie/(\\d+)$`));
        if (movieMatch) {
            return { href: pathname, label: `${tMedia('movie')} #${movieMatch[1]}` };
        }

        const seriesMatch = pathname.match(new RegExp(`^/${locale}/series/(\\d+)$`));
        if (seriesMatch) {
            return { href: pathname, label: `${tMedia('series')} #${seriesMatch[1]}` };
        }

        const personMatch = pathname.match(new RegExp(`^/${locale}/person/(\\d+)$`));
        if (personMatch) {
            return { href: pathname, label: `${tPerson('people')} #${personMatch[1]}` };
        }

        if (pathname.startsWith(`/${locale}/search`)) {
            return { href: pathname, label: tNav('search') };
        }

        if (pathname.startsWith(`/${locale}/settings`)) {
            return { href: pathname, label: tNav('settings') };
        }

        return { href: pathname, label: pathname.split('/').pop() || 'Page' };
    }, [isExcluded, locale, pathname, tMedia, tNav, tPerson]);

    const trail = useMemo(() => {
        if (!currentItem) return [];
        const currentTrail = readTrail();
        const withoutCurrent = currentTrail.filter((item) => item.href !== currentItem.href);
        const nextTrail = [...withoutCurrent, currentItem].slice(-5);
        writeTrail(nextTrail);
        return nextTrail;
    }, [currentItem]);

    if (isExcluded || !currentItem) {
        return null;
    }

    const visibleTrail = trail.length > 4 ? trail.slice(-4) : trail;

    return (
        <div className="mx-auto mt-3 mb-2 flex w-full max-w-7xl items-center gap-2 overflow-x-auto px-4 sm:px-6">
            <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => router.back()}>
                <ArrowLeft className="h-3.5 w-3.5" />
                {tCommon('back')}
            </Button>

            <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                <Link href={`/${locale}`} className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
                    <Home className="h-3.5 w-3.5" />
                    <span>{tNav('home')}</span>
                </Link>

                {visibleTrail.map((item, index) => {
                    const isCurrent = item.href === pathname;
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
