# Ticket Show Application

Welcome to the Ticket Show Application! This application allows users to book show tickets, manage theatres and shows, and receive scheduled reminders and reports. It also includes user authentication and authorization features.

## Features

- User Registration and Login
- User Roles (Admin and User)
- Theatre and Show Management
- Ticket Booking
- Scheduled Reminders and Reports

## Installation

1. Extract the zip file
cd ticket-booking-app

2. Create a virtual environment (optional but recommended):
python -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate

3. Install dependencies:
pip install -r requirements.txt

4. Initialize the database:
python manage.py db init
python manage.py db migrate
python manage.py db upgrade

5. Run the application:
python app.py

## Usage

### User Registration and Login

- Open your web browser and navigate to `http://localhost:5000`.
- Use the provided signup and login forms to create a user account and log in.

### User Dashboard

- After logging in, users can view available shows, book tickets, and view their booked tickets.

### Admin Dashboard

- Admins can manage theatres and shows, create new shows, and view bookings.

### Scheduled Jobs

- The system automatically sends daily reminders to users who have not visited or booked any shows.
- A monthly entertainment report is sent via email on the first day of each month.

### Export as CSV

- Admin users can export theatre details as CSV by clicking the "Export CSV" button on the admin dashboard.

## API Documentation

API documentation can be found in the `api-definition.yaml` file in the root directory. Use tools like Swagger UI or Postman to explore the API endpoints.
