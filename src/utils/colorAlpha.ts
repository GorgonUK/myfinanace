/**
 * Approximate MUI `alpha(color, opacity)` for hex colors.
 */
export function colorAlpha(color: string, opacity: number): string {
  const hex = color.replace('#', '');
  if (hex.length !== 6) {
    return color;
  }
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}
