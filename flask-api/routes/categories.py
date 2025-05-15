from flask import Blueprint, request, jsonify
from models import db
from models.user import User
from models.category import Category
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token

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
def get_posts_by_category(category_id):
    category = Category.query.get(category_id)
    if not category:
        return jsonify({'error': 'Category not found'}), 404

    # Vérifiez ici le nom exact de l'attribut dans votre modèle Category
    # Selon votre modèle, utilisez l'une des options suivantes:
    
    try:
        # Option 1: Si la relation s'appelle 'posts'
        if hasattr(category, 'posts'):
            if hasattr(category.posts, 'all'):  # Si lazy='dynamic'
                posts = category.posts.all()
            else:  # Si lazy='select'
                posts = category.posts
        # Option 2: Si la relation s'appelle 'post_id' mais n'a pas de méthode get_all_posts
        elif hasattr(category, 'post_id'):
            if category.post_id is None:
                return jsonify({'posts': [], 'message': 'Aucun post trouvé pour cette catégorie'}), 200
            
            # Tentative de récupération directe
            posts = category.post_id
        else:
            # Fallback - requête manuelle
            from models.post import Post
            posts = Post.query.filter_by(category_id=category.id).all()
            
        posts_list = [{'id': post.id, 'title': post.title, 'content': post.content} for post in posts]
        return jsonify({'posts': posts_list}), 200
        
    except Exception as e:
        return jsonify({'error': f'Erreur lors de la récupération des posts: {str(e)}'}), 500