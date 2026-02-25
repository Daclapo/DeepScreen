import { NextRequest, NextResponse } from 'next/server';
import { getShowByImdbId, getEpisodes } from '@/lib/api/tvmaze';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path } = await params;
        const joined = path.join('/');

        const lookupMatch = joined.match(/^lookup\/(.+)$/);
        const episodesMatch = joined.match(/^shows\/(\d+)\/episodes$/);

        if (lookupMatch) {
            const imdbId = lookupMatch[1];
            const show = await getShowByImdbId(imdbId);
            if (!show) {
                return NextResponse.json({ error: 'Show not found' }, { status: 404 });
            }
            return NextResponse.json(show);
        }

        if (episodesMatch) {
            const showId = parseInt(episodesMatch[1], 10);
            const episodes = await getEpisodes(showId);
            return NextResponse.json(episodes);
        }

        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
