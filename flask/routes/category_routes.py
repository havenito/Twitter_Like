from flask import Blueprint, request, jsonify
from models import db, Category

category_api = Blueprint('category_api', __name__)

@category_api.route('/category', methods=['GET'])
def get_category():
    categories = Category.query.all()
    return jsonify([category.to_dict() for category in categories])

@category_api.route('/categories/<int:id>', methods=['GET'])
def get_category(id):
    category = Category.query.get_or_404(id)
    return jsonify(category.to_dict())

@category_api.route('/categories', methods=['POST'])
def create_category():
    data = request.get_json()
    new_category = Category(
        name=data['name'],
        nb_publications=data['nb_publications'],
        description=data['description']
    )
    db.session.add(new_category)
    db.session.commit()
    return jsonify(new_category.to_dict()), 201

@category_api.route('/categories/<int:id>', methods=['PUT'])
def update_category(id):
    data = request.get_json()
    category = Category.query.get_or_404(id)
    category.name = data['name']
    category.nb_publications = data['nb_publications']
    category.description = data['description']
    db.session.commit()
    return jsonify(category.to_dict())

@category_api.route('/categories/<int:id>', methods=['DELETE'])
def delete_user(id):
    category = Category.query.get_or_404(id)
    db.session.delete(category)
    db.session.commit()
    return '', 204
