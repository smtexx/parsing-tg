import * as path from 'path';
import * as fs from 'fs/promises';
import PirateParser from '../common/PirateParser.js';
import { readJSON } from '../common/readJSON.js';
import { writeJSON } from '../common/writeJSON.js';
import { useColorLogs } from '../common/useColorLogs.js';
import { parser_data_category } from './parsers/parser_data_category.js';

/**
 * Парсер извлекает данные категорий телеграм каналов и чатов с tgstat.ru
 * в по ссылкам с parsed_data\tgstat_ru\links\categoryPage.json
 * ЗАПУСКАТЬ ИЗ INDEX.JS !!!
 *
 */
useColorLogs();

export async function parse_data_category() {
  const sourceDest = path.join('parsed_data', 'tgstat_ru', 'links');
  const readyDest = path.join('parsed_data', 'tgstat_ru', 'data', 'categories');

  const categoryIDs = (await readJSON('categoryPage', sourceDest)).map((link) =>
    link.replace('https://tgstat.ru/', '')
  );
  const parsedCategoryIDs = (await fs.readdir(readyDest)).map((fileName) =>
    fileName.replace('.json', '')
  );
  const categoryIDsToParce = categoryIDs.filter(
    (id) => !parsedCategoryIDs.includes(id)
  );

  for (let i = 0; i < categoryIDsToParce.length; i++) {
    const categoryID = categoryIDsToParce[i];

    console.log('');
    console.log('');
    console.log(
      `Обработка ссылки ${categoryID}. Осталось ссылок: ${
        categoryIDsToParce.length - 1 - i
      }`.colorLog('blue')
    );

    const PARSER = new PirateParser({
      parsingFn: parser_data_category,
      errorHandleFn: async (errors) => {
        await writeJSON(`ERROR_${categoryID}`, readyDest, errors);
      },
      saveDataFn: async (data) => {
        await writeJSON(categoryID, readyDest, data);
      },
      streams: 1,
      headless: false,
    });

    PARSER.fillStack([categoryID]);
    await PARSER.init();
    await PARSER.parse();
  }
}
