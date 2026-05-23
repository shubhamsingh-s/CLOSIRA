from datetime import datetime
from typing import List, Literal, Optional, Any
from pydantic import BaseModel, Field, field_validator

class EnquiryCreate(BaseModel):
    channel: Literal["whatsapp", "email", "call"]
    customer_name: str = Field(..., min_length=1, max_length=100)
    message: str = Field(..., min_length=1, max_length=5000)

    @field_validator("customer_name")
    @classmethod
    def name_must_not_be_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("customer_name cannot be empty or whitespaces only")
        return v.strip()

    @field_validator("message")
    @classmethod
    def message_must_not_be_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("message cannot be empty or whitespaces only")
        return v.strip()

class EnquiryCreateResponse(BaseModel):
    enquiry_id: str
    status: str
    message: str

class EnquiryResponse(BaseModel):
    id: str
    customer_name: str
    channel: str
    message: str
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class FollowUpCreate(BaseModel):
    delay_in_minutes: int = Field(..., gt=0, description="Delay in minutes must be greater than 0")
    message_template: Optional[str] = Field(None, max_length=1000)

    @field_validator("message_template")
    @classmethod
    def message_template_must_not_be_blank(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.strip():
            raise ValueError("message_template cannot be empty or whitespaces only")
        return v.strip() if v is not None else None

class FollowUpResponse(BaseModel):
    id: str
    enquiry_id: str
    delay_in_minutes: int
    message_template: Optional[str]
    status: str
    scheduled_for: datetime
    created_at: datetime

    class Config:
        from_attributes = True

class EscalateCreate(BaseModel):
    reason: str = Field(..., min_length=1, max_length=1000)

    @field_validator("reason")
    @classmethod
    def reason_must_not_be_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("reason cannot be empty or whitespaces only")
        return v.strip()

class SOPMatchResponse(BaseModel):
    id: str
    enquiry_id: str
    sop_label: str
    suggested_response: str
    matched_keywords: Optional[List[str]]
    created_at: datetime

    class Config:
        from_attributes = True

class EventResponse(BaseModel):
    id: str
    enquiry_id: str
    event_type: str
    payload: Optional[Any]
    created_at: datetime

    class Config:
        from_attributes = True

class EnquiryHistoryResponse(BaseModel):
    enquiry: EnquiryResponse
    sop_matches: List[SOPMatchResponse]
    followups: List[FollowUpResponse]
    events: List[EventResponse]
