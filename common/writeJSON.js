import { randomUUID } from 'node:crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Функция для сохранения объекта данных в файл в формате JSON,
 * если файл с аналогичным названием уже существует
 * добавляет к имени файла уникальную метку типа
 *
 * @param {string} name - имя нового файла без расширения
 * @param {string} dest - путь к директории для записи файла
 * @param {object} data - объект данных для записи в файл
 */

export async function writeJSON(name, dest, data) {
  const extention = '.json';
  const baseName = name.endsWith(extention)
    ? name.replace(extention, '')
    : name;
  let fullName = baseName + extention;

  console.log(`Запись файла ${fullName} в ${dest}`);

  let dir = [];
  try {
    dir = await fs.readdir(dest);
  } catch (error) {
    console.log(`Директория ${dest} отсутствует`);
    console.log(`Создание директории ${dest}`);
    await fs.mkdir(dest);
  }

  if (dir.includes(fullName)) {
    console.log(`Файл ${fullName} уже существует в ${dest}`);
    fullName = `${baseName}_${randomUUID().slice(0, 8)}.json`;
    console.log(`Файл будет сохранен как ${fullName}`);
  }

  console.log('Запись файла...');
  await fs.writeFile(path.join(dest, fullName), JSON.stringify(data));
  console.log(`Файл ${fullName} успешно записан в ${dest}`);
}
