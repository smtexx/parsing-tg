import { load } from 'cheerio';
import { parseNumericValue } from '../../common/parseNumericValue.js';

/**
 * Парсер извлекает данные о категориях телеграм
 * каналов с каталога на "https://tgstat.ru/${category}" *
 *
 * @param {string} link - ссылка на страницу категории каталога
 * @param {import('playwright').Page} PAGE - объект страницы браузера из пакета playwright
 */

/* Описание извлекаемых данных
    id - идентификатор категории
    title - название категории
    channels - массив с информацией о телеграм канале
        id - идентификатор канала
        name - название канала
        description - описание канала
        subscribers - количество подписчиков
    chats - массив с информацией о чатах
        id - идентификатор чата
        name - название чата
        description - описание чата
        subscribers - количество участноиков
*/

export async function parser_data_category(categoryID, PAGE) {
  const data = { id: categoryID };

  async function waitForShowMore() {
    await PAGE.waitForFunction(
      () => {
        const showMoreButton = Array.from(
          document.querySelectorAll('button[type="button"]')
        ).find((button) => button.textContent.includes('Показать больше'));

        if (showMoreButton) {
          return true;
        }
      },
      null,
      { timeout: 0 }
    );
  }
  async function openHiddenCarts() {
    let opened = (await PAGE.locator('.card.card-body.peer-item-box').all())
      .length;
    while (true) {
      await PAGE.waitForTimeout(3000);
      // Дождаться наличия кнопки "Показать больше"
      await waitForShowMore();
      // Получить локатор кнопки
      const buttonLocator = PAGE.getByText('Показать больше');
      // Проверить, доступна ли кнопка
      const isEnabled = await buttonLocator.evaluate(
        (button) => button.offsetParent !== null
      );
      if (isEnabled) {
        console.log(`Открыто кароточек: ${opened}`);
        await buttonLocator.click({ timeout: 120_000 });
      } else {
        break;
      }
      opened += 102;
    }
  }

  await PAGE.goto(`https://tgstat.ru/${categoryID}`);

  // Парсинг карточек каналов
  console.log('Открываем каналы');
  await openHiddenCarts();
  let $ = load(await PAGE.content());
  // Название категории
  data.title = $('h1.text-dark').text().trim();
  // Данные каналов
  const channelCarsd = $('.card.card-body.peer-item-box');
  const channels = channelCarsd
    .map((idx, el) => {
      const $el = $(el);
      const id = $el
        .find('a.text-body')
        .attr('href')
        .replace('https://tgstat.ru/channel/', '');
      const name = $el.find('.font-16.text-dark').text().trim();
      const description = $el.find('.font-14.text-muted').text().trim();
      const subscribers = parseNumericValue(
        $el.find('.font-12:contains("подписчиков")').text()
      );
      return {
        id,
        name,
        description,
        subscribers,
      };
    })
    .toArray();

  data.channels = channels;

  // Парсинг карточек чатов
  console.log('Открываем чаты');
  const switchToChats = PAGE.locator('label.form-filter-js', {
    hasText: 'Все чаты',
  });
  await switchToChats.waitFor({ state: 'attached' });
  await switchToChats.click({ timeout: 120_000 });
  await openHiddenCarts();
  // Данные чатов
  $ = load(await PAGE.content());
  const chatCarsd = $('.card.card-body.peer-item-box');
  const chats = chatCarsd
    .map((idx, el) => {
      const $el = $(el);
      const id = $el
        .find('a.text-body')
        .attr('href')
        .replace('https://tgstat.ru/chat/', '');
      const name = $el.find('.font-16.text-dark').text().trim();
      const description = $el.find('.font-14.text-muted').text().trim();
      const subscribers = parseNumericValue(
        $el.find('.font-12:contains("участников")').text()
      );
      return {
        id,
        name,
        description,
        subscribers,
      };
    })
    .toArray();

  // Парсинг завершен
  data.chats = chats;

  return data;
}

// Парсить время последнего сообщения с карточек!!!
