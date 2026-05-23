import logging
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.models import Enquiry, SOPMatch, Event

logger = logging.getLogger("closira.enquiry_service")

# SOP definition
SOPS = [
    {
        "label": "Booking Enquiry",
        "keywords": ["book", "reserve", "schedule", "appointment", "slot"],
        "suggested_response": "Hi! I can help you book an appointment. Please let us know your preferred date and time, or visit our booking link."
    },
    {
        "label": "Pricing Question",
        "keywords": ["price", "cost", "how much", "pricing", "quote", "rate"],
        "suggested_response": "Hello! Our base plans start at $29/month. We also offer customized packages. Let us know if you want a detailed estimate."
    },
    {
        "label": "Complaint",
        "keywords": ["complain", "bad", "terrible", "broke", "fail", "worst", "disappointed"],
        "suggested_response": "We apologize for the inconvenience. We have logged your complaint and our customer support lead will reach out to you within the hour."
    },
    {
        "label": "Refund Request",
        "keywords": ["refund", "money back", "cancel booking", "return"],
        "suggested_response": "Thank you for reaching out. We process refund requests under our 14-day policy. Please provide your order or invoice ID."
    },
    {
        "label": "After-hours Support",
        "keywords": ["emergency", "urgent", "help", "after hours", "night"],
        "suggested_response": "Our office is currently closed. For emergency support, please call +1 (555) 0199. Standard issues will be resolved on the next business day."
    }
]

def run_sop_matching(message: str):
    message_lower = message.lower()
    for sop in SOPS:
        matched = [kw for kw in sop["keywords"] if kw in message_lower]
        if matched:
            return sop["label"], sop["suggested_response"], matched
    return None, None, []

def process_enquiry_background(db: Session, enquiry_id: str):
    # Fetch the enquiry
    enquiry = db.query(Enquiry).filter(Enquiry.id == enquiry_id).first()
    if not enquiry:
        logger.error(
            f"Enquiry {enquiry_id} not found for background processing",
            extra={"event_type": "errors", "extra_data": {"enquiry_id": enquiry_id}}
        )
        return

    try:
        label, response, matched_kws = run_sop_matching(enquiry.message)
        
        if label:
            # SOP matched successfully
            enquiry.status = "qualified"
            sop_match = SOPMatch(
                enquiry_id=enquiry.id,
                sop_label=label,
                suggested_response=response,
                matched_keywords=matched_kws
            )
            db.add(sop_match)
            db.flush()  # flush to get sop_match ID
            
            # Log event to database
            db_event = Event(
                enquiry_id=enquiry.id,
                event_type="sop_matched",
                payload={"sop_label": label, "matched_keywords": matched_kws}
            )
            db.add(db_event)
            
            logger.info(
                f"SOP matched for enquiry {enquiry.id}: {label}",
                extra={
                    "event_type": "sop_matched", 
                    "extra_data": {
                        "enquiry_id": enquiry.id,
                        "sop_label": label,
                        "matched_keywords": matched_kws
                    }
                }
            )
        else:
            # No SOP matched -> auto-escalate
            enquiry.status = "escalated"
            
            # Log event to database
            db_event = Event(
                enquiry_id=enquiry.id,
                event_type="escalation_triggered",
                payload={"reason": "Auto-escalated: No matching SOP found"}
            )
            db.add(db_event)
            
            logger.info(
                f"Auto-escalation triggered for enquiry {enquiry.id}: No SOP matched",
                extra={
                    "event_type": "escalation_triggered", 
                    "extra_data": {
                        "enquiry_id": enquiry.id,
                        "reason": "Auto-escalation: No matching SOP found"
                    }
                }
            )
            
        # Processed event
        proc_event = Event(
            enquiry_id=enquiry.id,
            event_type="task_processed",
            payload={"processed_at": datetime.utcnow().isoformat() + "Z"}
        )
        db.add(proc_event)
        
        db.commit()
        
        logger.info(
            f"Enquiry {enquiry.id} async task processed successfully",
            extra={
                "event_type": "task_processed",
                "extra_data": {"enquiry_id": enquiry.id}
            }
        )
        
    except Exception as e:
        db.rollback()
        # Log failure
        logger.error(
            f"Failed to process enquiry {enquiry.id}: {str(e)}",
            exc_info=True,
            extra={
                "event_type": "errors",
                "extra_data": {"enquiry_id": enquiry_id, "error": str(e)}
            }
        )
        # Log error event in DB
        try:
            error_event = Event(
                enquiry_id=enquiry_id,
                event_type="error",
                payload={"error": str(e)}
            )
            db.add(error_event)
            db.commit()
        except Exception:
            pass
