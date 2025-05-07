from flask import Blueprint, request, jsonify
from models import db, User

user_api = Blueprint('user_api', __name__)

@user_api.route('/users', methods=['GET'])
def get_users():
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])

@user_api.route('/users/<int:id>', methods=['GET'])
def get_user(id):
    user = User.query.get_or_404(id)
    return jsonify(user.to_dict())

@user_api.route('/users', methods=['POST'])
def create_user():
    data = request.get_json()
    new_user = User(
        email=data['email'],
        password=data['password'],
        roles=data['roles'],
        first_name=data['first_name'],
        last_name=data['last_name'],
        profile_picture=data['profile_picture'],
        is_accepted=data['is_accepted'],
        private=data['private']
    )
    db.session.add(new_user)
    db.session.commit()
    return jsonify(new_user.to_dict()), 201

@user_api.route('/users/<int:id>', methods=['PUT'])
def update_user(id):
    data = request.get_json()
    user = User.query.get_or_404(id)
    user.email = data['email']
    user.password = data['password']
    user.roles = data['roles']
    user.first_name = data['first_name']
    user.last_name = data['last_name']
    user.profile_picture = data['profile_picture']
    user.is_accepted = data['is_accepted']
    user.private = data['private']
    db.session.commit()
    return jsonify(user.to_dict())

@user_api.route('/users/<int:id>', methods=['DELETE'])
def delete_user(id):
    user = User.query.get_or_404(id)
    db.session.delete(user)
    db.session.commit()
    return '', 204
