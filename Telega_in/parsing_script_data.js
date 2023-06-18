import PirateParser from '../common/PirateParser.js';
import { readJSON } from '../common/readJSON.js';
import { writeJSON } from '../common/writeJSON.js';
import { getRawFiles } from '../common/getRawFiles.js';
import { parser_channelData } from './parser_channelData.js';
import * as path from 'path';

/**
 * Парсер извлекает данные телеграм каналов с telega.in
 * ЗАПУСКАТЬ ИЗ INDEX.JS !!!
 *
 */

async function parse() {
  const sourceDest = path.join('parsed_data', 'telega_in', 'links_to_data');
  const readyDest = path.join('parsed_data', 'telega_in', 'data');

  const rawFiles = await getRawFiles(sourceDest, readyDest);

  for (let i = 0; i < rawFiles.length; i++) {
    const fileName = rawFiles[i];

    console.log('');
    console.log('');
    console.log(
      `Файл: ${fileName} осталось файлов: ${rawFiles.length - 1 - i}`
    );
    const links = await readJSON(fileName, sourceDest);

    const PARSER = new PirateParser({
      parsingFn: parser_channelData,
      errorHandleFn: async (errors) => {
        writeJSON(`ERRORS_${fileName}`, readyDest, errors);
      },
      saveDataFn: async (data) => {
        writeJSON(fileName, readyDest, data);
      },
      streams: 4,
    });

    PARSER.fillStack(links);

    await PARSER.init();
    await PARSER.parse();
  }
}
