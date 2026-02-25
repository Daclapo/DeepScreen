'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useState, useMemo } from 'react';
import { Calendar, MapPin, Star, Film, Tv, Award, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { TMDB_IMAGE_BASE, TMDB_PROFILE_SIZES, TMDB_POSTER_SIZES, MOVIE_GENRES, TV_GENRES } from '@/lib/constants';
import { useTheme } from '@/components/layout/theme-provider';
import type { TMDBPersonDetail, TMDBPersonCombinedCredits, TMDBPersonCreditCast, TMDBPersonCreditCrew } from '@/types';

interface Props {
    person: TMDBPersonDetail;
    credits: TMDBPersonCombinedCredits;
}

export function PersonDetailClient({ person, credits }: Props) {
    const locale = useLocale();
    const t = useTranslations('person');
    const { theme } = useTheme();
    const [roleFilter, setRoleFilter] = useState<'all' | 'acting' | 'directing' | 'producing'>('all');

    const profileUrl = person.profile_path
        ? `${TMDB_IMAGE_BASE}/${TMDB_PROFILE_SIZES.original}${person.profile_path}`
        : null;

    // Calculate age
    const age = useMemo(() => {
        if (!person.birthday) return null;
        const birth = new Date(person.birthday);
        const end = person.deathday ? new Date(person.deathday) : new Date();
        let diff = end.getFullYear() - birth.getFullYear();
        const m = end.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && end.getDate() < birth.getDate())) diff--;
        return diff;
    }, [person.birthday, person.deathday]);

    // Deduplicate and organize credits
    const allCast = useMemo(() => {
        const seen = new Set<string>();
        return credits.cast
            .filter(c => {
                const key = `${c.media_type}-${c.id}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            })
            .sort((a, b) => {
                const dateA = a.release_date || a.first_air_date || '';
                const dateB = b.release_date || b.first_air_date || '';
                return dateB.localeCompare(dateA);
            });
    }, [credits.cast]);

    const allCrew = useMemo(() => {
        const seen = new Set<string>();
        return credits.crew
            .filter(c => {
                const key = `${c.media_type}-${c.id}-${c.job}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            })
            .sort((a, b) => {
                const dateA = a.release_date || a.first_air_date || '';
                const dateB = b.release_date || b.first_air_date || '';
                return dateB.localeCompare(dateA);
            });
    }, [credits.crew]);

    const directorCredits = allCrew.filter(c => c.job === 'Director');
    const producerCredits = allCrew.filter(c => c.department === 'Production');

    // Stats
    const totalCredits = allCast.length + allCrew.length;
    const allDates = [...allCast.map(c => c.release_date || c.first_air_date), ...allCrew.map(c => c.release_date || c.first_air_date)]
        .filter(Boolean)
        .sort() as string[];
    const firstYear = allDates[0]?.slice(0, 4);
    const lastYear = allDates[allDates.length - 1]?.slice(0, 4);

    // Genre distribution
    const genreCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        const allGenreIds = [...allCast, ...allCrew].flatMap(c => c.genre_ids || []);
        const genreMap = { ...MOVIE_GENRES, ...TV_GENRES };
        allGenreIds.forEach(id => {
            const name = genreMap[id]?.[locale as 'en' | 'es'] || `Genre ${id}`;
            counts[name] = (counts[name] || 0) + 1;
        });
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8);
    }, [allCast, allCrew, locale]);

    // Films per year
    const filmsPerYear = useMemo(() => {
        const counts: Record<string, number> = {};
        allCast.forEach(c => {
            const year = (c.release_date || c.first_air_date)?.slice(0, 4);
            if (year) counts[year] = (counts[year] || 0) + 1;
        });
        return Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0]));
    }, [allCast]);

    // Frequent collaborators (directors the person worked with 3+ times)
    const collaborators = useMemo(() => {
        if (person.known_for_department !== 'Acting') return [];
        // We'd need crew data per movie — this is a simplified version using credit overlap
        const coActors: Record<string, { name: string; count: number }> = {};
        // Count how many times each cast member appears in same projects
        // Simplified: use the credits themselves to find patterns
        return Object.values(coActors).filter(c => c.count >= 3).sort((a, b) => b.count - a.count);
    }, [person.known_for_department]);

    // Filtered filmography
    const filteredFilmography = useMemo(() => {
        if (roleFilter === 'all') return [...allCast, ...directorCredits, ...producerCredits].sort((a, b) => {
            const dA = ('release_date' in a ? a.release_date : a.first_air_date) || '';
            const dB = ('release_date' in b ? b.release_date : b.first_air_date) || '';
            return dB.localeCompare(dA);
        });
        if (roleFilter === 'acting') return allCast;
        if (roleFilter === 'directing') return directorCredits;
        return producerCredits;
    }, [roleFilter, allCast, directorCredits, producerCredits]);

    const maxBarValue = Math.max(...filmsPerYear.map(([, c]) => c), 1);

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-8 mb-10">
                <div className="flex-shrink-0 w-48 sm:w-56">
                    <div className="relative aspect-[2/3] rounded-xl overflow-hidden border border-border/30 shadow-lg">
                        {profileUrl ? (
                            <Image src={profileUrl} alt={person.name} fill sizes="250px" className="object-cover" />
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
                    </div>
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

                    {/* Career stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <StatCard icon={<Film className="h-4 w-4" />} label={t('totalCredits')} value={String(totalCredits)} />
                        <StatCard icon={<Star className="h-4 w-4" />} label={t('actingCredits')} value={String(allCast.length)} />
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
                    <div className="flex gap-2 mb-6 flex-wrap">
                        {['all', 'acting', 'directing', 'producing'].map(f => (
                            <Badge
                                key={f}
                                variant={roleFilter === f ? 'default' : 'outline'}
                                className="cursor-pointer"
                                onClick={() => setRoleFilter(f as typeof roleFilter)}
                            >
                                {f === 'all' ? t('allRoles') : f === 'acting' ? t('actingCredits') : f === 'directing' ? t('directingCredits') : t('producingCredits')}
                                <span className="ml-1 opacity-60">
                                    ({f === 'all' ? totalCredits : f === 'acting' ? allCast.length : f === 'directing' ? directorCredits.length : producerCredits.length})
                                </span>
                            </Badge>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {filteredFilmography.slice(0, 60).map((c, idx) => {
                            const title = ('title' in c && c.title) || ('name' in c && c.name) || '';
                            const date = ('release_date' in c ? c.release_date : c.first_air_date) || '';
                            const subtitle = 'character' in c ? (c as TMDBPersonCreditCast).character : ('job' in c ? (c as TMDBPersonCreditCrew).job : '');
                            return (
                                <Link
                                    key={`${c.media_type}-${c.id}-${idx}`}
                                    href={`/${locale}/${c.media_type === 'movie' ? 'movie' : 'series'}/${c.id}`}
                                    className="group"
                                >
                                    <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-2 border border-border/30 bg-muted">
                                        {c.poster_path ? (
                                            <Image
                                                src={`${TMDB_IMAGE_BASE}/${TMDB_POSTER_SIZES.medium}${c.poster_path}`}
                                                alt={title}
                                                fill
                                                sizes="150px"
                                                className="object-cover group-hover:scale-105 transition-transform"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs">
                                                No Image
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
                                    <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">{title}</p>
                                    <p className="text-[10px] text-muted-foreground truncate">{subtitle}</p>
                                    {date && <p className="text-[10px] text-muted-foreground">{date.slice(0, 4)}</p>}
                                </Link>
                            );
                        })}
                    </div>
                </TabsContent>

                {/* Career Stats */}
                <TabsContent value="stats" className="mt-6 space-y-8">
                    {/* Top Genres */}
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

                    {/* Films per Year */}
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
