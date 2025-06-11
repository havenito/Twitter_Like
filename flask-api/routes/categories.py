from flask import Blueprint, request, jsonify
from models import db
from models.user import User
from models.category import Category
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token
from models.post import Post

categories_bp = Blueprint('categories', __name__)

@categories_bp.route('/api/categories', methods=['POST'])
def create_category():
    data = request.get_json()
    name = data.get('name')
    description = data.get('description')

    if not name:
        return jsonify({'error': 'Category name is required'}), 400
    
    if Category.query.filter_by(name=name).first():
        return jsonify({'error': 'Category already exists'}), 400

    new_category = Category(name=name, description=description)
    db.session.add(new_category)
    db.session.commit()

    return jsonify({'message': 'Category created successfully', 'category_id': new_category.id}), 201

@categories_bp.route('/api/categories', methods=['GET'])
def get_categories():
    categories = Category.query.all()
    categories_list = [{'id': category.id, 'name': category.name, 'description': category.description} for category in categories]
    
    return jsonify({'categories': categories_list}), 200

@categories_bp.route('/api/categories/<int:category_id>', methods=['PUT'])
def update_category(category_id):
    data = request.get_json()
    name = data.get('name')
    description = data.get('description')

    category = Category.query.get(category_id)
    if not category:
        return jsonify({'error': 'Category not found'}), 404

    if name:
        category.name = name
    if description:
        category.description = description

    db.session.commit()

    return jsonify({'message': 'Category updated successfully'}), 200

@categories_bp.route('/api/categories/<int:category_id>', methods=['DELETE'])
def delete_category(category_id):
    category = Category.query.get(category_id)
    if not category:
        return jsonify({'error': 'Category not found'}), 404

    db.session.delete(category)
    db.session.commit()

    return jsonify({'message': 'Category deleted successfully'}), 200

@categories_bp.route('/api/categories/<int:category_id>', methods=['GET'])
def get_category(category_id):
    category = Category.query.get(category_id)
    if not category:
        return jsonify({'error': 'Category not found'}), 404

    return jsonify({
        'id': category.id,
        'name': category.name,
        'description': category.description
    }), 200

@categories_bp.route('/api/categories/<int:category_id>/posts', methods=['GET'])
def fetchCategoryPosts(category_id):
    try:
        posts = Post.query.filter_by(category_id=category_id).all()
        posts_list = []

        for post in posts:
            parent_post_data = post.parent_post.to_dict() if post.parent_post else None
            post_data = {
                'id': post.id,
                'title': post.title,
                'content': post.content,
                'publishedAt': post.published_at.isoformat() if post.published_at else None,
                'media': [media.to_dict() for media in post.media] if post.media else [],
                'userId': post.user_id,
                'categoryId': post.category_id,
                'parentPost': parent_post_data
            }
            posts_list.append(post_data)

        return jsonify({'posts': posts_list}), 200
    except Exception as e:
        print(f"Erreur lors de la récupération des posts : {e}")
        return jsonify({'error': str(e)}), 500