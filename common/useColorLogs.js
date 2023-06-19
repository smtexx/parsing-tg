/**
 * Функция добавляет в String.prototype функцию
 * colorLog, используемую для подсветки шрифта в консоли bash
 */

export function useColorLogs() {
  String.prototype.colorLog = colorLog;
}

/**
 * Функция возвращает стоку аналогичного содержимого обернутую
 * в последовательност символов форматирования текста в консоли bash
 *
 * @param {'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white'} color - цвет шрифта
 * @param {boolean | undefined} underlined - подчеркивание текста
 */
function colorLog(color, underlined) {
  const colors = {
    red: '91',
    green: '92',
    yellow: '93',
    blue: '94',
    magenta: '95',
    cyan: '96',
    white: '97',
  };

  const font = [];
  if (color) {
    font.push(colors[color]);
  }
  if (underlined) {
    font.push('4');
  }

  return `\x1b[0;${font.join(';')}m${this.toString()}\x1b[0m`;
}
