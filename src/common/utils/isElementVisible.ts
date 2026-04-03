export function isElementVisible(element: Element | null | undefined) {
    if (!element) return false;
    const rect = element.getBoundingClientRect();

    // Intersection Observer might be overkill for one-time check
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}