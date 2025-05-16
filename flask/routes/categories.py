from flask import Blueprint, request, jsonify
from models import db
from models.category import Category

categories_api = Blueprint('categories_api', __name__)

@categories_api.route('/categories', methods=['GET'])
def get_categories():
    categories = Category.query.all()
    return jsonify([category.to_dict() for category in categories])

@categories_api.route('/categories/<int:id>', methods=['GET'])
def get_category(id):
    category = Category.query.get_or_404(id)
    return jsonify(category.to_dict())

@categories_api.route('/categories', methods=['POST'])
def create_category():
    data = request.get_json()
    new_category = Category(name=data['name'], nb_publications=data['nb_publications'], description=data['description'])
    db.session.add(new_category)
    db.session.commit()
    return jsonify(new_category.to_dict()), 201

@categories_api.route('/categories/<int:id>', methods=['PUT'])
def update_category(id):
    data = request.get_json()
    category = Category.query.get_or_404(id)
    category.name = data['name']
    category.nb_publications = data['nb_publications']
    category.description = data['description']
    db.session.commit()
    return jsonify(category.to_dict())

@categories_api.route('/categories/<int:id>', methods=['DELETE'])
def delete_category(id):
    category = Category.query.get_or_404(id)
    db.session.delete(category)
    db.session.commit()
    return '', 204
