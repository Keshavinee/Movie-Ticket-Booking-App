from datetime import datetime
from flask import Flask, request, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_security import Security, SQLAlchemyUserDatastore, login_required
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
from flask_security.decorators import roles_required
from models import db, User, Role, Theatre, Show, Booking
from sqlalchemy import event, and_

def create_admin_user():
    admin_role = Role.query.filter_by(name='admin').first()
    if not admin_role:
        admin_role = Role(name='admin')
        db.session.add(admin_role)
        db.session.commit()

    admin_user = User.query.filter_by(username='admin').first()
    if not admin_user:
        admin_user = User(username='admin', password='adminpassword',email='shrikeshavinee@gmail.com')
        admin_user.roles.append(admin_role)  # Assign admin role
        db.session.add(admin_user)
        db.session.commit()

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret-key'  
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db' 
app.config['SECURITY_PASSWORD_SALT'] = 'salt' 
app.config['SECURITY_USER_IDENTITY_ATTRIBUTES'] = ['username']

# Flask-Security Setup
db.init_app(app)
with app.app_context():
    db.create_all()
    create_admin_user()

user_datastore = SQLAlchemyUserDatastore(db, User, Role)
security = Security()

# Flask-JWT-Extended Setup
app.config['JWT_SECRET_KEY'] = 'jwt-secret-key'
jwt = JWTManager(app)

# Enable CORS
CORS(app)

@app.route('/')
def index():
    return render_template('base.html')

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not password or not email:
        return jsonify({"message": "Username and password are required."}), 400

    if user_datastore.get_user(username):
        return jsonify({"message": "Username already exists."}), 409

    user_datastore.create_user(username=username, password=password, email=email)#security.encrypt_password(password)
    db.session.commit()

    return jsonify({"message": "User registered successfully."}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"message": "Username and password are required."}), 400

    user = user_datastore.get_user(username)
    if not user:
        return jsonify({"message": "Invalid username."}), 401
    
    if password != user.password:
        return jsonify({"message": "Invalid password."}), 401
    
    user.last_visited = datetime.now()
    db.session.commit()

    # Check if the user has the 'admin' role
    is_admin = any(role.name == 'admin' for role in user.roles)
    
    # Create an access token with the user's identity and role information
    access_token_payload = {
        'username': user.username,
        'is_admin': is_admin
    }
    access_token = create_access_token(identity=access_token_payload)

    return jsonify({"access_token": access_token,"message":is_admin,"username":user.username,}), 200

@app.route('/api/protected', methods=['GET'])
@jwt_required()
def protected():
    current_user = get_jwt_identity()
    return jsonify({"message": f"Hello {current_user}! This is a protected route."}), 200

# Create a new theatre
@app.route('/api/theatres', methods=['POST'])
def create_theatre():
    data = request.json
    title = data.get('title')
    caption = data.get('caption')
    place = data.get('place')

    new_theatre = Theatre(title=title, caption=caption, place=place)
    db.session.add(new_theatre)
    db.session.commit()

    return jsonify({"message": "Theatre created successfully."}), 201

# Fetch all theatres
@app.route('/api/theatres', methods=['GET'])
def get_theatres():
    theatres = Theatre.query.all()
    result = []
    for theatre in theatres:
        result.append({
            'id': theatre.id,
            'title': theatre.title,
            'caption': theatre.caption,
            'place': theatre.place
        })
    return jsonify(result)

# Update a theatre
@app.route('/api/theatres/<int:theatre_id>', methods=['PUT'])
def update_theatre(theatre_id):
    theatre = Theatre.query.get(theatre_id)
    if not theatre:
        return jsonify({"message": "Theatre not found."}), 404

    data = request.json
    theatre.title = data.get('title', theatre.title)
    theatre.caption = data.get('caption', theatre.caption)
    theatre.place = data.get('place', theatre.place)

    db.session.commit()
    return jsonify({"message": "Theatre updated successfully."})

# Remove a theatre
@app.route('/api/theatres/<int:theatre_id>', methods=['DELETE'])
def remove_theatre(theatre_id):
    theatre = Theatre.query.get(theatre_id)
    if not theatre:
        return jsonify({"message": "Theatre not found."}), 404

    db.session.delete(theatre)
    db.session.commit()
    return jsonify({"message": "Theatre removed successfully."})

@app.route('/api/shows', methods=['POST'])
def create_show():
    # current_user = get_jwt_identity()

    data = request.json
    title = data.get('title')
    rating = data.get('rating')
    capacity = data.get('capacity')
    timing = data.get('timing')
    timing = datetime.strptime(timing, '%Y-%m-%dT%H:%M')
    tags = data.get('tags')
    price = data.get('price')
    theatre_id = data.get('theatre_id')

    try:
        new_show = Show(title=title,capacity=capacity,rating=rating,timing=timing,tags=tags,price=price,theatre_id=theatre_id)

        theatre = Theatre.query.get(theatre_id)
        if theatre:
            new_show.theatres.append(theatre)

        db.session.add(new_show)
        db.session.commit()
        print(title,capacity,rating,timing,tags,price,theatre_id)

        return jsonify({"message": "Show created successfully."}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "An error occurred while creating the show."}), 500
    
@app.route('/api/shows/<int:theatre_id>', methods=['GET'])
def get_shows(theatre_id):
    try:
        shows = Show.query.filter_by(theatre_id=theatre_id) 
        show_list = [{
            'id': show.id,
            'title': show.title,
            'capacity': show.capacity,
            'rating': show.rating,
            'timing': show.timing,
            'tags': show.tags,
            'price': show.price
        } for show in shows]
        return jsonify(show_list)
    except Exception as e:
        return jsonify({"message": "Error fetching shows", "error": str(e)}), 500
    
@app.route('/api/shows/<int:show_id>', methods=['PUT'])
def update_show(show_id):
    # user_id = get_jwt_identity()

    # Get the show to update
    show = Show.query.filter_by(id=show_id).first()

    if not show:
        return jsonify({"message": "Show not found or you don't have permission to update it."}), 404

    data = request.json
    if 'title' in data:
        show.title = data['title']
    if 'rating' in data:
        show.rating = data['rating']
    if 'capacity' in data:
        show.rating = data['capacity']
    if 'timing' in data:
        show.timing = datetime.strptime(data['timing'], '%Y-%m-%dT%H:%M')
    if 'tags' in data:
        show.tags = data['tags']
    if 'price' in data:
        show.price = data['price']

    try:
        db.session.commit()
        return jsonify({"message": "Show updated successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Failed to update show", "error": str(e)}), 500
    
@app.route('/api/shows/<int:show_id>', methods=['DELETE'])
def delete_show(show_id):
    # user_id = get_jwt_identity()

    # Get the show to delete
    show = Show.query.filter_by(id=show_id).first()

    if not show:
        return jsonify({"message": "Show not found or you don't have permission to delete it."}), 404

    try:
        db.session.delete(show)
        db.session.commit()
        return jsonify({"message": "Show deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Failed to delete show", "error": str(e)}), 500

# API endpoint for searching theatres based on location
@app.route('/api/search/theatres', methods=['GET'])
def search_theatres():
    location = request.args.get('location')
    
    if location:
        theatres = Theatre.query.filter_by(place=location).all()
        theatre_data = [{'id': theatre.id, 'title': theatre.title, 'caption': theatre.caption, 'place': theatre.place} for theatre in theatres]
        return jsonify(theatre_data)
    else:
        return jsonify({'message': 'Location not provided'}), 400

# API endpoint for searching shows based on tags and rating
@app.route('/api/search/shows', methods=['GET'])
def search_shows():
    tags = request.args.get('tags')
    min_rating = request.args.get('min_rating')
    
    query = Show.query
    if tags:
        query = query.filter(Show.tags.contains(tags))
    if min_rating:
        query = query.filter(Show.rating >= float(min_rating))
    
    shows = query.all()
    show_data = [{'id': show.id, 'title': show.title, 'rating': show.rating, 'capacity': show.capacity, 'tags': show.tags, 'timing': show.timing, 'price': show.price} for show in shows]
    return jsonify(show_data)

@app.route('/api/getshows', methods=['GET'])
def get_all_shows():
    # Get shows that are available and not houseful for a given timeframe
    start_time = request.args.get('start_time')  # Format: 'YYYY-MM-DD HH:MM:SS'
    end_time = request.args.get('end_time')  # Format: 'YYYY-MM-DD HH:MM:SS'

    try:
        start_time = datetime.strptime(start_time, '%Y-%m-%dT%H:%M')
        end_time = datetime.strptime(end_time, '%Y-%m-%dT%H:%M')
    except ValueError:
        return jsonify({"message": "Invalid date/time format"}), 400

    available_shows = Show.query.filter(
        and_(Show.timing >= start_time, Show.timing <= end_time)
    ).all()

    response = []
    for show in available_shows:
        bookings = Booking.query.filter_by(show_id=show.id)
        total_tickets_booked = sum(booking.num_tickets for booking in bookings)
        print(total_tickets_booked)
        available_seats = show.capacity - total_tickets_booked
        theatre = Theatre.query.filter_by(id=show.theatre_id)
        response.append({
            "theatre_name": theatre[0].title,
            "show_id": show.id,
            "title": show.title,
            "timing": show.timing.strftime('%Y-%m-%d %H:%M:%S'),
            'price': show.price,
            "available_seats": available_seats
        })

    return jsonify(response), 200

@app.route('/api/bookings', methods=['POST'])
def book_tickets():
    data = request.json
    show_id = data.get('show_id')
    num_tickets = data.get('num_tickets')
    username = data.get('username')

    show = Show.query.get(show_id)
    if not show:
        return jsonify({"message": "Show not found"}), 404

    booking = Booking(show_id=show_id, num_tickets=num_tickets)
    db.session.add(booking)

    user = user_datastore.get_user(username)
    if not user:
        return jsonify({"message": "Invalid user"}), 401
    user.last_booking = datetime.now()

    db.session.commit()

    return jsonify({"message": "Tickets booked successfully"}), 201
    
if __name__ == '__main__':
    app.run(debug=True)