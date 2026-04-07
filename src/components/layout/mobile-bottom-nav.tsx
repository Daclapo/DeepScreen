'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Compass, Home, Scale, CalendarClock } from 'lucide-react';

const navConfig = [
    { key: 'home', icon: Home, path: '' },
    { key: 'discover', icon: Compass, path: 'discover' },
    { key: 'upcoming', icon: CalendarClock, path: 'upcoming' },
    { key: 'compare', icon: Scale, path: 'compare' },
] as const;

export function MobileBottomNav() {
    const locale = useLocale();
    const pathname = usePathname();
    const t = useTranslations('nav');

    return (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur-xl md:hidden">
            <div className="mx-auto grid h-16 max-w-7xl grid-cols-4 px-2">
                {navConfig.map((item) => {
                    const href = item.path ? `/${locale}/${item.path}` : `/${locale}`;
                    const isActive = pathname === href || (item.path !== '' && pathname.startsWith(href));
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.key}
                            href={href}
                            className="flex flex-col items-center justify-center gap-1 rounded-md px-1 transition-colors"
                        >
                            <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                            <span className={`text-[10px] leading-none ${isActive ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                                {t(item.key)}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
