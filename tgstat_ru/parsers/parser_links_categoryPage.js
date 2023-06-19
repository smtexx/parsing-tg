/**
 * Парсер извлекает ссылки на страницы с категориями
 * телеграм каналов со страницы каталога  https://tgstat.ru/.
 * Возвращает массив извлеченных ссылок
 *
 * @param {import('playwright').Page} PAGE - объект страницы браузера с ПРОЙДЕННОЙ АВТОРИЗАЦИЕЙ из пакета playwright
 */

import { load } from 'cheerio';

export async function parser_links_categoryPage(link, PAGE) {
  const URL = 'https://tgstat.ru';
  const baseSelector = '.h4:contains("Все категории")';

  await PAGE.goto(URL);

  const $ = load(await PAGE.content());
  const pathsContainer = $(baseSelector).parent().parent();
  const paths = pathsContainer
    .find('a.text-dark')
    .map((idx, el) => $(el).attr('href'))
    .toArray();

  const topicLinks = [...new Set(paths)].map((path) => URL + path);

  return topicLinks;
}
