class ApiError(Exception):
    """Raised anywhere; rendered as {error: {code, message, details}}."""

    def __init__(self, status: int, code: str, message: str, details=None):
        self.status, self.code, self.message, self.details = status, code, message, details
