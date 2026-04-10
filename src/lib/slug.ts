export function slugifyPathSegment(value: string): string {
    const normalized = value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/&/g, ' and ')
        .replace(/['".,:;!?()[\]{}]/g, ' ')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase();

    return normalized || 'item';
}

export function deslugifyPathSegment(slug: string): string {
    return decodeURIComponent(slug)
        .split('-')
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

export function slugToSearchQuery(slug: string): string {
    return decodeURIComponent(slug)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/-/g, ' ')
        .trim();
}

export function parseNumericId(value: string): number | null {
    const maybe = Number.parseInt(value, 10);
    return Number.isInteger(maybe) && maybe > 0 && String(maybe) === value ? maybe : null;
}

export function findBestMatchBySlug<T extends { id: number }>(
    slug: string,
    items: T[],
    getLabel: (item: T) => string | undefined
): T | null {
    if (!items.length) return null;

    const target = slugifyPathSegment(slugToSearchQuery(slug));

    const exact = items.find((item) => slugifyPathSegment(getLabel(item) || '') === target);
    if (exact) return exact;

    const startsWith = items.find((item) => slugifyPathSegment(getLabel(item) || '').startsWith(target));
    if (startsWith) return startsWith;

    return items[0] || null;
}

export function buildMoviePath(locale: string, id: number, title: string): string {
    const slug = slugifyPathSegment(title || String(id));
    return `/${locale}/movie/${slug}`;
}

export function buildSeriesPath(locale: string, id: number, name: string): string {
    const slug = slugifyPathSegment(name || String(id));
    return `/${locale}/series/${slug}`;
}

export function buildPersonPath(locale: string, id: number, name: string): string {
    const slug = slugifyPathSegment(name || String(id));
    return `/${locale}/person/${slug}`;
}
