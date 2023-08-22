from celery import Celery
from datetime import datetime, time, timedelta
from models import User 

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

app = Celery('tasks', broker='redis://localhost:6379/0')

def send_email_reminder(user):
    # Email server settings
    print(user.email)
    smtp_server = 'smtp.gmail.com'
    smtp_port = 587
    smtp_username = 'shrikeshavinee@gmail.com'
    smtp_password = '5485@keshav'
    
    # Recipient's email address
    to_email = user.email
    
    # Construct the email content
    subject = 'Reminder: Visit/Book Today!'
    body = f"Hi {user.username},\n\nDon't forget to visit/book today!"
    
    msg = MIMEMultipart()
    msg['From'] = smtp_username
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))
    
    # Connect to the SMTP server and send the email
    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_username, smtp_password)
        server.sendmail(smtp_username, to_email, msg.as_string())
        server.quit()
        print(f"Email sent to {user.username}")
    except Exception as e:
        print(f"Error sending email to {user.username}: {e}")

@app.task
def send_reminders():
    current_time = datetime.now().time()
    evening_time = time(hour=18, minute=23)
    
    if current_time >= evening_time:
        # Fetch users who haven't visited or booked anything recently
        users_to_remind = User.query.filter(
            (User.last_visited is None or User.last_visited < (datetime.now() - timedelta(days=1))) &
            (User.last_booking is None or User.last_booking < (datetime.now() - timedelta(days=1)))
        ).all()

        for user in users_to_remind:
            send_email_reminder(user)

if __name__ == '__main__':
    app.start()
