from fastapi import HTTPException, status

class ComplaintNotFoundException(HTTPException):
    def __init__(self, complaint_id: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint with ID or number '{complaint_id}' not found."
        )

class InvalidLocationException(HTTPException):
    def __init__(self, message: str = "Invalid coordinates. Latitude must be between -90 and 90, Longitude between -180 and 180."):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )

class AIServiceException(HTTPException):
    def __init__(self, detail: str = "Error executing AI pipeline step."):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail
        )
