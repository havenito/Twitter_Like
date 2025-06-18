from flask import Blueprint, request, jsonify
from models import db
from models.favorite import Favorite
from models.post import Post
from models.user import User
from models.category import Category
from models.like import Like

favorites_bp = Blueprint('favorites', __name__)

@favorites_bp.route('/api/posts/<int:post_id>/favorite', methods=['POST'])
def toggle_favorite(post_id):
    """Toggle favorite sur un post"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'user_id requis'}), 400
            
        post = Post.query.get(post_id)
        if not post:
            return jsonify({'error': 'Post non trouvé'}), 404
            
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404
            
        existing_favorite = Favorite.query.filter_by(user_id=user_id, post_id=post_id).first()
        
        if existing_favorite:
            db.session.delete(existing_favorite)
            db.session.commit()
            
            return jsonify({
                'message': 'Favori retiré',
                'favorited': False
            }), 200
        else:
            new_favorite = Favorite(user_id=user_id, post_id=post_id)
            db.session.add(new_favorite)
            db.session.commit()
            
            return jsonify({
                'message': 'Post ajouté aux favoris',
                'favorited': True
            }), 201
            
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erreur serveur: {str(e)}'}), 500

@favorites_bp.route('/api/users/<int:user_id>/posts/<int:post_id>/favorite-status', methods=['GET'])
def check_favorite_status(user_id, post_id):
    """Vérifier si un utilisateur a mis un post en favori"""
    try:
        favorite = Favorite.query.filter_by(user_id=user_id, post_id=post_id).first()
        return jsonify({
            'favorited': favorite is not None
        }), 200
    except Exception as e:
        return jsonify({'error': f'Erreur serveur: {str(e)}'}), 500

@favorites_bp.route('/api/users/<int:user_id>/favorites', methods=['GET'])
def get_user_favorites(user_id):
    """Obtenir les posts favoris d'un utilisateur"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404
            
        favorites = db.session.query(Favorite, Post).join(Post, Favorite.post_id == Post.id).filter(Favorite.user_id == user_id).order_by(Favorite.id.desc()).all()
        
        result = []
        for favorite, post in favorites:
            post_user = User.query.get(post.user_id)
            category = Category.query.get(post.category_id)
            
            from models.post_media import PostMedia
            media_list = PostMedia.query.filter_by(post_id=post.id).all()
            media = [{
                'id': m.id,
                'url': m.media_url,
                'type': m.media_type
            } for m in media_list]
            
            likes_count = Like.query.filter_by(post_id=post.id).count()
            
            result.append({
                'id': post.id,
                'title': post.title,
                'content': post.content,
                'publishedAt': post.published_at.isoformat(),
                'media': media,
                'userId': post.user_id,
                'categoryId': post.category_id,
                'likes': likes_count,
                'user': {
                    'id': post_user.id if post_user else None,
                    'pseudo': post_user.pseudo if post_user else 'Utilisateur supprimé',
                    'profilePicture': post_user.profile_picture if post_user else None,
                    'firstName': post_user.first_name if post_user else None,
                    'lastName': post_user.last_name if post_user else None
                },
                'category': {
                    'id': category.id if category else None,
                    'name': category.name if category else 'Catégorie supprimée',
                    'description': category.description if category else None
                }
            })
        
        return jsonify({
            'favorites': result
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Erreur serveur: {str(e)}'}), 500