import { getPersonDetails, getPersonCombinedCredits } from '@/lib/api/tmdb';
import { PersonDetailClient } from './person-detail-client';

export default async function PersonPage({
    params,
}: {
    params: Promise<{ locale: string; id: string }>;
}) {
    const { locale, id } = await params;
    const language = locale === 'es' ? 'es-ES' : 'en-US';

    const [person, credits] = await Promise.all([
        getPersonDetails(parseInt(id, 10), language),
        getPersonCombinedCredits(parseInt(id, 10), language),
    ]);

    return <PersonDetailClient person={person} credits={credits} />;
}
