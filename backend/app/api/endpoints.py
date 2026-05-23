import logging
from typing import List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.db.database import get_db
from app.models import models
from app.schemas import schemas
from app.services.enquiry_service import process_enquiry_background

logger = logging.getLogger("closira.endpoints")

router = APIRouter()

def process_enquiry_wrapper(enquiry_id: str):
    """Wrapper function to instantiate a fresh database session inside the async background task."""
    from app.db.database import SessionLocal
    db = SessionLocal()
    try:
        process_enquiry_background(db, enquiry_id)
    finally:
        db.close()

@router.post("/enquiry", response_model=schemas.EnquiryCreateResponse, status_code=201, 
             summary="Create a new inbound enquiry",
             description="Submit a new enquiry from whatsapp, email, or call. This endpoint returns immediately and registers an async background task to match the enquiry against SOPs.")
def create_enquiry(
    enquiry_in: schemas.EnquiryCreate, 
    background_tasks: BackgroundTasks, 
    db: Session = Depends(get_db)
):
    # Persist enquiry
    enquiry = models.Enquiry(
        customer_name=enquiry_in.customer_name,
        channel=enquiry_in.channel,
        message=enquiry_in.message,
        status="new"
    )
    db.add(enquiry)
    db.flush()  # Generate primary key ID

    # Create event log
    db_event = models.Event(
        enquiry_id=enquiry.id,
        event_type="enquiry_created",
        payload={
            "channel": enquiry.channel, 
            "customer_name": enquiry.customer_name,
            "message_preview": enquiry.message[:60] + "..." if len(enquiry.message) > 60 else enquiry.message
        }
    )
    db.add(db_event)
    db.commit()

    logger.info(
        f"Enquiry created: {enquiry.id}",
        extra={
            "event_type": "enquiry_created",
            "extra_data": {"enquiry_id": enquiry.id, "channel": enquiry.channel}
        }
    )

    # Queue background task for SOP processing
    background_tasks.add_task(process_enquiry_wrapper, enquiry.id)

    return schemas.EnquiryCreateResponse(
        enquiry_id=enquiry.id,
        status="queued",
        message="Enquiry received and queued for background processing"
    )

@router.post("/enquiry/{id}/followup", response_model=schemas.FollowUpResponse, status_code=201,
             summary="Schedule a follow-up action",
             description="Schedule a follow-up for a specific enquiry, specifying the delay (in minutes) and optional message template.")
def schedule_followup(
    id: str, 
    followup_in: schemas.FollowUpCreate, 
    db: Session = Depends(get_db)
):
    enquiry = db.query(models.Enquiry).filter(models.Enquiry.id == id).first()
    if not enquiry:
        logger.warning(
            f"Failed to schedule follow-up: Enquiry {id} not found",
            extra={"event_type": "errors", "extra_data": {"enquiry_id": id}}
        )
        raise HTTPException(status_code=404, detail="Enquiry not found")

    scheduled_time = datetime.utcnow() + timedelta(minutes=followup_in.delay_in_minutes)
    
    followup = models.FollowUp(
        enquiry_id=id,
        delay_in_minutes=followup_in.delay_in_minutes,
        message_template=followup_in.message_template,
        status="pending",
        scheduled_for=scheduled_time
    )
    db.add(followup)
    db.flush()

    # Create event log
    db_event = models.Event(
        enquiry_id=id,
        event_type="followup_created",
        payload={
            "followup_id": followup.id,
            "delay_in_minutes": followup_in.delay_in_minutes,
            "scheduled_for": scheduled_time.isoformat() + "Z"
        }
    )
    db.add(db_event)
    db.commit()

    logger.info(
        f"Follow-up scheduled for enquiry {id} in {followup_in.delay_in_minutes} minutes",
        extra={
            "event_type": "followup_created",
            "extra_data": {
                "enquiry_id": id,
                "followup_id": followup.id,
                "delay_in_minutes": followup_in.delay_in_minutes
            }
        }
    )

    return followup

@router.post("/enquiry/{id}/escalate", response_model=schemas.EnquiryResponse,
             summary="Escalate enquiry to human agent",
             description="Escalate a qualified or new enquiry to a human support agent, providing the reason for manual intervention.")
def escalate_enquiry(
    id: str, 
    escalate_in: schemas.EscalateCreate, 
    db: Session = Depends(get_db)
):
    enquiry = db.query(models.Enquiry).filter(models.Enquiry.id == id).first()
    if not enquiry:
        logger.warning(
            f"Failed to escalate: Enquiry {id} not found",
            extra={"event_type": "errors", "extra_data": {"enquiry_id": id}}
        )
        raise HTTPException(status_code=404, detail="Enquiry not found")

    enquiry.status = "escalated"
    
    # Create event log
    db_event = models.Event(
        enquiry_id=id,
        event_type="escalation_triggered",
        payload={"reason": escalate_in.reason}
    )
    db.add(db_event)
    db.commit()

    logger.info(
        f"Enquiry {id} manually escalated: {escalate_in.reason}",
        extra={
            "event_type": "escalation_triggered",
            "extra_data": {"enquiry_id": id, "reason": escalate_in.reason}
        }
    )

    return enquiry

@router.get("/enquiry/{id}/history", response_model=schemas.EnquiryHistoryResponse,
            summary="Retrieve enquiry execution history and audit log",
            description="Fetches full details of an enquiry, including matching SOP outcomes, scheduled follow-ups, and a chronological event log timeline.")
def get_enquiry_history(id: str, db: Session = Depends(get_db)):
    enquiry = db.query(models.Enquiry).filter(models.Enquiry.id == id).first()
    if not enquiry:
        raise HTTPException(status_code=404, detail="Enquiry not found")

    # Fetch associated records
    sop_matches = db.query(models.SOPMatch).filter(models.SOPMatch.enquiry_id == id).all()
    followups = db.query(models.FollowUp).filter(models.FollowUp.enquiry_id == id).all()
    events = db.query(models.Event).filter(models.Event.enquiry_id == id).order_by(models.Event.created_at.asc()).all()

    return schemas.EnquiryHistoryResponse(
        enquiry=enquiry,
        sop_matches=sop_matches,
        followups=followups,
        events=events
    )

@router.get("/health",
            summary="Check service health",
            description="Performs microservice health checks verifying api reachability and SQLite database readiness.")
def check_health(db: Session = Depends(get_db)):
    try:
        # Check database execution connectivity
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
        logger.error(
            f"Database health check failed: {str(e)}",
            extra={"event_type": "errors", "extra_data": {"error": str(e)}}
        )

    return {
        "status": "healthy" if db_status == "connected" else "unhealthy",
        "database": db_status,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

@router.get("/enquiry", response_model=List[schemas.EnquiryResponse],
            summary="List all enquiries",
            description="Retrieve all customer enquiries from the database, ordered chronologically by creation time.")
def list_enquiries(db: Session = Depends(get_db)):
    return db.query(models.Enquiry).order_by(models.Enquiry.created_at.desc()).all()

@router.get("/followup", response_model=List[schemas.FollowUpResponse],
            summary="List all scheduled follow-ups",
            description="Retrieve all scheduled follow-up actions.")
def list_followups(db: Session = Depends(get_db)):
    return db.query(models.FollowUp).order_by(models.FollowUp.scheduled_for.asc()).all()

@router.post("/enquiry/{id}/resolve", response_model=schemas.EnquiryResponse,
             summary="Mark enquiry/escalation as resolved",
             description="Sets enquiry status to qualified and logs an escalation resolution event.")
def resolve_enquiry(id: str, db: Session = Depends(get_db)):
    enquiry = db.query(models.Enquiry).filter(models.Enquiry.id == id).first()
    if not enquiry:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    
    enquiry.status = "qualified"
    
    db_event = models.Event(
        enquiry_id=id,
        event_type="escalation_resolved",
        payload={"resolved_at": datetime.utcnow().isoformat() + "Z"}
    )
    db.add(db_event)
    db.commit()
    
    logger.info(
        f"Enquiry {id} manually resolved",
        extra={
            "event_type": "task_processed",
            "extra_data": {"enquiry_id": id}
        }
    )
    
    return enquiry

@router.post("/followup/{id}/complete", response_model=schemas.FollowUpResponse,
             summary="Mark followup task as completed",
             description="Sets followup status to executed and logs follow-up completed event.")
def complete_followup(id: str, db: Session = Depends(get_db)):
    followup = db.query(models.FollowUp).filter(models.FollowUp.id == id).first()
    if not followup:
        raise HTTPException(status_code=404, detail="Follow-up not found")
    
    followup.status = "executed"
    
    db_event = models.Event(
        enquiry_id=followup.enquiry_id,
        event_type="followup_executed",
        payload={"followup_id": id}
    )
    db.add(db_event)
    db.commit()
    
    logger.info(
        f"Follow-up {id} marked as completed",
        extra={
            "event_type": "task_processed",
            "extra_data": {"followup_id": id, "enquiry_id": followup.enquiry_id}
        }
    )
    
    return followup
