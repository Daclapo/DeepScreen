// -- TMDB types --

export interface TMDBMovie {
    id: number;
    title: string;
    original_title: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    release_date: string;
    vote_average: number;
    vote_count: number;
    popularity: number;
    genre_ids: number[];
    adult: boolean;
    original_language: string;
    media_type?: 'movie';
}

export interface TMDBSeries {
    id: number;
    name: string;
    original_name: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    first_air_date: string;
    last_air_date: string;
    vote_average: number;
    vote_count: number;
    popularity: number;
    genre_ids: number[];
    origin_country: string[];
    original_language: string;
    media_type?: 'tv';
}

export type TMDBMultiResult = (TMDBMovie & { media_type: 'movie' }) | (TMDBSeries & { media_type: 'tv' }) | { media_type: 'person'; id: number; name: string };

export interface TMDBPaginatedResponse<T> {
    page: number;
    results: T[];
    total_pages: number;
    total_results: number;
}

export interface TMDBGenre {
    id: number;
    name: string;
}

export interface TMDBProductionCompany {
    id: number;
    name: string;
    logo_path: string | null;
    origin_country: string;
}

export interface TMDBNetwork {
    id: number;
    name: string;
    logo_path: string | null;
    origin_country: string;
}

export interface TMDBCastMember {
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
    order: number;
    known_for_department: string;
}

export interface TMDBCrewMember {
    id: number;
    name: string;
    job: string;
    department: string;
    profile_path: string | null;
}

export interface TMDBCredits {
    cast: TMDBCastMember[];
    crew: TMDBCrewMember[];
}

export interface TMDBSeason {
    id: number;
    name: string;
    overview: string;
    season_number: number;
    episode_count: number;
    air_date: string | null;
    poster_path: string | null;
    vote_average: number;
}

export interface TMDBEpisode {
    id: number;
    name: string;
    overview: string;
    episode_number: number;
    season_number: number;
    air_date: string | null;
    still_path: string | null;
    vote_average: number;
    vote_count: number;
    runtime: number | null;
}

export interface TMDBMovieDetail extends TMDBMovie {
    genres: TMDBGenre[];
    runtime: number | null;
    budget: number;
    revenue: number;
    status: string;
    tagline: string | null;
    production_companies: TMDBProductionCompany[];
    spoken_languages: { iso_639_1: string; name: string; english_name: string }[];
    credits: TMDBCredits;
    external_ids: { imdb_id: string | null };
    similar: TMDBPaginatedResponse<TMDBMovie>;
    recommendations: TMDBPaginatedResponse<TMDBMovie>;
}

export interface TMDBSeriesDetail extends TMDBSeries {
    genres: TMDBGenre[];
    number_of_seasons: number;
    number_of_episodes: number;
    episode_run_time: number[];
    status: string;
    tagline: string | null;
    type: string;
    networks: TMDBNetwork[];
    production_companies: TMDBProductionCompany[];
    created_by: { id: number; name: string; profile_path: string | null }[];
    seasons: TMDBSeason[];
    credits: TMDBCredits;
    external_ids: { imdb_id: string | null; tvdb_id: number | null };
    similar: TMDBPaginatedResponse<TMDBSeries>;
    recommendations: TMDBPaginatedResponse<TMDBSeries>;
}

export interface TMDBSeasonDetail {
    id: number;
    name: string;
    overview: string;
    season_number: number;
    air_date: string | null;
    episodes: TMDBEpisode[];
}

export interface TMDBExternalIds {
    imdb_id: string | null;
    tvdb_id: number | null;
    facebook_id: string | null;
    instagram_id: string | null;
    twitter_id: string | null;
}

// Person types
export interface TMDBPersonDetail {
    id: number;
    name: string;
    biography: string;
    birthday: string | null;
    deathday: string | null;
    place_of_birth: string | null;
    profile_path: string | null;
    known_for_department: string;
    gender: number;
    popularity: number;
    also_known_as: string[];
    imdb_id: string | null;
    homepage: string | null;
}

export interface TMDBPersonCreditCast {
    id: number;
    title?: string;
    name?: string;
    original_title?: string;
    original_name?: string;
    character: string;
    media_type: 'movie' | 'tv';
    poster_path: string | null;
    backdrop_path: string | null;
    release_date?: string;
    first_air_date?: string;
    vote_average: number;
    vote_count: number;
    genre_ids: number[];
    popularity: number;
    overview: string;
    episode_count?: number;
    credit_id: string;
}

export interface TMDBPersonCreditCrew {
    id: number;
    title?: string;
    name?: string;
    original_title?: string;
    original_name?: string;
    job: string;
    department: string;
    media_type: 'movie' | 'tv';
    poster_path: string | null;
    backdrop_path: string | null;
    release_date?: string;
    first_air_date?: string;
    vote_average: number;
    vote_count: number;
    genre_ids: number[];
    popularity: number;
    overview: string;
    credit_id: string;
}

export interface TMDBPersonCombinedCredits {
    id: number;
    cast: TMDBPersonCreditCast[];
    crew: TMDBPersonCreditCrew[];
}

// -- TVMaze types --

export interface TVMazeShow {
    id: number;
    name: string;
    type: string;
    language: string;
    status: string;
    rating: { average: number | null };
    externals: { imdb: string | null; tvrage: number | null; thetvdb: number | null };
}

export interface TVMazeEpisode {
    id: number;
    name: string;
    season: number;
    number: number;
    airdate: string;
    runtime: number | null;
    rating: { average: number | null };
    summary: string | null;
    image: { medium: string; original: string } | null;
}

// -- OMDb types --

export interface OMDbMovie {
    Title: string;
    Year: string;
    Rated: string;
    Released: string;
    Runtime: string;
    Genre: string;
    Director: string;
    Writer: string;
    Actors: string;
    Plot: string;
    Language: string;
    Country: string;
    Awards: string;
    Poster: string;
    Ratings: { Source: string; Value: string }[];
    Metascore: string;
    imdbRating: string;
    imdbVotes: string;
    imdbID: string;
    Type: string;
    Response: string;
}

export interface OMDbSeasonResponse {
    Title: string;
    Season: string;
    totalSeasons: string;
    Episodes: OMDbEpisode[];
    Response: string;
}

export interface OMDbEpisode {
    Title: string;
    Released: string;
    Episode: string;
    imdbRating: string;
    imdbID: string;
}

// -- App-level types --

export type MediaType = 'movie' | 'tv';

export interface EpisodeRating {
    season: number;
    episode: number;
    title: string;
    rating: number | null;
    airDate: string | null;
    imdbRating: number | null;
}

export interface SeasonStats {
    season: number;
    averageRating: number | null;
    episodeCount: number;
    bestEpisode: EpisodeRating | null;
    worstEpisode: EpisodeRating | null;
}

export interface DiscoverFilters {
    mediaType: MediaType;
    genres: number[];
    yearFrom: number | null;
    yearTo: number | null;
    ratingMin: number;
    ratingMax: number;
    minVotes: number;
    status: string | null;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    page: number;
}

export interface AppLocale {
    locale: 'en' | 'es';
}
