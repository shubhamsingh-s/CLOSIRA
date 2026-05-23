import json
import logging
import sys
from datetime import datetime

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_record = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "message": record.getMessage(),
            "logger": record.name,
            "module": record.module,
            "func_name": record.funcName,
        }
        
        # Extract custom attributes if they exist
        if hasattr(record, "event_type"):
            log_record["event_type"] = record.event_type
        if hasattr(record, "extra_data"):
            log_record["extra_data"] = record.extra_data
            
        # Format exceptions if present
        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)
            
        return json.dumps(log_record)

def setup_logging(level: str = "INFO"):
    root_logger = logging.getLogger()
    root_logger.setLevel(level)
    
    # Avoid duplicate logs if setup is called multiple times
    if root_logger.hasHandlers():
        root_logger.handlers.clear()
        
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(JSONFormatter())
    root_logger.addHandler(console_handler)
    
    # Disable propagation for default uvicorn loggers to avoid cluttering or custom format them
    for logger_name in ("uvicorn", "uvicorn.error", "uvicorn.access"):
        logging_logger = logging.getLogger(logger_name)
        logging_logger.handlers = [console_handler]
        logging_logger.propagate = False
