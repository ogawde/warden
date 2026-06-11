export class ResourceNotFoundError extends Error {
  constructor(message = "Not found") {
    super(message);
    this.name = "ResourceNotFoundError";
  }
}
