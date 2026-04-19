'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useState, useMemo } from 'react';
import { Calendar, MapPin, Star, Film, Maximize2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageLightbox } from '@/components/ui/image-lightbox';
import { TMDB_IMAGE_BASE, TMDB_PROFILE_SIZES, TMDB_POSTER_SIZES, MOVIE_GENRES, TV_GENRES } from '@/lib/constants';
import { useTheme } from '@/components/layout/theme-provider';
import { buildMoviePath, buildSeriesPath } from '@/lib/slug';
import type { TMDBPersonDetail, TMDBPersonCombinedCredits } from '@/types';

interface Props {
    person: TMDBPersonDetail;
    credits: TMDBPersonCombinedCredits;
}

// Unified credit with merged roles
interface UnifiedCredit {
    id: number;
    media_type: 'movie' | 'tv';
    title: string;
    poster_path: string | null;
    release_date: string;
    vote_average: number;
    vote_count: number;
    genre_ids: number[];
    roles: string[]; // e.g. ["Actor (Walter White)", "Producer"]
    departments: string[]; // e.g. ["Acting", "Production"]
    popularity: number;
}

export function PersonDetailClient({ person, credits }: Props) {
    const locale = useLocale();
    const t = useTranslations('person');
    const { theme } = useTheme();
    const [roleFilter, setRoleFilter] = useState<'all' | 'acting' | 'directing' | 'producing'>('all');
    const [mediaFilter, setMediaFilter] = useState<'all' | 'movie' | 'tv'>('all');
    const [sortBy, setSortBy] = useState<'relevance' | 'rating' | 'date' | 'title'>('rating');
    const [showLightbox, setShowLightbox] = useState(false);

    const profileUrl = person.profile_path
        ? `${TMDB_IMAGE_BASE}/${TMDB_PROFILE_SIZES.original}${person.profile_path}`
        : null;

    const age = useMemo(() => {
        if (!person.birthday) return null;
        const birth = new Date(person.birthday);
        const end = person.deathday ? new Date(person.deathday) : new Date();
        let diff = end.getFullYear() - birth.getFullYear();
        const m = end.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && end.getDate() < birth.getDate())) diff--;
        return diff;
    }, [person.birthday, person.deathday]);

    // Build unified credits map: merge cast+crew by media_type-id
    const unifiedMap = useMemo(() => {
        const map = new Map<string, UnifiedCredit>();

        for (const c of credits.cast) {
            const key = `${c.media_type}-${c.id}`;
            const existing = map.get(key);
            const roleLabel = c.character ? `${c.character}` : 'Actor';
            if (existing) {
                if (!existing.roles.includes(roleLabel)) existing.roles.push(roleLabel);
                if (!existing.departments.includes('Acting')) existing.departments.push('Acting');
            } else {
                map.set(key, {
                    id: c.id,
                    media_type: c.media_type,
                    title: c.title || c.name || '',
                    poster_path: c.poster_path,
                    release_date: c.release_date || c.first_air_date || '',
                    vote_average: c.vote_average,
                    vote_count: c.vote_count || 0,
                    genre_ids: c.genre_ids || [],
                    roles: [roleLabel],
                    departments: ['Acting'],
                    popularity: c.popularity,
                });
            }
        }

        for (const c of credits.crew) {
            const key = `${c.media_type}-${c.id}`;
            const existing = map.get(key);
            const roleLabel = c.job;
            if (existing) {
                if (!existing.roles.includes(roleLabel)) existing.roles.push(roleLabel);
                if (!existing.departments.includes(c.department)) existing.departments.push(c.department);
            } else {
                map.set(key, {
                    id: c.id,
                    media_type: c.media_type,
                    title: c.title || c.name || '',
                    poster_path: c.poster_path,
                    release_date: c.release_date || c.first_air_date || '',
                    vote_average: c.vote_average,
                    vote_count: c.vote_count || 0,
                    genre_ids: c.genre_ids || [],
                    roles: [roleLabel],
                    departments: [c.department],
                    popularity: c.popularity,
                });
            }
        }

        return map;
    }, [credits]);

    const allUnified = useMemo(() =>
        Array.from(unifiedMap.values()).sort((a, b) => b.release_date.localeCompare(a.release_date)),
        [unifiedMap]
    );

    // Role counts (unique titles per department)
    const actingCount = useMemo(() => allUnified.filter(c => c.departments.includes('Acting')).length, [allUnified]);
    const directingCount = useMemo(() => allUnified.filter(c => c.roles.includes('Director')).length, [allUnified]);
    const producingCount = useMemo(() => allUnified.filter(c => c.departments.includes('Production')).length, [allUnified]);
    const totalCredits = allUnified.length;

    // Stats
    const allDates = allUnified.map(c => c.release_date).filter(Boolean).sort();
    const firstYear = allDates[0]?.slice(0, 4);
    const lastYear = allDates[allDates.length - 1]?.slice(0, 4);

    // Genre distribution
    const genreCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        const genreMap = { ...MOVIE_GENRES, ...TV_GENRES };
        allUnified.forEach(c => {
            (c.genre_ids || []).forEach(id => {
                const name = genreMap[id]?.[locale as 'en' | 'es'] || `Genre ${id}`;
                counts[name] = (counts[name] || 0) + 1;
            });
        });
        return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
    }, [allUnified, locale]);

    // Films per year
    const filmsPerYear = useMemo(() => {
        const counts: Record<string, number> = {};
        allUnified.filter(c => c.departments.includes('Acting')).forEach(c => {
            const year = c.release_date?.slice(0, 4);
            if (year) counts[year] = (counts[year] || 0) + 1;
        });
        return Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0]));
    }, [allUnified]);

    // Filtered filmography
    const filteredFilmography = useMemo(() => {
        const TALK_OR_NEWS_GENRES = new Set([10763, 10767]);
        const titleBlacklist = new Set([
            'the tonight show starring jimmy fallon',
            'late night with seth meyers',
            'the late show with stephen colbert',
            'conan',
            'saturday night live',
            'the graham norton show',
            'golden globe awards',
            'jimmy kimmel live!',
            'the oscars',
            'the daily show',
            'nova',
            'late show with david letterman',
            'the tonight show with jay leno',
            "late night with conan o'brien",
            'the mike douglas show',
            'live with kelly and mark',
            'the ellen degeneres show',
            'cbs news sunday morning',
            'today',
            'omnibus',
            'entertainment tonight',
            'the kelly clarkson show',
            'variety studio: actors on actors',
            'quotidien',
            'hot ones',
            'access hollywood',
            'the late late show with craig ferguson',
            'real time with bill maher',
            'premios mtv vídeos musicales',
            'premios mtv videos musicales',
            'the late late show with james corden',
            'the one show',
            'studio 42 with bob costas',
            'el hormiguero',
            '60 minutes',
        ]);

        let result = allUnified.filter((credit) => {
            const title = credit.title.toLowerCase().trim();
            const hasTalkNewsGenre = credit.media_type === 'tv' && credit.genre_ids.some((id) => TALK_OR_NEWS_GENRES.has(id));
            const inBlacklist = titleBlacklist.has(title);
            return !hasTalkNewsGenre && !inBlacklist;
        });

        if (roleFilter === 'acting') result = result.filter(c => c.departments.includes('Acting'));
        else if (roleFilter === 'directing') result = result.filter(c => c.roles.includes('Director'));
        else if (roleFilter === 'producing') result = result.filter(c => c.departments.includes('Production'));

        if (mediaFilter !== 'all') {
            result = result.filter(c => c.media_type === mediaFilter);
        }

        return result.sort((a, b) => {
            if (sortBy === 'relevance') return b.popularity - a.popularity;
            if (sortBy === 'rating') {
                const aHasMinVotes = a.vote_count >= 10;
                const bHasMinVotes = b.vote_count >= 10;

                if (aHasMinVotes !== bHasMinVotes) {
                    return aHasMinVotes ? -1 : 1;
                }

                if (b.vote_average !== a.vote_average) {
                    return b.vote_average - a.vote_average;
                }

                if (b.popularity !== a.popularity) {
                    return b.popularity - a.popularity;
                }

                return b.release_date.localeCompare(a.release_date);
            }
            if (sortBy === 'title') return a.title.localeCompare(b.title);
            // Default to date
            return b.release_date.localeCompare(a.release_date);
        });
    }, [roleFilter, mediaFilter, sortBy, allUnified]);

    const maxBarValue = Math.max(...filmsPerYear.map(([, c]) => c), 1);

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-8 mb-10">
                <div className="flex-shrink-0 w-48 sm:w-56">
                    <button
                        type="button"
                        onClick={() => profileUrl && setShowLightbox(true)}
                        className="group relative aspect-[2/3] w-full rounded-xl overflow-hidden border border-border/30 shadow-lg cursor-zoom-in"
                    >
                        {profileUrl ? (
                            <>
                                <Image src={profileUrl} alt={person.name} fill sizes="250px" className="object-cover" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                    <Maximize2 className="h-6 w-6 text-white opacity-0 group-hover:opacity-80 transition-opacity" />
                                </div>
                            </>
                        ) : (
                            <div
                                className="absolute inset-0 flex items-center justify-center"
                                style={{ backgroundColor: theme === 'dark' ? 'rgb(21, 27, 33)' : 'rgb(233, 235, 238)' }}
                            >
                                <Image
                                    src={theme === 'dark' ? '/images/actor-placeholder-dark.png' : '/images/actor-placeholder-light.png'}
                                    alt=""
                                    fill
                                    sizes="250px"
                                    className="object-contain p-4"
                                />
                            </div>
                        )}
                    </button>
                </div>

                <div className="flex-1">
                    <h1 className="text-3xl sm:text-4xl font-bold mb-2">{person.name}</h1>
                    <Badge variant="secondary" className="mb-4 text-xs">{person.known_for_department}</Badge>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                        {person.birthday && (
                            <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>{person.birthday}{age !== null && ` (${age} ${t('age').toLowerCase()})`}</span>
                            </div>
                        )}
                        {person.deathday && (
                            <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>{t('deathday')}: {person.deathday}</span>
                            </div>
                        )}
                        {person.place_of_birth && (
                            <div className="flex items-center gap-2 text-sm">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span>{person.place_of_birth}</span>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <StatCard icon={<Film className="h-4 w-4" />} label={t('totalCredits')} value={String(totalCredits)} />
                        <StatCard icon={<Star className="h-4 w-4" />} label={t('actingCredits')} value={String(actingCount)} />
                        {firstYear && <StatCard icon={<Calendar className="h-4 w-4" />} label={t('firstCredit')} value={firstYear} />}
                        {lastYear && <StatCard icon={<Calendar className="h-4 w-4" />} label={t('latestCredit')} value={lastYear} />}
                    </div>
                </div>
            </div>

            <Tabs defaultValue="filmography">
                <TabsList>
                    <TabsTrigger value="filmography">{t('filmography')}</TabsTrigger>
                    <TabsTrigger value="stats">{t('careerStats')}</TabsTrigger>
                    <TabsTrigger value="bio">{t('biography')}</TabsTrigger>
                </TabsList>

                {/* Filmography */}
                <TabsContent value="filmography" className="mt-6">
                    <div className="flex flex-col md:flex-row justify-between gap-4 mb-6 bg-muted/30 p-4 rounded-xl border border-border/50">
                        <div className="flex gap-2 flex-wrap items-center">
                            {(['all', 'acting', 'directing', 'producing'] as const).map(f => (
                                <Badge
                                    key={f}
                                    variant={roleFilter === f ? 'default' : 'outline'}
                                    className="cursor-pointer"
                                    onClick={() => setRoleFilter(f)}
                                >
                                    {f === 'all' ? t('allRoles') : f === 'acting' ? t('actingCredits') : f === 'directing' ? t('directingCredits') : t('producingCredits')}
                                    <span className="ml-1 opacity-60">
                                        ({f === 'all' ? totalCredits : f === 'acting' ? actingCount : f === 'directing' ? directingCount : producingCount})
                                    </span>
                                </Badge>
                            ))}
                        </div>
                        <div className="flex items-center gap-3">
                            <Select value={mediaFilter} onValueChange={(v) => setMediaFilter(v as 'all' | 'movie' | 'tv')}>
                                <SelectTrigger className="w-[140px] h-8 text-xs bg-background">
                                    <SelectValue placeholder={t('mediaType')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all" className="text-xs">{t('allMedia')}</SelectItem>
                                    <SelectItem value="movie" className="text-xs">{t('moviesOnly')}</SelectItem>
                                    <SelectItem value="tv" className="text-xs">{t('tvOnly')}</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'relevance' | 'rating' | 'date' | 'title')}>
                                <SelectTrigger className="w-[140px] h-8 text-xs bg-background">
                                    <SelectValue placeholder={t('sortBy')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="relevance" className="text-xs">{t('sortRelevance')}</SelectItem>
                                    <SelectItem value="date" className="text-xs">{t('sortDate')}</SelectItem>
                                    <SelectItem value="rating" className="text-xs">{t('sortRating')}</SelectItem>
                                    <SelectItem value="title" className="text-xs">{t('sortTitle')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {filteredFilmography.slice(0, 60).map((c) => (
                            <Link
                                key={`${c.media_type}-${c.id}`}
                                href={c.media_type === 'movie' ? buildMoviePath(locale, c.id, c.title) : buildSeriesPath(locale, c.id, c.title)}
                                className="group"
                            >
                                <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-2 border border-border/30 bg-muted">
                                    {c.poster_path ? (
                                        <Image
                                            src={`${TMDB_IMAGE_BASE}/${TMDB_POSTER_SIZES.medium}${c.poster_path}`}
                                            alt={c.title}
                                            fill
                                            sizes="150px"
                                            className="object-cover group-hover:scale-105 transition-transform"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center bg-muted">
                                            <Film className="h-8 w-8 text-muted-foreground/40" />
                                        </div>
                                    )}
                                    {c.vote_average > 0 && (
                                        <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 rounded bg-background/80 backdrop-blur-sm px-1 py-0.5 text-[10px] font-medium">
                                            <Star className="h-2.5 w-2.5 fill-yellow-500 text-yellow-500" />
                                            {c.vote_average.toFixed(1)}
                                        </div>
                                    )}
                                    <Badge variant="secondary" className="absolute top-1.5 left-1.5 text-[9px] px-1 py-0 bg-background/80 backdrop-blur-sm">
                                        {c.media_type === 'movie' ? 'Movie' : 'TV'}
                                    </Badge>
                                </div>
                                <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">{c.title}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{c.roles.join(' · ')}</p>
                                {c.release_date && <p className="text-[10px] text-muted-foreground">{c.release_date.slice(0, 4)}</p>}
                            </Link>
                        ))}
                    </div>
                </TabsContent>

                {/* Career Stats */}
                <TabsContent value="stats" className="mt-6 space-y-8">
                    {genreCounts.length > 0 && (
                        <section>
                            <h3 className="text-lg font-semibold mb-4">{t('topGenres')}</h3>
                            <div className="space-y-2">
                                {genreCounts.map(([genre, count]) => (
                                    <div key={genre} className="flex items-center gap-3">
                                        <span className="text-sm w-32 truncate">{genre}</span>
                                        <div className="flex-1 h-6 rounded-full bg-muted overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-primary/60 transition-all"
                                                style={{ width: `${(count / genreCounts[0][1]) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {filmsPerYear.length > 0 && (
                        <section>
                            <h3 className="text-lg font-semibold mb-4">{t('filmsPerYear')}</h3>
                            <div className="flex items-end gap-px h-40 overflow-x-auto pb-6">
                                {filmsPerYear.map(([year, count]) => (
                                    <div key={year} className="flex flex-col items-center gap-1 min-w-[28px]">
                                        <span className="text-[9px] text-muted-foreground">{count}</span>
                                        <div
                                            className="w-5 rounded-t bg-primary/70 transition-all hover:bg-primary"
                                            style={{ height: `${(count / maxBarValue) * 100}%`, minHeight: '4px' }}
                                        />
                                        <span className="text-[8px] text-muted-foreground -rotate-45 origin-left whitespace-nowrap">{year}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </TabsContent>

                {/* Biography */}
                <TabsContent value="bio" className="mt-6">
                    {person.biography ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                            {person.biography.split('\n\n').map((para, i) => (
                                <p key={i} className="text-muted-foreground leading-relaxed mb-4">{para}</p>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-12">{t('noBiography')}</p>
                    )}
                </TabsContent>
            </Tabs>

            <ImageLightbox
                open={showLightbox}
                src={profileUrl}
                alt={person.name}
                onClose={() => setShowLightbox(false)}
            />
        </div>
    );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="rounded-lg border border-border p-3 bg-card flex items-center gap-3">
            <div className="text-primary">{icon}</div>
            <div>
                <p className="text-[10px] text-muted-foreground">{label}</p>
                <p className="text-sm font-bold">{value}</p>
            </div>
        </div>
    );
}
