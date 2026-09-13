/** Typed API error classes — use `instanceof` instead of string-matching error messages. */
export class NotFoundError extends Error {
  constructor(entity: string, id?: string) {
    const msg = id ? `${entity} not found: ${id}` : `${entity} not found`;
    super(msg);
    this.name = "NotFoundError";
  }
}

export class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BadRequestError";
  }
}
