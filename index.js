import { chromium } from 'playwright';
import { parser_channelData } from './Telega_in/READY_parser_channelData.js';

(async () => {
  const BROWSER = await chromium.launch();
  const PAGE = await BROWSER.newPage();

  let data;
  try {
    data = await parser_channelData(
      'https://telega.in/channels/meow_meow_cute/card',
      PAGE
    );
  } catch (error) {
    console.error(error);
  }

  console.log(data);
  await BROWSER.close();
})();
