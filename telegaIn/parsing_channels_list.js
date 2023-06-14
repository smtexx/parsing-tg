import * as fs from 'fs/promises';
import * as path from 'path';
import { chromium } from 'playwright';
import { login } from './scripts/login.js';
import { getLinksToTopicPages } from './scripts/getLinksToTopicPages.js';
import { getLinksToChannels } from './scripts/getLinksToChannels.js';

const URL = 'https://telega.in';
const LOGIN = 'testing_001@rambler.ru';
const PASSWORD = 'sgtcmcar';

(async () => {
  // Launch browser
  const BROWSER = await chromium.launch();
  const PAGE = await BROWSER.newPage();
  await PAGE.goto(URL);

  // Log in and go to channels catalog
  try {
    await login(PAGE, LOGIN, PASSWORD);
  } catch (error) {
    await BROWSER.close();
    console.log('!!!_CRITICAL_PARSING_ERROR: ошибка при авторизации!');
    throw error;
  }
  await PAGE.goto(`${URL}/catalog`);

  // Get links to pages with filtered channels
  let pageLinkConfigs;
  try {
    pageLinkConfigs = await getLinksToTopicPages(PAGE);
  } catch (error) {
    await BROWSER.close();
    console.log(
      '!!!_CRITICAL_PARSING_ERROR: ошибка извлечения ссылок на страницы с каналами!'
    );
    throw error;
  }

  // Start extract links to channels from pages
  for (let pageConfig of pageLinkConfigs) {
    try {
      const channelLinks = await getLinksToChannels(pageConfig, PAGE);
      pageConfig.channelLinks = channelLinks;
    } catch (error) {
      pageConfig.channelLinks = [];
      console.log(
        `!_MINOR_PARSING_ERROR: ссылки на каналы темы ${pageConfig.topicShort} не извлечены!`
      );
      console.error(error);
    }
  }

  // Записать json со ссылками на диск
  try {
    const dest = path.join('telegaIn', 'parsed_data', 'channels_list.json');
    console.log(`Записываем данные на диск: ${dest}`);
    fs.writeFile(dest, JSON.stringify(pageLinkConfigs));
    console.log(`Данные записаны в ${dest}`);
    console.log('!!!_SUCCESS: работа выполнена, мои поздравления!');
  } catch (error) {
    console.log('!!!_CRITICAL_PARSING_ERROR: ошибка при записи данных на диск!');
    console.error(error);
  }

  await BROWSER.close();
})();
