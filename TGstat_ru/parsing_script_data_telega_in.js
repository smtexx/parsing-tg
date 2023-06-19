import PirateParser from '../common/PirateParser.js';
import { readJSON } from '../common/readJSON.js';
import { writeJSON } from '../common/writeJSON.js';
import { getRawFiles } from '../common/getRawFiles.js';
import { parser_commonStat } from './parser_commonStat.js';
import * as path from 'path';
import { useColorLogs } from '../common/useColorLogs.js';

/**
 * Парсер извлекает данные телеграм каналов с tgstat.ru
 * в по ссылкам с parsed_data\telega_in\links_to_data
 * ЗАПУСКАТЬ ИЗ INDEX.JS !!!
 *
 */
useColorLogs();

export async function parse() {
  const sourceDest = path.join('parsed_data', 'telega_in', 'links_to_data');
  const readyDest = path.join('parsed_data', 'tgstat_ru', 'data');

  const rawFiles = await getRawFiles(sourceDest, readyDest);

  for (let i = 0; i < rawFiles.length; i++) {
    const fileName = rawFiles[i];

    console.log('');
    console.log('');
    console.log(
      `Обработка файла ${fileName}. Осталось файлов: ${
        rawFiles.length - 1 - i
      }`.colorLog('blue')
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
      delay: 500,
    });

    PARSER.fillStack(channelIDs);

    await PARSER.init();
    await PARSER.parse();
  }
}
