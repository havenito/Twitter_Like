from flask import Blueprint, request, jsonify
from models import db
from models.user import User
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token

bcrypt = Bcrypt()
auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/api/users', methods=['POST'])
def create_user():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'user')
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    profile_picture = data.get('profile_picture')


    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 400
    

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    new_user = User(
        email=email,
        password=hashed_password,
        role=role,
        first_name=first_name,
        last_name=last_name,
        profile_picture=profile_picture
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({'message': 'User created successfully', 'user_id': new_user.id}), 201

@auth_bp.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    

    user = User.query.filter_by(email=email).first()
    

    if user and bcrypt.check_password_hash(user.password, password):
        access_token = create_access_token(identity=user.id)
        return jsonify({
            'message': 'Login successful',
            'access_token': access_token,
            'user': {
                'id': user.id,
                'email': user.email,
                'role': user.role,
                'first_name': user.first_name,
                'last_name': user.last_name
            }
        })
    
    return jsonify({'error': 'Invalid email or password'}), 401