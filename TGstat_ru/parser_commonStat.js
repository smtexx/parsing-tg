import { load } from 'cheerio';
import { parseNumericValue } from '../common/parseNumericValue.js';
import { ParsingError } from '../common/ParsingError.js';
import {
  INJECTED_SELECTOR,
  INJECTED_SELECTOR_ATTRIBUTE,
  injectMarker,
} from '../common/injectMarker.js';

/**
 * Парсер извлекает данные из https://tgstat.ru/channel/@${channelID}/stat.
 * Если телеграм канала нет в базе данных TGstat парсер возвращает пустой объект.
 *
 * @param {string} channelID - уникальный идентификатор телеграм канала без символа @
 * @param {import('playwright').Page} PAGE - объект страницы браузера из пакета playwright
 */

/* Описание извлекаемых данных
    subscribers - количество подписчиков на канале
    subscribersDaily_trend - баланс подписчиков за сутки
    subscribersweekly_trend - недельный баланс подписчиков
    subscribersMonthly_trend - месячный баланс абонента
    citationIndex - индекс цитируемости канала в других каналах ТГ
    channelMentions - упоминания канала в других каналах ТГ
    postMentions - упоминания постов с канала в других каналах ТГ
    reposts - репосты с канала в другие каналы ТГ
    mediumPostReach - среднее количество просмотров одного поста
    err_percent - средний процент подписчиков, прочитавших пост
    err24_percent - средний процент подписчиков, прочитавших пост за 24 часа
    mediumAdsPostReach - среднее количество просмотров рекламного поста
    adsReach_12h - среднее количество просмотров рекламного поста за 12 часов
    adsReach_24h - среднее количество просмотров рекламного поста за 24 часа
    adsReach_48h - среднее количество просмотров рекламного поста за 48 часов
    channelAge - возраст канала
    channelCreated - дата создания канала
    totalPosts - общее количество постов на канале
    postsPerDay — количество постов, опубликованных за последние 24 часа
    postsPerWeek — количество постов, опубликованных за последнюю неделю
    postsPerMonth — количество постов, опубликованных за последний месяц
    involvement_percent - процент подписчиков, которые отреагировали на пост за 30 дней
    subscribersRepost - количество подписчиков, сделавших репост за 30 дней
    subscribersComment - количество подписчиков, написавших комментарий за 30 дней
    subscribersReact - количество подписчиков, оставивших реакцию за 30 дней
    male_percent - процент мужчин среди подписчиков
    female_percent - процент женщин среди подписчиков
*/

export async function parser_commonStat(channelID, PAGE) {
  const URL = `https://tgstat.ru/channel/@${channelID}/stat`;
  const data = { channelID };

  // Переходим к странице и дожидаемся конца загрузки
  await PAGE.goto(URL);
  await PAGE.waitForLoadState('load');

  // Маркируем страницу
  const CHAT = 'chat';
  const CHANNEL = 'channel';
  const NOT_FOUND = 'not_found';
  const BANNED = 'banned';
  const markers = [
    // Страница содержит контент для парсинга
    { selector: '.modal.show', text: 'Канал не найден', value: NOT_FOUND },
    { selector: '.modal.show', text: 'Доступ ограничен', value: BANNED },
    { selector: '.card.card-body h5', text: 'Гео и язык чата', value: CHAT },
    {
      selector: '.card.card-body h5',
      text: 'Гео и язык канала',
      value: CHANNEL,
    },
  ];
  await PAGE.waitForFunction(injectMarker, markers, { timeout: 0 });

  // Определяем маркер
  const $ = load(await PAGE.content());
  const marker = $(INJECTED_SELECTOR).attr(INJECTED_SELECTOR_ATTRIBUTE);

  // Если канала не найден выбрасываем исключение
  if (marker === NOT_FOUND) {
    throw new ParsingError(`Канал @${channelID} не найден на TGstat.ru`);
  }
  if (marker === BANNED) {
    throw new ParsingError(`Канал @${channelID} забанен на TGstat.ru`);
  }

  const baseSelector = '.card.card-body';

  // Парсинг канала
  if (marker === CHANNEL) {
    // Блок подписчиков
    const subscribersBlock = $(
      baseSelector + ' div:contains("подписчики")'
    ).parent();

    data.subscribers = parseNumericValue(subscribersBlock.find('h2').text());
    data.subscribersDaily_trend = subscribersBlock
      .find('td:contains("сегодня")')
      .prev()
      .text()
      .trim();
    data.subscribersWeekly_trend = subscribersBlock
      .find('td:contains("за неделю")')
      .prev()
      .text()
      .trim();
    data.subscribersMonthly_trend = subscribersBlock
      .find('td:contains("за месяц")')
      .prev()
      .text()
      .trim();

    // Блок цитирования
    const citationBlock = $(
      baseSelector + ' div:contains("индекс цитирования")'
    ).parent();

    data.citationIndex = parseNumericValue(citationBlock.find('h2').text());
    data.channelMentions = parseNumericValue(
      citationBlock.find('td:contains("уп. каналов")').prev().text()
    );
    data.postMentions = parseNumericValue(
      citationBlock.find('td:contains("упоминаний")').prev().text()
    );
    data.reposts = parseNumericValue(
      citationBlock.find('td:contains("репостов")').prev().text()
    );

    // Блок охвата аудитории
    const reachBlock = $(baseSelector + ' div:contains("средний охват")')
      .parent()
      .parent();

    data.averagePostReach = parseNumericValue(reachBlock.find('h2').text());
    data.err_percent = parseNumericValue(
      reachBlock.find(' tr:first-of-type td:contains("ERR")').prev().text()
    );
    data.err24_percent = parseNumericValue(
      reachBlock.find('td:contains("ERR24")').prev().text()
    );

    // Блок рекламного охвата аудитории
    const adsReachBlock = $(baseSelector + ' div:contains("средний рекламный")')
      .parent()
      .parent();

    data.averageAdsPostReach = parseNumericValue(
      adsReachBlock.find('h2').text()
    );
    data.adsReach_12h = parseNumericValue(
      adsReachBlock.find('td:contains("за 12 часов")').prev().text()
    );
    data.adsReach_24h = parseNumericValue(
      adsReachBlock.find('td:contains("за 24 часа")').prev().text()
    );
    data.adsReach_48h = parseNumericValue(
      adsReachBlock.find('td:contains("за 48 часов")').prev().text()
    );

    // Блок возраста канала
    const channelAgeBlock = $(
      baseSelector + ' div:contains("возраст канала")'
    ).parent();

    data.channelAge = channelAgeBlock.find('h2').text().trim();
    data.channelCreated = channelAgeBlock
      .find('span:contains("канал создан")')
      .prev()
      .prev()
      .text()
      .trim();

    // Блок статистики публикаций
    const postCountBlock = $(
      baseSelector + ' div:contains("публикации")'
    ).parent();

    data.totalPosts = parseNumericValue(
      postCountBlock.find('h2:contains("всего")').text()
    );
    data.postsPerDay = parseNumericValue(
      postCountBlock.find('td:contains("вчера")').prev().text()
    );
    data.postsPerWeek = parseNumericValue(
      postCountBlock.find('td:contains("за неделю")').prev().text()
    );
    data.postsPerMonth = parseNumericValue(
      postCountBlock.find('td:contains("за месяц")').prev().text()
    );

    // Блок вовлеченности подписчиков
    const involvementBlock = $(
      baseSelector + ' div:contains("подписчиков (ER)")'
    )
      .parent()
      .parent();

    data.involvement_percent = parseNumericValue(
      involvementBlock.find('h2').text()
    );
    data.subscribersRepost = parseNumericValue(
      involvementBlock.find('td:contains("пересылки")').prev().text()
    );
    data.subscribersComment = parseNumericValue(
      involvementBlock.find('td:contains("комментарии")').prev().text()
    );
    data.subscribersReact = parseNumericValue(
      involvementBlock.find('td:contains("реакции")').prev().text()
    );

    // Блок распределения полов подписчиков
    const genderBlock = $(
      baseSelector + ' div:contains("пол подписчиков")'
    ).parent();

    data.male_percent = parseNumericValue(
      genderBlock.find('span:contains("мужчины")').prev().text()
    );
    data.female_percent = parseNumericValue(
      genderBlock.find('span:contains("женщины")').prev().text()
    );
  }

  // Парсинг чата
  if (marker === CHAT) {
    // Блок подписчиков
    const subscribersBlock = $(baseSelector + ' div:contains("участники")')
      .first()
      .parent();

    data.subscribers = parseNumericValue(subscribersBlock.find('h2').text());
    data.subscribersDaily_trend = subscribersBlock
      .find('td:contains("сегодня")')
      .prev()
      .text()
      .trim();
    data.subscribersWeekly_trend = subscribersBlock
      .find('td:contains("за неделю")')
      .prev()
      .text()
      .trim();
    data.subscribersMonthly_trend = subscribersBlock
      .find('td:contains("за месяц")')
      .prev()
      .text()
      .trim();

    // Блок активных участников
    const membersBlock = $(
      baseSelector + ' div:contains("активные участники")'
    ).parent();

    data.uniqMembersWeek = parseNumericValue(membersBlock.find('h2').text());
    data.uniqMembersDay = parseNumericValue(
      membersBlock.find('td:contains("DAU")').prev().text()
    );
    data.uniqMembersMonth = parseNumericValue(
      membersBlock.find('td:contains("MAU")').prev().text()
    );

    // Блок участников онлайн
    const onlineBlock = $(
      baseSelector + ' div:contains("участники онлайн")'
    ).parent();

    data.onlineNow = parseNumericValue(onlineBlock.find('h2').text());
    data.onlineDay = parseNumericValue(
      onlineBlock.find('td:contains("днем")').prev().text()
    );
    data.onlineNight = parseNumericValue(
      onlineBlock.find('td:contains("ночью")').prev().text()
    );

    // Блок возраста чата
    const channelAgeBlock = $(
      baseSelector + ' div:contains("возраст чата")'
    ).parent();

    data.channelAge = channelAgeBlock.find('h2').text().trim();
    data.channelCreated = channelAgeBlock
      .find('span:contains("чат создан")')
      .prev()
      .prev()
      .text()
      .trim();

    // Блок распределения полов подписчиков
    const genderBlock = $(
      baseSelector + ' div:contains("пол участников")'
    ).parent();

    data.male_percent = parseNumericValue(
      genderBlock.find('span:contains("мужчины")').prev().text()
    );
    data.female_percent = parseNumericValue(
      genderBlock.find('span:contains("женщины")').prev().text()
    );

    // Блок подписчиков
    const messagesBlock = $(
      baseSelector + ' div:contains("сообщения")'
    ).parent();

    data.totalMessages = parseNumericValue(messagesBlock.find('h2').text());
    data.messagesDay = messagesBlock
      .find('td:contains("вчера")')
      .prev()
      .text()
      .trim();
    data.messagesWeek = messagesBlock
      .find('td:contains("за неделю")')
      .prev()
      .text()
      .trim();
    data.messagesMonth = messagesBlock
      .find('td:contains("за месяц")')
      .prev()
      .text()
      .trim();
  }

  return data;
}
