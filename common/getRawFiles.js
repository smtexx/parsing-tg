import * as fs from 'fs/promises';

/**
 * Функция принимает на вход путь к директории с исходными файлами,
 * и путь к директории с обработанными файлами, возвращает массив с
 * именами файлов, отсутствующих среди обработанных
 *
 * @param {string} sourceDest - путь к директории с исходными файлами
 * @param {string} readyDest - путь к директории с обработанными файлами
 */

export async function getRawFiles(sourceDest, readyDest) {
  let sourceFiles, readyFiles;

  try {
    sourceFiles = await fs.readdir(sourceDest);
  } catch (error) {
    console.log(`Директория ${sourceDest} отсутствует`);
    throw new Error(`Directory ${sourceDest} is missing`);
  }

  try {
    readyFiles = await fs.readdir(readyDest);
  } catch (error) {
    console.log(`Директория ${readyDest} отсутствует`);
    throw new Error(`Directory ${readyDest} is missing`);
  }

  return sourceFiles.filter((file) => !readyFiles.includes(file));
}
