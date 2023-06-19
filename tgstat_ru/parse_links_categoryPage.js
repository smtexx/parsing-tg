import PirateParser from '../common/PirateParser.js';
import { writeJSON } from '../common/writeJSON.js';
import { parser_categoryLinks } from './parser_categoryLinks.js';
import * as path from 'path';

/**
 * Парсер извлекает ссылки на страницы с темами телеграм каналов
 * на tgstat.ru
 * ЗАПУСКАТЬ ИЗ INDEX.JS !!!
 *
 */

export async function parsing_script_topics() {
  const readyDest = path.join('parsed_data', 'tgstat_ru', 'links');

  const PARSER = new PirateParser({
    parsingFn: parser_categoryLinks,
    saveDataFn: async (data) => {
      writeJSON('categoryPage', readyDest, data);
    },
    streams: 1,
    headless: true,
  });

  PARSER.fillStack(['']);
  await PARSER.init();
  await PARSER.parse();
}
