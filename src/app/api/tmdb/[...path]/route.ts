import { NextRequest, NextResponse } from 'next/server';
import { searchMulti, searchMovies, searchTV, getTrending, getTopRatedMovies, getTopRatedTV, discoverMovies, discoverTV, getMovieDetails, getSeriesDetails, getSeasonDetails, getExternalIds, getUpcomingMovies, getPersonDetails, getPersonCombinedCredits } from '@/lib/api/tmdb';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path } = await params;
        const searchParams = request.nextUrl.searchParams;
        const language = searchParams.get('language') || 'en-US';
        const page = parseInt(searchParams.get('page') || '1', 10);
        const joined = path.join('/');

        switch (joined) {
            case 'search/multi': {
                const query = searchParams.get('query') || '';
                const data = await searchMulti(query, page, language);
                return NextResponse.json(data);
            }
            case 'search/movie': {
                const query = searchParams.get('query') || '';
                const data = await searchMovies(query, page, language);
                return NextResponse.json(data);
            }
            case 'search/tv': {
                const query = searchParams.get('query') || '';
                const data = await searchTV(query, page, language);
                return NextResponse.json(data);
            }
            case 'trending': {
                const mediaType = (searchParams.get('mediaType') || 'all') as 'movie' | 'tv' | 'all';
                const timeWindow = (searchParams.get('timeWindow') || 'day') as 'day' | 'week';
                const data = await getTrending(mediaType, timeWindow, language);
                return NextResponse.json(data);
            }
            case 'movie/top_rated': {
                const data = await getTopRatedMovies(page, language);
                return NextResponse.json(data);
            }
            case 'tv/top_rated': {
                const data = await getTopRatedTV(page, language);
                return NextResponse.json(data);
            }
            case 'movie/upcoming': {
                const data = await getUpcomingMovies(page, language);
                return NextResponse.json(data);
            }
            case 'discover/movie': {
                const params: Record<string, string> = {};
                searchParams.forEach((value, key) => {
                    if (key !== 'language') params[key] = value;
                });
                const data = await discoverMovies(params, language);
                return NextResponse.json(data);
            }
            case 'discover/tv': {
                const params: Record<string, string> = {};
                searchParams.forEach((value, key) => {
                    if (key !== 'language') params[key] = value;
                });
                const data = await discoverTV(params, language);
                return NextResponse.json(data);
            }
            default: {
                // Handle detail requests
                const movieMatch = joined.match(/^movie\/(\d+)$/);
                const tvMatch = joined.match(/^tv\/(\d+)$/);
                const seasonMatch = joined.match(/^tv\/(\d+)\/season\/(\d+)$/);
                const externalIdsMatch = joined.match(/^tv\/(\d+)\/external_ids$/);
                const personMatch = joined.match(/^person\/(\d+)$/);
                const personCreditsMatch = joined.match(/^person\/(\d+)\/combined_credits$/);

                if (movieMatch) {
                    const data = await getMovieDetails(parseInt(movieMatch[1], 10), language);
                    return NextResponse.json(data);
                }
                if (tvMatch) {
                    const data = await getSeriesDetails(parseInt(tvMatch[1], 10), language);
                    return NextResponse.json(data);
                }
                if (seasonMatch) {
                    const data = await getSeasonDetails(
                        parseInt(seasonMatch[1], 10),
                        parseInt(seasonMatch[2], 10),
                        language
                    );
                    return NextResponse.json(data);
                }
                if (externalIdsMatch) {
                    const data = await getExternalIds(parseInt(externalIdsMatch[1], 10));
                    return NextResponse.json(data);
                }
                if (personMatch) {
                    const data = await getPersonDetails(parseInt(personMatch[1], 10), language);
                    return NextResponse.json(data);
                }
                if (personCreditsMatch) {
                    const data = await getPersonCombinedCredits(parseInt(personCreditsMatch[1], 10), language);
                    return NextResponse.json(data);
                }

                return NextResponse.json({ error: 'Not found' }, { status: 404 });
            }
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
