// TMDB image base URLs
export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';
export const TMDB_POSTER_SIZES = {
    small: 'w185',
    medium: 'w342',
    large: 'w500',
    original: 'original',
} as const;
export const TMDB_BACKDROP_SIZES = {
    small: 'w780',
    large: 'w1280',
    original: 'original',
} as const;
export const TMDB_PROFILE_SIZES = {
    small: 'w185',
    medium: 'w342',
    original: 'original',
} as const;

// API base URLs
export const TMDB_API_BASE = 'https://api.themoviedb.org/3';
export const TVMAZE_API_BASE = 'https://api.tvmaze.com';
export const OMDB_API_BASE = 'https://www.omdbapi.com';

// App constants
export const ITEMS_PER_PAGE = 20;
export const ITEMS_PER_PAGE_OPTIONS = [20, 40, 60] as const;
export const SEARCH_DEBOUNCE_MS = 300;
export const DEFAULT_MIN_VOTES = 1000;

// Storage keys
export const OMDB_KEY_STORAGE_KEY = 'cinemascope_omdb_key';
export const THEME_STORAGE_KEY = 'cinemascope_theme';
export const LOCALE_STORAGE_KEY = 'cinemascope_locale';
export const RATING_SOURCE_STORAGE_KEY = 'cinemascope_rating_source';

// Rating sources
export type RatingSource = 'tvmaze' | 'imdb';
export const DEFAULT_RATING_SOURCE: RatingSource = 'tvmaze';

// Heatmap color scales
export const HEATMAP_COLORS = {
    dark: {
        low: '#1a2332',    // Deep slate
        mid: '#1a5c5c',    // Teal
        high: '#2dd4a8',   // Bright cyan-green
        noData: '#1e293b', // Muted slate
    },
    light: {
        low: '#e2e8f0',    // Light gray
        mid: '#6893c4',    // Soft blue
        high: '#2563eb',   // Deep blue
        noData: '#f1f5f9', // Very light gray
    },
} as const;

// Genre list (TMDB genre IDs — shared between movies and TV)
export const MOVIE_GENRES: Record<number, { en: string; es: string }> = {
    28: { en: 'Action', es: 'Acción' },
    12: { en: 'Adventure', es: 'Aventura' },
    16: { en: 'Animation', es: 'Animación' },
    35: { en: 'Comedy', es: 'Comedia' },
    80: { en: 'Crime', es: 'Crimen' },
    99: { en: 'Documentary', es: 'Documental' },
    18: { en: 'Drama', es: 'Drama' },
    10751: { en: 'Family', es: 'Familia' },
    14: { en: 'Fantasy', es: 'Fantasía' },
    36: { en: 'History', es: 'Historia' },
    27: { en: 'Horror', es: 'Terror' },
    10402: { en: 'Music', es: 'Música' },
    9648: { en: 'Mystery', es: 'Misterio' },
    10749: { en: 'Romance', es: 'Romance' },
    878: { en: 'Science Fiction', es: 'Ciencia Ficción' },
    10770: { en: 'TV Movie', es: 'Película de TV' },
    53: { en: 'Thriller', es: 'Thriller' },
    10752: { en: 'War', es: 'Bélica' },
    37: { en: 'Western', es: 'Western' },
};

export const TV_GENRES: Record<number, { en: string; es: string }> = {
    10759: { en: 'Action & Adventure', es: 'Acción y Aventura' },
    16: { en: 'Animation', es: 'Animación' },
    35: { en: 'Comedy', es: 'Comedia' },
    80: { en: 'Crime', es: 'Crimen' },
    99: { en: 'Documentary', es: 'Documental' },
    18: { en: 'Drama', es: 'Drama' },
    10751: { en: 'Family', es: 'Familia' },
    10762: { en: 'Kids', es: 'Infantil' },
    9648: { en: 'Mystery', es: 'Misterio' },
    10763: { en: 'News', es: 'Noticias' },
    10764: { en: 'Reality', es: 'Reality' },
    10765: { en: 'Sci-Fi & Fantasy', es: 'Ci-Fi y Fantasía' },
    10766: { en: 'Soap', es: 'Telenovela' },
    10767: { en: 'Talk', es: 'Talk Show' },
    10768: { en: 'War & Politics', es: 'Bélica y Política' },
    37: { en: 'Western', es: 'Western' },
};
