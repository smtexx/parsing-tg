import { chromium } from 'playwright';
import { getDataFromTelegaIn } from './scripts/getDataFromTelegaIn.js';

(async () => {
  const BROWSER = await chromium.launch();
  const PAGE = await BROWSER.newPage();

  await BROWSER.close();
})();
