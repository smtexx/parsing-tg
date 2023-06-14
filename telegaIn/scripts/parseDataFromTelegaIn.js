import { load } from 'cheerio';
import { parseNumericValue } from '../../common/parseNumericValue.js';

export async function getDataFromTelegaIn(link, PAGE) {
  // Go to page
  console.log(`Переходим к странице ${link}`);
  await PAGE.goto(link);
  await PAGE.waitForLoadState('load');
  await PAGE.waitForSelector('div.channel-card');

  console.log('Загружаем код HTML для обработки');
  const $ = load(await PAGE.content());

  const data = {
    id: link.match(/(?<=https:\/\/telega\.in\/channels\/)[^\/]+(?=\/card)/)[0],
  };

  // Parse About block
  console.log('Извлекаем данные...');
  data.name = $('.channel-name').text();
  data.description = $('.about-description p').text();
  data.channelLink = $('.about a.about-link').attr('href');
  data.channelType = $('.about-info-item:nth-of-type(3)')
    .text()
    .replace('Вид ссылки:', '');
  data.cardViews = parseNumericValue(
    $('.channel-info .about-head-view:first-of-type').text()
  );
  data.cardFavorite = parseNumericValue($('.channel-info .total_count').text());

  // Parse prices
  data.prices = $('div.buy .js_change_placement_format li[data-price]')
    .map((i, el) => {
      const priceType = $(el).attr('data-value');
      const postReach = parseNumericValue($(el).attr('data-avg-post-reach'));
      const cpv = parseNumericValue($(el).attr('data-cpv'));
      const errPercent = parseNumericValue($(el).attr('data-err-percent'));
      const price = parseNumericValue($(el).attr('data-price'));
      return { priceType, postReach, cpv, errPercent, price };
    })
    .toArray();

  // Parse reviews
  data.reviewsCount = parseNumericValue($('.raiting > span').text());

  // Parse statistic
  data.reviewsRating = parseNumericValue(
    $('.statistic-wrapper-item:nth-of-type(2)').text()
  );
  data.channelRating = parseNumericValue(
    $('.statistic-wrapper-item:nth-of-type(1)').text()
  );
  data.orders = parseNumericValue($('.statistic-wrapper-item:nth-of-type(3)').text());
  data.subscribers = parseNumericValue($('.statistic-block-item:nth-of-type(1)').text());
  data.postPerDay = parseNumericValue($('.statistic-block-item:nth-of-type(4)').text());
  console.log('Данные успешно извлечены :)');

  return data;
}
