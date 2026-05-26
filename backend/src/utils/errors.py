class AppError(Exception):
    status_code: int = 500
    message: str = "Internal error"

    def __init__(self, message: str | None = None, **extra):
        if message:
            self.message = message
        self.extra = extra
        super().__init__(self.message)


class BadRequestError(AppError):
    status_code = 400
    message = "Bad request"


class UnauthorizedError(AppError):
    status_code = 401
    message = "Unauthorized"


class ForbiddenError(AppError):
    status_code = 403
    message = "Forbidden"


class NotFoundError(AppError):
    status_code = 404
    message = "Resource not found"


class ConflictError(AppError):
    status_code = 409
    message = "Conflict"


class LockedError(AppError):
    status_code = 423
    message = "Locked"


class ValidationError(AppError):
    status_code = 422
    message = "Validation error"
