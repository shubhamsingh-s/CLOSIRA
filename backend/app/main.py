import logging
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.logging import setup_logging
from app.api.router import api_router
from app.db.database import Base, engine

# Setup Logging
setup_logging(settings.LOG_LEVEL)
logger = logging.getLogger("closira.main")

# Auto-create database tables (ideal for local sqlite bootstrap)
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully.", extra={"event_type": "task_processed"})
except Exception as e:
    logger.error(f"Failed to initialize database tables: {str(e)}", exc_info=True, extra={"event_type": "errors"})

app = FastAPI(
    title="Closira Customer Communication API",
    description="Closira's Enquiry Handling and SOP Automation engine designed for Small and Medium Businesses (SMBs).",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Register routes
app.include_router(api_router)

# Custom handler for validation error logs and responses
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for error in exc.errors():
        # Clean up path locations (e.g. ['body', 'customer_name'] -> 'customer_name')
        loc = error["loc"]
        field = ".".join([str(x) for x in loc[1:]]) if len(loc) > 1 else str(loc[0])
        errors.append({
            "field": field,
            "message": error["msg"],
            "type": error["type"]
        })
        
    logger.warning(
        f"Validation error on {request.url.path}: {errors}",
        extra={"event_type": "errors", "extra_data": {"validation_errors": errors}}
    )
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Request body validation failed",
            "errors": errors
        }
    )

# Custom handler for standard HTTP Exceptions
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    logger.warning(
        f"HTTP exception: {exc.status_code} - {exc.detail}",
        extra={"event_type": "errors", "extra_data": {"status_code": exc.status_code, "detail": exc.detail}}
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

# Custom handler for catching all unexpected internal runtime exceptions
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(
        f"Unhandled application exception: {str(exc)}",
        exc_info=True,
        extra={"event_type": "errors", "extra_data": {"error": str(exc)}}
    )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please contact administrator."}
    )
