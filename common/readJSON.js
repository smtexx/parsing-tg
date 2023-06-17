import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Функция для чтения файлов в формате JSON,
 *
 * @param {string} name - имя json файла с расширением или без
 * @param {string} dest - расположение директории файла
 */

export async function readJSON(name, dest) {
  const extention = '.json';
  const baseName = name.endsWith(extention)
    ? name.replace(extention, '')
    : name;
  const fullName = baseName + extention;

  console.log(`Чтение файла ${fullName} из ${dest}`);

  let dir = [];
  try {
    dir = await fs.readdir(dest);
  } catch (error) {
    console.log(`Директория ${dest} отсутствует`);
    throw new Error(`Directory ${dest} is missing`);
  }

  if (dir.includes(fullName)) {
    console.log('Файл найден, читаем...');
    try {
      const fileDataString = await fs.readFile(path.join(dest, fullName));

      if (fileDataString === '') {
        console.log(`Файл ${fullName} не содержит данных`);
        throw new Error(`File ${fullName} is empty`);
      } else {
        console.log(`Файл ${fullName} прочитан :)`);
        return JSON.parse(fileDataString);
      }
    } catch (error) {
      console.log(`Ошибка чтения файла ${fullName} в ${dest}`);
      throw error;
    }
  } else {
    console.log(`Файл ${fullName} не найден в ${dest}`);
    throw new Error(`File ${fullName} is missing in ${dest}`);
  }
}
