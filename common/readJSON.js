import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Функция для чтения файлов в формате JSON,
 *
 * @param {string} name - имя json файла без расширения
 * @param {string} dest - расположение директории файла
 */

export async function readJSON(name, dest) {
  let fileName = `${name}.json`;
  console.log(`Чтение файла ${fileName} из ${dest}`);

  let dir = [];
  try {
    dir = await fs.readdir(dest);
  } catch (error) {
    console.log(`Директория ${dest} отсутствует`);
    throw new Error(`Directory ${dest} is missing`);
  }

  if (dir.includes(fileName)) {
    console.log('Файл найден, читаем...');
    try {
      const fileDataString = await fs.readFile(path.join(dest, fileName));

      if (fileDataString === '') {
        console.log(`Файл ${fileName} не содержит данных`);
        throw new Error(`File ${fileName} is empty`);
      } else {
        console.log(`Файл ${fileName} прочитан :)`);
        return JSON.parse(fileDataString);
      }
    } catch (error) {
      console.log(`Ошибка чтения файла ${fileName} в ${dest}`);
      throw error;
    }
  } else {
    console.log(`Файл ${fileName} не найден в ${dest}`);
    throw new Error(`File ${fileName} is missing in ${dest}`);
  }
}
