import { ParsingError } from '../common/ParsingError.js';

/**
 * Парсер извлекает ссылки на телеграм каналы со страницы с каталогом
 * телеграм каналов на telega.in/catalog. Возвращает массив извлеченных ссылок
 *
 * @param {string} catalogPage - ссылка на страницу каталога с фильтрами
 * @param {import('playwright').Page} PAGE - объект страницы браузера с ПРОЙДЕННОЙ АВТОРИЗАЦИЕЙ из пакета playwright
 */

export async function parser_cannelLinks(catalogPage, PAGE) {
  console.log(`Переходим к ${catalogPage} для парсинга ссылок`);
  const response = await PAGE.goto(catalogPage);

  if (!response.ok()) {
    throw new ParsingError(`Ошибка при переходе на ${catalogPage}`);
  }
  await PAGE.waitForLoadState('load');

  console.log('Проверяем статус авторизации');
  try {
    await PAGE.waitForSelector('div.js_load_all_notifications', {
      timeout: 5000,
    });
  } catch (error) {
    throw new ParsingError('Требуется авторизация, парсинг ссылок невозможен');
  }

  // Получаем общее количество ссылок
  const countSelector = 'div.channel_count.displayed_count';
  await PAGE.waitForSelector(countSelector);
  const totalLinks = await PAGE.$eval(countSelector, (el) => {
    const totalString = el.lastChild.textContent.match(/(\d+)/);

    if (totalString === null) {
      throw new ParsingError(
        `Невозможно извлечь ОБЩЕЕ количество ссылок при парсинге ${catalogPage}`
      );
    }
    return parseInt(totalString);
  });
  console.log(`Обнаружено ссылок на каналы: ${totalLinks}`);

  // Последовательно загружаем ссылки со страницы в цикле
  console.log('Загружаем ссылки на каналы');
  const showMoreSelector = 'div.js_load_content_btn_more';

  async function getShownLinksCount() {
    await PAGE.waitForSelector(countSelector);
    return await PAGE.$eval(countSelector, (el) => {
      const spanEl = el.querySelector('span');
      if (spanEl === null) {
        throw new ParsingError(
          `Невозможно извлечь ЗАГРУЖЕННОЕ количество ссылок при парсинге ${catalogPage}`
        );
      }
      const shownString = spanEl.textContent.match(/(\d+)/);
      if (shownString === null) {
        throw new ParsingError(
          `Невозможно извлечь ЗАГРУЖЕННОЕ количество ссылок при парсинге ${catalogPage}`
        );
      }

      return parseInt(shownString);
    });
  }
  let shownLinks = await getShownLinksCount();

  // Открытие ссылок в цикле
  while (shownLinks < totalLinks) {
    console.log(`Открыто ${shownLinks} из ${totalLinks}`);
    await PAGE.click(showMoreSelector);
    await PAGE.waitForFunction((lastShown) => {
      const shownCountElement = document.querySelector(
        'div.channel_count.displayed_count > span'
      );
      if (shownCountElement !== null) {
        return parseInt(shownCountElement.textContent) > lastShown;
      } else {
        return false;
      }
    }, shownLinks);

    shownLinks = await getShownLinksCount();
  }
  console.log(`Открыто ${shownLinks} из ${totalLinks}`);
  console.log('Открытие ссылок успешно завершено');
  console.log('Парсинг ссылок со страницы успешно выполнен :)');

  // Extract all shown channel links
  return await PAGE.$$eval(
    'div.action-more a[href^="/channels/"]',
    (channelLinks) => channelLinks.map((a) => a.href)
  );
}
