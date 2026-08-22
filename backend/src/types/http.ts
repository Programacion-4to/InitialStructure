export type HttpErrorCode = 'BAD_REQUEST' | 'NOT_FOUND' | 'CONFLICT' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'INTERNAL'

export class AppError extends Error {
  statusCode: number
  code: HttpErrorCode

  constructor(message: string, statusCode = 500, code: HttpErrorCode = 'INTERNAL') {
    super(message)
    this.statusCode = statusCode
    this.code = code
  }
}
