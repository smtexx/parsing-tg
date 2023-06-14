import { ParsingError } from '../../common/ParsingError.js';

export async function getLinksToChannels(config, PAGE) {
  console.log(`Переходим к странице ${config.topicShort}`);
  await PAGE.goto(config.link);

  // Get total links count
  const countSelector = 'div.channel_count.displayed_count';
  await PAGE.waitForSelector(countSelector);
  const totalLinks = await PAGE.$eval(countSelector, (el) => {
    const totalString = el.lastChild.textContent.match(/(\d+)/);

    if (totalString === null) {
      throw new ParsingError(
        `Unable extract total channels count from ${config.topicShort}`
      );
    }
    return parseInt(totalString);
  });
  console.log(`Обнаружено ссылок на каналы: ${totalLinks}`);

  // Start opening channel links
  console.log('Открываем ссылки на каналы');
  const showMoreSelector = 'div.js_load_content_btn_more';
  async function getShownLinksCount() {
    await PAGE.waitForSelector(countSelector);
    return await PAGE.$eval(countSelector, (el) => {
      const spanEl = el.querySelector('span');
      if (spanEl === null) {
        throw new ParsingError(
          `Unable to find span element with shown channels count from ${config.topicShort}`
        );
      }
      const shownString = spanEl.textContent.match(/(\d+)/);
      if (shownString === null) {
        throw new ParsingError(
          `Unable extract shown channels count from ${config.topicShort}`
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
    // await PAGE.waitForTimeout(2000);
    shownLinks = await getShownLinksCount();
  }
  console.log(`Открыто ${shownLinks} из ${totalLinks}`);
  console.log('Открытие ссылок успешно завершено!');

  // Extract all shown channel links
  return await PAGE.$$eval('div.action-more a[href^="/channels/"]', (channelLinks) =>
    channelLinks.map((a) => a.href)
  );
}
