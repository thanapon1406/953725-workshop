export class DomainError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(400, message);
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = 'authentication required') {
    super(401, message);
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = 'forbidden') {
    super(403, message);
  }
}

export class NotFoundError extends DomainError {
  constructor(message: string) {
    super(404, message);
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super(409, message);
  }
}
