from datetime import datetime
import time
import logging

from airs.session.session_config import SESSION_CLEANUP_INTERVAL

# Session cleanup 
def cleanup_sessions(sessions):
    while True:
        time.sleep(SESSION_CLEANUP_INTERVAL)    
        now = datetime.now()
        expired_sessions = []
        for session_id, session in sessions.items():
            if now > session.expiration:
                expired_sessions.append(session_id)

        for session_id in expired_sessions:
            logging.info(f"Session Expired: {session_id}")
            del sessions[session_id]