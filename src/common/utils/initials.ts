/**
 * Generate initials from a given first name and last name.
 * 
 * If the first name contains a space and the last name is not provided,
 * it assumes the first name is a full name and splits it into first and last names.
 * Returns the uppercase initials formed by the first character of each name.
 * 
 * @param firstName - The first name or full name.
 * @param lastName - The last name, optional if first name is a full name.
 * @returns The uppercase initials as a string.
 */
export function initials(firstName: string | undefined, lastName: string | undefined = undefined): string {
  // If the first name is a full name, split it into first and last names
  if (firstName && !lastName && firstName.includes(' '))
      firstName = firstName.split(' ')[0], lastName = firstName.split(' ')[1]

  return ((firstName?.charAt(0) || '') + (lastName?.charAt(0) || '')).toLocaleUpperCase();
}