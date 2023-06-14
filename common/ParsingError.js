export class ParsingError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ParsingError';
  }
}
