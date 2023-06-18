/**
 * Функция используется внутри PAGE.waitForFunction
 * возвращает true в случае если найден элемент соответствующий
 * одному из переданных маркеров и страница промаркерована
 *
 * @typedef {Object} Marker
 * @prop {string} selector - css селектор для идентификации страницы
 * @prop {string | undefined} text - текст внутри css селектора
 * @prop {string} value - значение маркера
 *
 * @param {Array<Marker>} markers - массив с селекторами и соответствующими им маркерами
 */

export function injectMarker(markers) {
  function markPage(value) {
    const markerElement = document.createElement('span');
    markerElement.setAttribute('data-injected-marker', value);
    document.body.append(markerElement);
    return true;
  }

  for (let marker of markers) {
    let elements = document.querySelectorAll(marker.selector);

    if (elements.length === 0) {
      // Подходящих под селектор элементов не найдено
      continue;
    }

    // Есть элементы соответствующие селекторам
    if (marker.text) {
      // В конфигурации маркера указано текстовое поле
      const suitableElements = [...elements].filter((el) =>
        el.textContent.includes(marker.text)
      );

      if (suitableElements.length > 0) {
        // Текст указанный в поле присутствует в элементе
        return markPage(marker.value);
      } else {
        // Текст указанный в поле отсутствует в элементе
        continue;
      }
    } else {
      // В конфигурации маркера нет текстового поля, но элемент
      // соответствует селектору
      return markPage(marker.value);
    }
  }

  return false;
}

export const INJECTED_SELECTOR_ATTRIBUTE = 'data-injected-marker';
export const INJECTED_SELECTOR = `span[${INJECTED_SELECTOR_ATTRIBUTE}]`;
