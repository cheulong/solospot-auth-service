export class HttpError extends Error {
  public status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;

    // Required when extending built-ins like Error
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}