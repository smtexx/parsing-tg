import { chromium } from 'playwright';

/**
 * Класс парсера данных. Последовательность запуска:
 *  1. Создать объект парсера: new PirateParser(config)
 *  2. Наполнить стек ссылками parser.fillStack(links)
 *  3. Инициализировать парсер: await parser.init()
 *  4. Запустить парсинг данных: await parser.parse()
 *
 */

export default class PirateParser {
  #stack = [];
  #parsedData = [];
  #parsingFn;
  #authFn;
  #saveDataFn;
  #streams;
  #BROWSER;
  #startTime;
  #stackLength;
  #errorHandleFn;
  #errorStack = [];

  /**
   * Создать экземпляр парсера
   *
   * @typedef {import('playwright').Page} PAGE *
   * @typedef {Object} Config
   * @property {(item: string, PAGE: PAGE) => Promise<any>} parsingFn - функция для парсинга данных
   * @property {(data: any[]) => Promise<undefined>} saveDataFn - функция для обработки данных, полученными в ходе парсинга
   * @property {(PAGE: PAGE) => Promise<PAGE>} authFn - функция авторизации в ходе парсинга
   * @property {(errors: any[]) => Promise<undefined>} errorHandleFn - функция для обработки ошибок, возникших при парсинге
   * @property {number} streams - количество паралельных потоков парсинга
   *
   * @param {Config} config - объект конфигурации создаваемого парсера
   *
   */
  constructor({ parsingFn, saveDataFn, authFn, errorHandleFn, streams }) {
    if (!parsingFn || !saveDataFn) {
      throw new PirateParserError('Unable to create parser without argument');
    }

    this.#parsingFn = parsingFn;
    this.#saveDataFn = saveDataFn;
    this.#authFn = authFn;
    this.#errorHandleFn = errorHandleFn;
    this.#streams = streams || 1;

    console.log('');
    console.log('');
    console.log('');
    console.log('X-X-X-X-X-X-X-X   PirateParser       X-X-X-X-X-X-X-X');
  }

  async #startStream() {
    let PAGE = await this.#BROWSER.newPage();

    // Authorization
    if (this.#authFn) {
      PAGE = await this.#authFn(PAGE);
    }

    while (this.#stack.length !== 0) {
      const startTime = Date.now();

      const item = this.#stack.pop();
      let dataPart;

      try {
        dataPart = await this.#parsingFn(item, PAGE);
      } catch (error) {
        this.#errorStack.push(item);
        console.log(`PirateParser: ${error.message}`);
      }

      this.#parsedData.push(dataPart);

      if (this.#stack.length !== 0) {
        console.log(
          `PirateParser: ссылок в очереди: ${
            this.#stack.length
          }, примерно осталось минут: ${
            Math.round(
              ((Date.now() - startTime) * this.#stack.length) /
                this.#streams /
                6000
            ) / 10
          }`
        );
      }
    }

    await PAGE.close();
  }

  /**
   * Инициализирует парсер, создает экземпляр браузера
   */
  async init() {
    this.#BROWSER = await chromium.launch();
  }

  /**
   * Наполняет стек парсера ссылками для парсинга
   * @param {string[]} links - массив с сылками для парсинга
   */
  fillStack(links) {
    this.#stack = [...new Set(links)];
    this.#stackLength = this.#stack.length;
  }

  /**
   * Запускает парсинг ссылок из внутреннего стека
   */
  async parse() {
    if (this.#stack.size === 0) {
      throw new PirateParserError('Stack is empty');
    }
    if (!this.#BROWSER) {
      throw new PirateParserError('Parser is not initialized');
    }

    // Start parsing
    console.log('X-X-X-X-X-X-X-X   Поднять паруса!    X-X-X-X-X-X-X-X');
    this.#startTime = Date.now();

    // Start streams
    console.log(
      `PirateParser: количество парралельных потоков парсинга: ${this.#streams}`
    );
    await Promise.all(
      Array(this.#streams)
        .fill(null)
        .map(() => this.#startStream())
    );

    // Parsing is done
    await this.#BROWSER.close();

    // Flat data if there is only one element
    if (this.#parsedData.length === 1) {
      this.#parsedData = this.#parsedData.flat();
    }

    // Run error handler, if #errorStack has records
    if (this.#errorStack.length !== 0) {
      await this.#errorHandleFn(this.#errorStack);
    }

    await this.#saveDataFn(this.#parsedData);
    console.log(
      `PirateParser: средняя скорость парсинга: ${
        Math.round((Date.now() - this.#startTime) / this.#stackLength / 10) /
        100
      } секунд`
    );
    console.log('X-X-X-X-X-X-X-X   Встать на якорь!   X-X-X-X-X-X-X-X');
  }
}

class PirateParserError extends Error {
  constructor(name) {
    super(name);
    this.name = 'PirateParserError';
  }
}
