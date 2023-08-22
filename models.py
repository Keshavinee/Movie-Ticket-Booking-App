from flask_sqlalchemy import SQLAlchemy
from flask_security import UserMixin, RoleMixin
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy import DateTime

db = SQLAlchemy()

class User(db.Model, UserMixin):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True)
    password = db.Column(db.String(255))
    active = db.Column(db.Boolean(), nullable=False, default=True)
    email = db.Column(db.String(100), unique=True)

    last_visited = db.Column(DateTime)  # Field to store last visited date/time
    last_booking = db.Column(DateTime)

    roles = relationship('Role', secondary='user_roles', back_populates='users')

class Role(db.Model, RoleMixin):
    __tablename__ = 'roles'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True)

    users = relationship('User', secondary='user_roles', back_populates='roles')

class UserRoles(db.Model):
    __tablename__ = 'user_roles'

    id = db.Column(db.Integer(), primary_key=True)
    user_id = db.Column(db.Integer(), ForeignKey('users.id', ondelete='CASCADE'))
    role_id = db.Column(db.Integer(), ForeignKey('roles.id', ondelete='CASCADE'))

show_theatre_association = db.Table(
    'show_theatre_association',
    db.Column('show_id', db.Integer, db.ForeignKey('shows.id')),
    db.Column('theatre_id', db.Integer, db.ForeignKey('theatres.id'))
)

class Show(db.Model):
    __tablename__ = 'shows'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    capacity = db.Column(db.Integer, nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    timing = db.Column(db.DateTime, nullable=False)
    tags = db.Column(db.String(200), nullable=False)
    price = db.Column(db.Integer, nullable=False)
    theatre_id = db.Column(db.Integer, db.ForeignKey('theatres.id'), nullable=False)

    theatres = db.relationship(
        'Theatre',
        secondary=show_theatre_association,
        back_populates='shows'
    )

    bookings = db.relationship('Booking', back_populates='show')

class Theatre(db.Model):
    __tablename__ = 'theatres'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    caption = db.Column(db.String(255), nullable=False)
    place = db.Column(db.String(100), nullable=False)

    shows = db.relationship(
        'Show',
        secondary=show_theatre_association,
        back_populates='theatres'
    )

class Booking(db.Model):
    __tablename__ = 'bookings'

    id = db.Column(db.Integer, primary_key=True)
    show_id = db.Column(db.Integer, db.ForeignKey('shows.id'), nullable=False)
    num_tickets = db.Column(db.Integer, nullable=False)
    show = db.relationship('Show', back_populates='bookings')