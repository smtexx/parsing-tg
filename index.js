import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs/promises';
import axios from 'axios';
import { load } from 'cheerio';
import { parse_data_category } from './tgstat_ru/parse_data_category.js';
import { parser_data_category } from './tgstat_ru/parsers/parser_data_category.js';
import fetch from 'node-fetch';

(async () => {
  await parse_data_category();

  // const BROWSER = await chromium.launch({ headless: false });
  // const PAGE = await BROWSER.newPage();
  // const data = await parser_data_category('courses', PAGE);
  // console.log(data);
  // await BROWSER.close();
})();
