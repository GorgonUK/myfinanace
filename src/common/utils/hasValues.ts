/**
 * Check if an object (including nested objects) has any values that are not `undefined`.
 */
export function hasValues(obj: Record<string, any>): boolean {
  return Object.values(obj).some(v => v !== undefined && (typeof v !== 'object' || hasValues(v)));
}