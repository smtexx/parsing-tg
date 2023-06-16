import { chromium } from 'playwright';

export default class PirateParser {
  #stack = [];
  #parsedData = [];
  #parsingFn;
  #authFn;
  #onCompleted;
  #streams;
  #BROWSER;
  #startTime;
  #stackLength;

  constructor(parsingFn, onCompleted, streams = 1, authFn) {
    if (!parsingFn || !onCompleted || !streams) {
      throw new PirateParserError('Unable to create parser without argument');
    }

    this.#parsingFn = parsingFn;
    this.#authFn = authFn;
    this.#onCompleted = onCompleted;
    this.#streams = streams;

    console.log('');
    console.log('');
    console.log('');
    console.log('☠-☠-☠-☠-☠-☠-☠-☠   PirateParser       ☠-☠-☠-☠-☠-☠-☠-☠');
  }

  async #startStream() {
    let PAGE = await this.#BROWSER.newPage();

    // Authorization
    if (this.#authFn) {
      PAGE = await this.#authFn(PAGE);
    }

    while (this.#stack.length !== 0) {
      const item = this.#stack.pop();
      let dataPart;

      try {
        dataPart = await this.#parsingFn(item, PAGE);
      } catch (error) {
        console.log(`PirateParser: ${error.message}`);
      }

      this.#parsedData.push(dataPart);
      console.log(`PirateParser: осталось ссылок - ${this.#stack.length}`);
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
    console.log('☠-☠-☠-☠-☠-☠-☠-☠   Поднять паруса!    ☠-☠-☠-☠-☠-☠-☠-☠');
    this.#startTime = Date.now();

    // Start streams
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

    await this.#onCompleted(this.#parsedData);
    console.log(
      `PirateParser: средняя скорость парсинга: ${
        (Date.now() - this.#startTime) / this.#stackLength / 1000
      } секунд`
    );
    console.log('☠-☠-☠-☠-☠-☠-☠-☠   Встать на якорь!   ☠-☠-☠-☠-☠-☠-☠-☠');
  }
}

class PirateParserError extends Error {
  constructor(name) {
    super(name);
    this.name = 'PirateParserError';
  }
}
