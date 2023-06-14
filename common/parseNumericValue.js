/**
 * Extracts string values like 4.5K, 567, 54.67 from string and converts it to numbers,
 * If received value contains several blocks of digits, or is not string, returns the text "null"
 *
 * @param {string} str - string value to parse
 * @returns {number | 'empty'}
 */

export function parseNumericValue(str) {
  const regexp = /\d+(\.\d+)?K?/;
  const EMPTY = 'empty';

  if (typeof str !== 'string') {
    return EMPTY;
  }

  const preparedStr = str.replaceAll(' ', '');
  if (!regexp.test(preparedStr) || /\d/.test(preparedStr.replace(regexp, ''))) {
    return EMPTY;
  }

  let extracted = preparedStr.match(regexp)[0];

  let kilo = false;
  if (/K/.test(extracted)) {
    extracted = extracted.replace('K', '');
    kilo = true;
  }

  const parsed = parseFloat(extracted);
  if (!Number.isFinite(parsed)) {
    return EMPTY;
  }

  return kilo ? parsed * 1000 : parsed;
}
