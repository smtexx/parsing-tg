import { load } from 'cheerio';
import { parseNumericValue } from '../../common/parseNumericValue.js';

/**
 * Парсер извлекает данные телеграм канала с его страницы на telega.in *
 *
 * @param {string} link - ссылка на страницу телеграм канала
 * @param {import('playwright').Page} PAGE - объект страницы браузера из пакета playwright
 */

/* Описание извлекаемых данных
   ink - ссылка на телеграм канал на telega.in
  name - название канала
  description - описание канала
  channelLink - ссылка на канал в telegram
  channelType - тип канала
  cardViews - количество просмотров страницы канала
  cardFavorite - количество сохранений в избранное страницы канала
  priceType - тип услуги 
      24: 1 час в топе / 24 часа в ленте
      48: 2 часа в топе / 48 часов в ленте
      72: 3 часа в топе / 72 часа в ленте
      native: проект публикуется навсегда с удержанием 1 час в топе
      eternal: проект публикуется навсегда с удержанием 3 часа в топе
      repost: публикуется по формату 1/24 в другом канале с удержанием не менее, чем на 1 час в топе
  postReach - среднее количество просмотров рекламного поста
  cpv - расчетная стоимость одного просмотра рекламного поста
  err_percent - расчетный процент подписчиков, которые просмторят рекласную публикацию
  price - стоимость
  reviewsCount - количество отзывов на рекламу в канале
  reviewsRating - рейтинг канала на telega.in
  channelRating - рейтинг канала по отзывам на рекламу
  orders - количество выполненных рекламных компаний
  subscribers - количество подписчиков канала
  postPerDay - среднее количество постов в день
*/

export async function parser_data_channelPrice(link, PAGE) {
  const data = { link };

  console.log(`Открытие страницы канала ${link}`);
  const response = await PAGE.goto(link);

  if (!response.ok()) {
    console.log(`!_MINOR_PARSING_ERROR: невозможно открыть страницу ${link}`);
    return data;
  }

  await PAGE.waitForLoadState('load');
  console.log('Страница канала загружена, начинаем парсинг данных');

  const $ = load(await PAGE.content());

  // Парсинг блока с описанием канала
  data.name = $('.channel-name').text();
  data.description = $('.about-description').text().replace(/\n/g, ' ');
  data.channelLink = $('.about a.about-link').attr('href');
  data.channelType = $('.about-info span:contains("Вид ссылки:")')
    .parent()
    .text()
    .replace('Вид ссылки:', '');
  data.cardViews = parseNumericValue(
    $('.channel-info .about-head-view:first-of-type').text()
  );
  data.cardFavorite = parseNumericValue($('.channel-info .total_count').text());

  // Парсинг блока с ценами
  data.prices = $('.buy .js_change_placement_format li[data-price]')
    .map((i, el) => {
      const priceType = $(el).attr('data-value');
      const postReach = parseNumericValue($(el).attr('data-avg-post-reach'));
      const cpv = parseNumericValue($(el).attr('data-cpv'));
      const err_percent = parseNumericValue($(el).attr('data-err-percent'));
      const price = parseNumericValue($(el).attr('data-price'));
      return { priceType, postReach, cpv, err_percent, price };
    })
    .toArray();

  // Парсинг блока с отзывами
  data.reviewsCount = parseNumericValue($('.raiting > span').text());

  // Парсинг блока со статистикой
  const statisticBlock = $('.statistic');
  data.reviewsRating = parseNumericValue(
    statisticBlock.find('.color-caprion:contains("Рейтинг") + div').text()
  );
  data.channelRating = parseNumericValue(
    statisticBlock
      .find('.color-caprion:contains("Оценка отзывов") + div')
      .text()
  );
  data.orders = parseNumericValue(
    statisticBlock
      .find('.color-caprion:contains("Выполнено заявок") + div')
      .text()
  );
  data.subscribers = parseNumericValue(
    statisticBlock.find('.color-caprion:contains("Подписчики:") + div').text()
  );
  data.postPerDay = parseNumericValue(
    statisticBlock
      .find('.color-caprion:contains("Публикаций в день:") + div')
      .text()
  );

  console.log('Данные успешно извлечены :)');

  return data;
}
