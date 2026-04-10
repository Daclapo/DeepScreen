import { notFound, redirect } from 'next/navigation';
import { getPersonDetails, getPersonCombinedCredits, searchPerson } from '@/lib/api/tmdb';
import { PersonDetailClient } from './person-detail-client';
import { findBestMatchBySlug, parseNumericId, slugToSearchQuery, slugifyPathSegment } from '@/lib/slug';

export default async function PersonPage({
    params,
}: {
    params: Promise<{ locale: string; id: string }>;
}) {
    const { locale, id } = await params;
    const language = locale === 'es' ? 'es-ES' : 'en-US';
    const rawId = decodeURIComponent(id);

    let tmdbId = parseNumericId(rawId);

    if (!tmdbId) {
        const search = await searchPerson(slugToSearchQuery(rawId), 1, language);
        const match = findBestMatchBySlug(rawId, search.results || [], (item) => item.name);
        if (!match) {
            notFound();
        }
        tmdbId = match.id;
    }

    const [person, credits] = await Promise.all([
        getPersonDetails(tmdbId, language),
        getPersonCombinedCredits(tmdbId, language),
    ]);

    const canonicalSlug = slugifyPathSegment(person.name);
    if (rawId !== canonicalSlug) {
        redirect(`/${locale}/person/${canonicalSlug}`);
    }

    return <PersonDetailClient person={person} credits={credits} />;
}
