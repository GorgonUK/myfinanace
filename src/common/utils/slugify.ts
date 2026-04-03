/**
 * Slugify a string, removing special characters and replacing spaces with hyphens.
 */
export function slugify(name: string) {
    return name
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^\w\s-]/g, '') // Remove non-word characters except spaces and hyphens
        .trim()
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-'); // Replace multiple hyphens with a single hyphen
}