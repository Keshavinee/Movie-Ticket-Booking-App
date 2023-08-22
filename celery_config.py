from celery import Celery
from datetime import datetime, timedelta

# Define the Celery app
app = Celery(
    'reminder',
    broker='redis://localhost:6379/0', 
    include=['tasks']  # Import tasks from the 'tasks' module
)

# Configure the periodic task
app.conf.beat_schedule = {
    'send-reminders': {
        'task': 'tasks.send_reminders',
        'schedule': timedelta(days=1, hours=18, minutes=23), 
    },
}

# Load additional configuration from a separate file (if needed)
# app.config_from_object('celery_config_settings')

if __name__ == '__main__':
    app.start()
