import PirateParser from '../common/PirateParser.js';
import { readJSON } from '../common/readJSON.js';
import { writeJSON } from '../common/writeJSON.js';
import { getRawFiles } from '../common/getRawFiles.js';
import { parser_commonStat } from './parser_commonStat.js';
import * as path from 'path';

/**
 * Парсер извлекает данные телеграм каналов с tgstat.ru
 * в по ссылкам с parsed_data\telega_in\links_to_data
 * ЗАПУСКАТЬ ИЗ INDEX.JS !!!
 *
 */

export async function parse() {
  const sourceDest = path.join('parsed_data', 'telega_in', 'links_to_data');
  const readyDest = path.join('parsed_data', 'tgstat_ru', 'data');

  const rawFiles = await getRawFiles(sourceDest, readyDest);

  for (let i = 0; i < rawFiles.length; i++) {
    const fileName = rawFiles[i];

    console.log('');
    console.log('');
    console.log(
      `Файл: ${fileName} осталось файлов: ${rawFiles.length - 1 - i}`
    );
    const links = await readJSON(fileName, sourceDest);
    const channelIDs = links.map(
      (link) =>
        link.match(/https:\/\/telega\.in\/channels\/[+@]?([^\/]+)\/card/)[1]
    );

    const PARSER = new PirateParser({
      parsingFn: parser_commonStat,
      errorHandleFn: async (errors) => {
        writeJSON(`ERRORS_${fileName}`, readyDest, errors);
      },
      saveDataFn: async (data) => {
        writeJSON(fileName, readyDest, data);
      },
      streams: 1,
      headless: false,
      delay: 2000,
    });

    PARSER.fillStack(channelIDs);

    await PARSER.init();
    await PARSER.parse();
  }
}
