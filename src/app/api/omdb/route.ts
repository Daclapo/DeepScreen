import { NextRequest, NextResponse } from 'next/server';
import { getByImdbId, getSeasonEpisodes, validateApiKey } from '@/lib/api/omdb';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const apiKey = request.headers.get('x-omdb-key') || searchParams.get('apikey');

        if (!apiKey) {
            return NextResponse.json({ error: 'OMDb API key required' }, { status: 401 });
        }

        const action = searchParams.get('action');

        if (action === 'validate') {
            const valid = await validateApiKey(apiKey);
            return NextResponse.json({ valid });
        }

        const imdbId = searchParams.get('i');
        if (!imdbId) {
            return NextResponse.json({ error: 'IMDb ID required' }, { status: 400 });
        }

        const season = searchParams.get('season');
        if (season) {
            const data = await getSeasonEpisodes(imdbId, parseInt(season, 10), apiKey);
            return NextResponse.json(data);
        }

        const data = await getByImdbId(imdbId, apiKey);
        return NextResponse.json(data);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
