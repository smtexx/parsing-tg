import { load } from 'cheerio';
import { ParsingError } from '../common/ParsingError.js';

/**
 * Парсер извлекает ссылки на страницы с каталогом
 * телеграм каналов с telega.in.
 * Разбивка страниц выполнена по темам каналов
 *
 * @param {import('playwright').Page} PAGE - объект страницы браузера из пакета playwright
 */

/* Описание извлекаемых данных
  name - уникальное имя темы раздела
  descriptionShort - короткое описание темы раздела
  description - полное описание темы раздела
  link - ссылка на отфильтрованную по теме страницу
*/

export async function parser_catalogPage(link, PAGE) {
  const URL = 'https://telega.in/catalog';
  const data = [];

  console.log(`Переход на страницу ${URL}`);
  const response = await PAGE.goto(URL);

  if (!response.ok()) {
    throw new ParsingError(`Ошибка при переходе на ${URL}`);
  }
  await PAGE.waitForLoadState('load');
  console.log('Страница загружена, начинаем парсинг данных');

  const baseSelector = '.filter .category ul';

  const $ = load(await PAGE.content());
  $(baseSelector + ' [data-value]').each((idx, el) => {
    const $el = $(el);
    const catalogPage = {};

    catalogPage.name = $el.attr('data-url_name');
    catalogPage.descriptionShort = $el.text().trim();
    catalogPage.description = $el.attr('data-similar');
    catalogPage.link = `https://telega.in/catalog?filter%5Bchannel_theme_id%5D=${$el.attr(
      'data-value'
    )}`;

    data.push(catalogPage);
  });

  console.log('Данные успешно извлечены :)');
  return data;
}
