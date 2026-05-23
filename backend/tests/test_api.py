import pytest
from datetime import datetime
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.database import Base, get_db
from app.models import models

import os
from app.db import database

# Isolated file-based SQLite database for testing
TEST_DB_FILE = "./test_closira.db"
SQLALCHEMY_DATABASE_URL = f"sqlite:///{TEST_DB_FILE}"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(
    autocommit=False, 
    autoflush=False, 
    bind=engine
)

# Force the application database to point to our test database session maker
# so background tasks inherit the test context rather than writing to production.
database.SessionLocal = TestingSessionLocal

@pytest.fixture(scope="function")
def db_session():
    # Setup test tables
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        # Drop test tables to clean up
        Base.metadata.drop_all(bind=engine)
        # Clean up the test database file
        if os.path.exists(TEST_DB_FILE):
            try:
                os.remove(TEST_DB_FILE)
            except Exception:
                pass

@pytest.fixture(scope="function")
def client(db_session):
    # Override get_db dependency to point to our in-memory DB session
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    # Remove override after test completes
    del app.dependency_overrides[get_db]

def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"
    assert "timestamp" in data

def test_create_enquiry_validation_errors(client):
    # Invalid channel & blank customer name
    response = client.post("/enquiry", json={
        "channel": "telegram",  # invalid
        "customer_name": "  ",  # blank (fails min_length or custom validator)
        "message": ""           # empty (fails min_length)
    })
    assert response.status_code == 422
    data = response.json()
    assert data["detail"] == "Request body validation failed"
    assert "errors" in data
    
    # Assert validation details
    fields = [err["field"] for err in data["errors"]]
    assert "channel" in fields
    assert "customer_name" in fields
    assert "message" in fields

def test_create_enquiry_pricing_sop_match(client):
    # 'price' and 'pricing' are keywords in Pricing Question SOP
    response = client.post("/enquiry", json={
        "channel": "whatsapp",
        "customer_name": "Alice Miller",
        "message": "Hello, I want to know the price of your premium bundle? How much does it cost?"
    })
    assert response.status_code == 201
    res_data = response.json()
    enquiry_id = res_data["enquiry_id"]
    assert res_data["status"] == "queued"

    # In TestClient, BackgroundTasks execute synchronously before response is fully returned to test client.
    # Therefore, we can immediately fetch the history and inspect the results.
    history_resp = client.get(f"/enquiry/{enquiry_id}/history")
    assert history_resp.status_code == 200
    history_data = history_resp.json()
    
    enquiry = history_data["enquiry"]
    assert enquiry["status"] == "qualified"
    assert enquiry["customer_name"] == "Alice Miller"
    
    # Verify SOP matches
    sop_matches = history_data["sop_matches"]
    assert len(sop_matches) == 1
    assert sop_matches[0]["sop_label"] == "Pricing Question"
    assert "price" in sop_matches[0]["matched_keywords"]
    assert "cost" in sop_matches[0]["matched_keywords"]
    assert "How much" in sop_matches[0]["suggested_response"] or "base plans" in sop_matches[0]["suggested_response"]

def test_create_enquiry_auto_escalation(client):
    # Message does not match any SOP keyword list
    response = client.post("/enquiry", json={
        "channel": "email",
        "customer_name": "Bob Vance",
        "message": "Do you open on national holidays?"
    })
    assert response.status_code == 201
    enquiry_id = response.json()["enquiry_id"]

    history_resp = client.get(f"/enquiry/{enquiry_id}/history")
    assert history_resp.status_code == 200
    history_data = history_resp.json()
    
    assert history_data["enquiry"]["status"] == "escalated"
    assert len(history_data["sop_matches"]) == 0
    
    # Check events timeline: enquiry_created -> escalation_triggered -> task_processed
    events = history_data["events"]
    assert len(events) == 3
    event_types = [e["event_type"] for e in events]
    assert "enquiry_created" in event_types
    assert "escalation_triggered" in event_types
    assert "task_processed" in event_types

def test_schedule_followup(client):
    # 1. Create enquiry
    response = client.post("/enquiry", json={
        "channel": "call",
        "customer_name": "Charlie Chaplin",
        "message": "Need a refund for booking."
    })
    enquiry_id = response.json()["enquiry_id"]

    # 2. Schedule follow-up
    followup_resp = client.post(f"/enquiry/{enquiry_id}/followup", json={
        "delay_in_minutes": 15,
        "message_template": "Hi Charlie, did you get our refund confirmation?"
    })
    assert followup_resp.status_code == 201
    followup_data = followup_resp.json()
    assert followup_data["enquiry_id"] == enquiry_id
    assert followup_data["delay_in_minutes"] == 15
    assert followup_data["message_template"] == "Hi Charlie, did you get our refund confirmation?"
    assert followup_data["status"] == "pending"
    assert "scheduled_for" in followup_data

    # Verify history updates
    history_resp = client.get(f"/enquiry/{enquiry_id}/history")
    history_data = history_resp.json()
    assert len(history_data["followups"]) == 1
    assert history_data["followups"][0]["id"] == followup_data["id"]

def test_manual_escalate(client):
    # 1. Create enquiry
    response = client.post("/enquiry", json={
        "channel": "whatsapp",
        "customer_name": "Diana Ross",
        "message": "I would like to book a session."
    })
    enquiry_id = response.json()["enquiry_id"]

    # 2. Manual Escalate
    esc_resp = client.post(f"/enquiry/{enquiry_id}/escalate", json={
        "reason": "Customer is requesting supervisor assistance directly."
    })
    assert esc_resp.status_code == 200
    assert esc_resp.json()["status"] == "escalated"

    # Verify event logged
    history_resp = client.get(f"/enquiry/{enquiry_id}/history")
    history_data = history_resp.json()
    events = history_data["events"]
    
    # Should include: enquiry_created, sop_matched, task_processed, escalation_triggered (manual)
    event_types = [e["event_type"] for e in events]
    assert event_types.count("escalation_triggered") >= 1
    
    # Retrieve the manual escalation payload
    manual_esc_event = [e for e in events if e["event_type"] == "escalation_triggered" and "supervisor assistance" in str(e["payload"])][0]
    assert manual_esc_event["payload"]["reason"] == "Customer is requesting supervisor assistance directly."

def test_enquiry_not_found(client):
    # Verify 404 behavior for invalid enquiry IDs
    fake_id = "non-existent-uuid"
    assert client.get(f"/enquiry/{fake_id}/history").status_code == 404
    assert client.post(f"/enquiry/{fake_id}/escalate", json={"reason": "test"}).status_code == 404
    assert client.post(f"/enquiry/{fake_id}/followup", json={"delay_in_minutes": 5}).status_code == 404
