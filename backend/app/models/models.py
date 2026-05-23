import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.db.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Enquiry(Base):
    __tablename__ = "enquiries"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    customer_name = Column(String, nullable=False)
    channel = Column(String, nullable=False)  # whatsapp, email, call
    message = Column(Text, nullable=False)
    status = Column(String, nullable=False, default="new")  # new, qualified, escalated
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    sop_matches = relationship("SOPMatch", back_populates="enquiry", cascade="all, delete-orphan")
    followups = relationship("FollowUp", back_populates="enquiry", cascade="all, delete-orphan")
    events = relationship("Event", back_populates="enquiry", cascade="all, delete-orphan")

class SOPMatch(Base):
    __tablename__ = "sop_matches"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    enquiry_id = Column(String, ForeignKey("enquiries.id", ondelete="CASCADE"), nullable=False)
    sop_label = Column(String, nullable=False)
    suggested_response = Column(Text, nullable=False)
    matched_keywords = Column(JSON, nullable=True)  # stores list of matched keywords
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    enquiry = relationship("Enquiry", back_populates="sop_matches")

class FollowUp(Base):
    __tablename__ = "followups"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    enquiry_id = Column(String, ForeignKey("enquiries.id", ondelete="CASCADE"), nullable=False)
    delay_in_minutes = Column(Integer, nullable=False)
    message_template = Column(Text, nullable=True)
    status = Column(String, nullable=False, default="pending")  # pending, executed
    scheduled_for = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    enquiry = relationship("Enquiry", back_populates="followups")

class Event(Base):
    __tablename__ = "events"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    enquiry_id = Column(String, ForeignKey("enquiries.id", ondelete="CASCADE"), nullable=False)
    event_type = Column(String, nullable=False)  # enquiry_created, task_processed, sop_matched, followup_created, escalation_triggered, error
    payload = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    enquiry = relationship("Enquiry", back_populates="events")
