from flask import Blueprint, request, jsonify
from models import db
from models.like import Like
from models.post import Post
from models.user import User

likes_bp = Blueprint('likes', __name__)

@likes_bp.route('/api/posts/<int:post_id>/like', methods=['POST'])
def toggle_like(post_id):
    """Toggle like sur un post"""
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
            
        existing_like = Like.query.filter_by(user_id=user_id, post_id=post_id).first()
        
        if existing_like:
            db.session.delete(existing_like)
            db.session.commit()
            
            likes_count = Like.query.filter_by(post_id=post_id).count()
            
            return jsonify({
                'message': 'Like retiré',
                'liked': False,
                'likes_count': likes_count
            }), 200
        else:
            new_like = Like(user_id=user_id, post_id=post_id)
            db.session.add(new_like)
            db.session.commit()
            
            likes_count = Like.query.filter_by(post_id=post_id).count()
            
            return jsonify({
                'message': 'Post liké',
                'liked': True,
                'likes_count': likes_count
            }), 201
            
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erreur serveur: {str(e)}'}), 500

@likes_bp.route('/api/posts/<int:post_id>/likes', methods=['GET'])
def get_post_likes(post_id):
    """Obtenir les likes d'un post"""
    try:
        post = Post.query.get(post_id)
        if not post:
            return jsonify({'error': 'Post non trouvé'}), 404
            
        likes = Like.query.filter_by(post_id=post_id).all()
        likes_count = len(likes)
        
        users_who_liked = []
        for like in likes:
            user = User.query.get(like.user_id)
            if user:
                users_who_liked.append({
                    'id': user.id,
                    'pseudo': user.pseudo,
                    'profile_picture': user.profile_picture
                })
        
        return jsonify({
            'post_id': post_id,
            'likes_count': likes_count,
            'users': users_who_liked
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Erreur serveur: {str(e)}'}), 500

@likes_bp.route('/api/users/<int:user_id>/posts/<int:post_id>/like-status', methods=['GET'])
def check_like_status(user_id, post_id):
    """Vérifier si un utilisateur a liké un post"""
    try:
        like = Like.query.filter_by(user_id=user_id, post_id=post_id).first()
        return jsonify({
            'liked': like is not None
        }), 200
    except Exception as e:
        return jsonify({'error': f'Erreur serveur: {str(e)}'}), 500