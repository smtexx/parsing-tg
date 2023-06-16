/**
 * Функция извлекает часть строки из цифровых символов идущих подряд
 * типа 4.5K, 1.7k, 567, 54.67. Преобразует их в число и возвращает его.
 * При этом пробельные символы между цифрами удаляются, сиволы K и k приводят
 * к умножению числа на 1000. Если полученный аргумент имеет неподходящий тип,
 * содержит более одного или ни одного блока цифр, возвращается 'empty'.
 *
 * @param {string} str - строка для извлечения цифрового значения
 */

export function parseNumericValue(str) {
  const regexp = /\d+(\.\d+)?[Kk]?/;
  const EMPTY = 'empty';

  if (typeof str !== 'string') {
    return EMPTY;
  }

  const preparedStr = str.replace(/\s+/g, '');
  if (!regexp.test(preparedStr) || /\d/.test(preparedStr.replace(regexp, ''))) {
    return EMPTY;
  }

  let extracted = preparedStr.match(regexp)[0];

  let kilo = false;
  if (/[Kk]/.test(extracted)) {
    extracted = extracted.replace(/[Kk]/, '');
    kilo = true;
  }

  const parsed = parseFloat(extracted);
  if (!Number.isFinite(parsed)) {
    return EMPTY;
  }

  return kilo ? parsed * 1000 : parsed;
}
