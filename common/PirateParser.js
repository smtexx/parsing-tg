import { chromium, firefox, webkit } from 'playwright';

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
  #headless;
  #delay;
  #fuse = 0;

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
   * @property {boolean} headless - запустить ли браузер без графического интерфейса
   * @property {number} delay - пауза между запросами парсинга
   *
   * @param {Config} config - объект конфигурации создаваемого парсера
   *
   */
  constructor({
    parsingFn,
    saveDataFn,
    authFn,
    errorHandleFn,
    streams,
    headless,
    delay,
  }) {
    if (!parsingFn || !saveDataFn) {
      throw new PirateParserError('Unable to create parser without argument');
    }

    this.#parsingFn = parsingFn;
    this.#saveDataFn = saveDataFn;
    this.#authFn = authFn;
    this.#errorHandleFn = errorHandleFn;
    this.#streams = streams || 1;
    this.#headless = headless && true;
    this.#delay = delay || 0;

    console.log('');
    console.log('');
    console.log('');
    console.log('X-X-X-X-X-X-X-X   PirateParser       X-X-X-X-X-X-X-X');
  }

  async #startStream() {
    let PAGE = await this.#BROWSER.newPage();

    // Авторизация
    if (this.#authFn) {
      PAGE = await this.#authFn(PAGE);
    }

    // Запуск цикла парсинга
    while (this.#stack.length !== 0) {
      // Если значение предохранителя больше 15 отключить парсинг
      if (this.#fuse >= 15) {
        console.log('PirateParser: КАЖЕТСЯ НАС ЗАБАНИЛИ!');
        console.log(
          'Есть только один флаг, и он такой же черный, как наши сердца!'
        );
        throw new PirateParserError('You are banned :(((');
      }

      const startTime = Date.now();
      const item = this.#stack.pop();

      console.log(`PirateParser: парсинг ${item}`);

      try {
        const dataPart = await this.#parsingFn(item, PAGE);
        this.#parsedData.push(dataPart);
      } catch (error) {
        // Увеличить предохранитель на единицу
        this.#fuse++;
        this.#errorStack.push(item);
        console.log(`PirateParser: ${error.message}`);
      }

      // Обнулить предохранитель, парсинг ссылки прошел успешно
      this.#fuse = 0;

      // Выдать лог остатка если стек не пуст
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

      // Отработать задержку, если она установлена
      if (this.#delay !== 0) {
        await PAGE.waitForTimeout(this.#delay);
      }
    }

    await PAGE.close();
  }

  /**
   * Инициализирует парсер, создает экземпляр браузера
   */
  async init() {
    // Выбор типа запускаемого браузера - с головой или без
    let BROWSER = this.#headless
      ? await firefox.launch()
      : await firefox.launch({ headless: false });

    this.#BROWSER = await BROWSER.newContext({
      locale: 'ru-RU',
    });
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

    // Начать парсинг
    console.log('X-X-X-X-X-X-X-X   Поднять паруса!    X-X-X-X-X-X-X-X');
    this.#startTime = Date.now();

    // Запустить потоки
    console.log(
      `PirateParser: количество парралельных потоков парсинга: ${this.#streams}`
    );
    await Promise.all(
      Array(this.#streams)
        .fill(null)
        .map(() => this.#startStream())
    );

    // Парсинг завершен
    await this.#BROWSER.close();

    // Если был выполнен парсинг одного элемента и это массив - развернуть его
    if (this.#parsedData.length === 1 && Array.isArray(this.#parsedData[0])) {
      this.#parsedData = this.#parsedData.flat();
    }

    // При необходимости, обработать ошибки
    if (this.#errorHandleFn && this.#errorStack.length !== 0) {
      await this.#errorHandleFn(this.#errorStack);
    }

    // Сохранить данные
    await this.#saveDataFn(this.#parsedData);

    // Бенчмарк
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

// В конфиге добавить возможность паузы и отключения безголового режима
// Добавить очередь ошибок отключающую парсинг при превышении количества запросов
