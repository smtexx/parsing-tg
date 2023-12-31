import { chromium, firefox, webkit } from 'playwright';
import { useColorLogs } from './useColorLogs.js';

/**
 * Класс парсера данных. Последовательность запуска:
 *  1. Создать объект парсера: new PirateParser(config)
 *  2. Наполнить стек ссылками parser.fillStack(links)
 *  3. Инициализировать парсер: await parser.init()
 *  4. Запустить парсинг данных: await parser.parse()
 *
 */

useColorLogs();

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
  #averageQueue;

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
    this.#delay = delay || 0;
    this.#averageQueue = new CurrentAverage(15);

    if (typeof headless === 'boolean') {
      this.#headless = headless;
    } else {
      this.#headless = true;
    }

    console.log('');
    console.log('');
    console.log('');
    console.log(
      '☠ ☠ ☠ ☠ ☠ ☠ ☠ ☠ ☠ ☠ ☠   PirateParser       ☠ ☠ ☠ ☠ ☠ ☠ ☠ ☠ ☠ ☠ ☠'.colorLog(
        'yellow'
      )
    );
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
        console.log('PirateParser: КАЖЕТСЯ НАС ЗАБАНИЛИ!'.colorLog('red'));
        console.log(
          'Есть только один флаг, и он такой же черный, как наши сердца!'.colorLog(
            'white'
          )
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
        console.log(`⚠ PirateParser: ${error.message}`.colorLog('red'));
      }

      // Обнулить предохранитель, парсинг ссылки прошел успешно
      this.#fuse = 0;

      // Обработать скорость парсинга и выдать лог остатка если стек не пуст
      if (this.#stack.length !== 0) {
        // Добавить длительность в очередь
        this.#averageQueue.push(Date.now() - startTime);
        // Выдать лог
        console.log(
          `PirateParser: ссылок в очереди: ${
            this.#stack.length
          }, осталось времени: ${formatTime(
            (this.#averageQueue.average() * this.#stack.length) / this.#streams
          )}`
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
    console.log(
      '☠ ☠ ☠ ☠ ☠ ☠ ☠ ☠ ☠ ☠ ☠   Поднять паруса!    ☠ ☠ ☠ ☠ ☠ ☠ ☠ ☠ ☠ ☠ ☠'.colorLog(
        'yellow'
      )
    );
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
      } секунд`.colorLog('yellow')
    );
    console.log(
      '☠ ☠ ☠ ☠ ☠ ☠ ☠ ☠ ☠ ☠ ☠   Встать на якорь!   ☠ ☠ ☠ ☠ ☠ ☠ ☠ ☠ ☠ ☠ ☠'.colorLog(
        'yellow'
      )
    );
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

class CurrentAverage {
  #queue = [];
  #queueLength;

  constructor(queueLength) {
    if (!queueLength || typeof queueLength !== 'number') {
      throw new Error('Argument queueLength is missing or has wrong type');
    }

    this.#queueLength = queueLength;
  }

  push(value) {
    if (typeof value !== 'number') {
      throw new Error('Type of pushed value is not a number');
    }

    if (this.#queue.length === this.#queueLength) {
      this.#queue.shift();
    }

    this.#queue.push(value);
  }

  clear() {
    this.#queue = [];
  }

  average() {
    if (this.#queue.length === 0) {
      return 0;
    }

    return this.#queue.reduce((sum, val) => sum + val, 0) / this.#queue.length;
  }
}

function formatTime(ms) {
  const totalSeconds = Math.round(ms / 1000);
  const time = [
    Math.floor(totalSeconds / 3600),
    Math.floor((totalSeconds % 3600) / 60),
    totalSeconds % 60,
  ]
    .map((part) => part.toString())
    .map((part) => (part.length === 1 ? `0${part}` : part));

  return time.join(':');
}
