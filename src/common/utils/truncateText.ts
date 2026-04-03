/**
 * Truncates the given text if it exceeds the specified maximum length.
 *
 * @param {string} text - The text to be truncated.
 * @param {number} maxLength - The maximum allowed length of the text.
 * @returns {string} The truncated text with "..." appended if it was truncated, or the original text.
 */
export function truncateText(text:string, maxLength:number) {
    // Check if text is a string; if not, return an empty string or handle as needed
    if (typeof text !== 'string') {
      return '';
    }
    
    // If maxLength is not provided or text length is less than or equal to maxLength, return the original text
    if (!maxLength || text.length <= maxLength) {
      return text;
    }
    
    // Otherwise, truncate the text and add ellipsis
    return text.substring(0, maxLength) + '...';
  }