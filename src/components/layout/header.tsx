'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Search, Sun, Moon, Settings, Languages, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/layout/theme-provider';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { SEARCH_DEBOUNCE_MS } from '@/lib/constants';

interface SearchSuggestion {
    id: number;
    title: string;
    media_type: 'movie' | 'tv';
    year: string;
    poster_path: string | null;
}

export function Header() {
    const t = useTranslations('nav');
    const locale = useLocale();
    const pathname = usePathname();
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();

    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    const otherLocale = locale === 'en' ? 'es' : 'en';
    const localePath = pathname.replace(`/${locale}`, `/${otherLocale}`);

    // Cmd+K shortcut
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setSearchOpen(true);
                setTimeout(() => searchInputRef.current?.focus(), 50);
            }
            if (e.key === 'Escape') {
                setSearchOpen(false);
                setShowSuggestions(false);
            }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, []);

    // Click outside to close suggestions
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const fetchSuggestions = useCallback(async (query: string) => {
        if (query.length < 2) {
            setSuggestions([]);
            return;
        }
        try {
            const lang = locale === 'es' ? 'es-ES' : 'en-US';
            const res = await fetch(`/api/tmdb/search/multi?query=${encodeURIComponent(query)}&language=${lang}`);
            const data = await res.json();
            const filtered: SearchSuggestion[] = (data.results || [])
                .filter((r: { media_type: string }) => r.media_type === 'movie' || r.media_type === 'tv')
                .slice(0, 8)
                .map((r: { id: number; media_type: 'movie' | 'tv'; title?: string; name?: string; release_date?: string; first_air_date?: string; poster_path: string | null }) => ({
                    id: r.id,
                    title: r.media_type === 'movie' ? r.title : r.name,
                    media_type: r.media_type,
                    year: (r.media_type === 'movie' ? r.release_date : r.first_air_date)?.slice(0, 4) || '',
                    poster_path: r.poster_path,
                }));
            setSuggestions(filtered);
            setShowSuggestions(true);
            setSelectedIndex(-1);
        } catch {
            setSuggestions([]);
        }
    }, [locale]);

    const handleSearchInput = (value: string) => {
        setSearchQuery(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchSuggestions(value), SEARCH_DEBOUNCE_MS);
    };

    const handleSearchSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/${locale}/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setSearchOpen(false);
            setShowSuggestions(false);
        }
    };

    const handleSuggestionClick = (suggestion: SearchSuggestion) => {
        const route = suggestion.media_type === 'movie'
            ? `/${locale}/movie/${suggestion.id}`
            : `/${locale}/series/${suggestion.id}`;
        router.push(route);
        setSearchOpen(false);
        setShowSuggestions(false);
        setSearchQuery('');
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => Math.max(prev - 1, -1));
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault();
            handleSuggestionClick(suggestions[selectedIndex]);
        }
    };

    const navItems = [
        { href: `/${locale}`, label: t('home') },
        { href: `/${locale}/discover`, label: t('discover') },
        { href: `/${locale}/upcoming`, label: t('upcoming') },
        { href: `/${locale}/compare`, label: t('compare') },
    ];

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
            <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
                {/* Mobile menu */}
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 md:hidden" aria-label="Open navigation menu">
                            <Menu className="h-4 w-4" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[85vw] max-w-xs">
                        <SheetHeader className="px-0">
                            <SheetTitle>DeepScreen</SheetTitle>
                        </SheetHeader>
                        <nav className="mt-2 flex flex-col gap-1">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href || (item.href !== `/${locale}` && pathname.startsWith(item.href));
                                return (
                                    <SheetClose asChild key={`mobile-${item.href}`}>
                                        <Link
                                            href={item.href}
                                            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                                                ? 'text-primary bg-primary/10'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                                                }`}
                                        >
                                            {item.label}
                                        </Link>
                                    </SheetClose>
                                );
                            })}
                            <SheetClose asChild>
                                <Link
                                    href={`/${locale}/settings`}
                                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${pathname.startsWith(`/${locale}/settings`)
                                        ? 'text-primary bg-primary/10'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                                        }`}
                                >
                                    {t('settings')}
                                </Link>
                            </SheetClose>
                        </nav>
                    </SheetContent>
                </Sheet>

                {/* Logo */}
                <Link href={`/${locale}`} className="flex items-center gap-1.5 font-semibold text-foreground hover:text-primary transition-colors">
                    <Image
                        src={theme === 'dark' ? '/images/logo-dark.png' : '/images/logo-light.png'}
                        alt="DeepScreen"
                        width={40}
                        height={40}
                        className="flex-shrink-0"
                    />
                    <span className="text-lg tracking-tight leading-none">DeepScreen</span>
                </Link>

                {/* Nav links */}
                <nav className="hidden md:flex items-center gap-1 ml-6">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== `/${locale}` && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${isActive
                                    ? 'text-primary bg-primary/10'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                                    }`}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Search */}
                <div className="relative" ref={searchContainerRef}>
                    {searchOpen ? (
                        <form onSubmit={handleSearchSubmit} className="relative">
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => handleSearchInput(e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                                placeholder={t('searchPlaceholder')}
                                className="h-9 w-[min(16rem,calc(100vw-7rem))] sm:w-64 rounded-md border border-border bg-secondary/50 px-3 pr-8 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                                autoFocus
                            />
                            <Search className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                            {/* Suggestions dropdown */}
                            {showSuggestions && suggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-border bg-popover shadow-lg overflow-hidden z-50">
                                    {suggestions.map((s, i) => (
                                        <button
                                            key={`${s.media_type}-${s.id}`}
                                            type="button"
                                            onClick={() => handleSuggestionClick(s)}
                                            className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors ${i === selectedIndex ? 'bg-accent' : 'hover:bg-accent/50'
                                                }`}
                                        >
                                            {s.poster_path ? (
                                                <img
                                                    src={`https://image.tmdb.org/t/p/w92${s.poster_path}`}
                                                    alt=""
                                                    className="h-10 w-7 rounded object-cover"
                                                />
                                            ) : (
                                                <div className="h-10 w-7 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                                                    ?
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium truncate">{s.title}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {s.media_type === 'movie' ? 'Movie' : 'Series'}{s.year ? ` · ${s.year}` : ''}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </form>
                    ) : (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setSearchOpen(true);
                                        setTimeout(() => searchInputRef.current?.focus(), 50);
                                    }}
                                    className="gap-2 text-muted-foreground"
                                >
                                    <Search className="h-4 w-4" />
                                    <span className="hidden sm:inline text-sm">{t('search')}</span>
                                    <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                                        ⌘K
                                    </kbd>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t('search')} (⌘K)</TooltipContent>
                        </Tooltip>
                    )}
                </div>

                {/* Language toggle */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
                            <Link href={localePath}>
                                <Languages className="h-4 w-4" />
                                <span className="sr-only">{otherLocale.toUpperCase()}</span>
                            </Link>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {locale === 'en' ? 'Español' : 'English'}
                    </TooltipContent>
                </Tooltip>

                {/* Theme toggle */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleTheme}>
                            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                            <span className="sr-only">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                    </TooltipContent>
                </Tooltip>

                {/* Settings */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
                            <Link href={`/${locale}/settings`}>
                                <Settings className="h-4 w-4" />
                                <span className="sr-only">{t('settings')}</span>
                            </Link>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('settings')}</TooltipContent>
                </Tooltip>
            </div>
        </header>
    );
}
