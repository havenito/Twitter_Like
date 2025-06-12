from flask import Blueprint, request, jsonify
from models import db
from models.comment_like import CommentLike
from models.comment import Comment
from models.user import User

comment_likes_bp = Blueprint('comment_likes', __name__)

@comment_likes_bp.route('/api/comments/<int:comment_id>/like', methods=['POST'])
def toggle_comment_like(comment_id):
    """Toggle like sur un commentaire"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'user_id requis'}), 400
            
        comment = Comment.query.get(comment_id)
        if not comment:
            return jsonify({'error': 'Commentaire non trouvé'}), 404
            
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404
            
        existing_like = CommentLike.query.filter_by(user_id=user_id, comment_id=comment_id).first()
        
        if existing_like:
            db.session.delete(existing_like)
            db.session.commit()
            
            likes_count = CommentLike.query.filter_by(comment_id=comment_id).count()
            
            return jsonify({
                'message': 'Like retiré',
                'liked': False,
                'likes_count': likes_count
            }), 200
        else:
            new_like = CommentLike(user_id=user_id, comment_id=comment_id)
            db.session.add(new_like)
            db.session.commit()
            
            likes_count = CommentLike.query.filter_by(comment_id=comment_id).count()
            
            return jsonify({
                'message': 'Commentaire liké',
                'liked': True,
                'likes_count': likes_count
            }), 201
            
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erreur serveur: {str(e)}'}), 500

@comment_likes_bp.route('/api/comments/<int:comment_id>/likes', methods=['GET'])
def get_comment_likes(comment_id):
    """Obtenir les likes d'un commentaire"""
    try:
        comment = Comment.query.get(comment_id)
        if not comment:
            return jsonify({'error': 'Commentaire non trouvé'}), 404
            
        likes = CommentLike.query.filter_by(comment_id=comment_id).all()
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
            'comment_id': comment_id,
            'likes_count': likes_count,
            'users': users_who_liked
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Erreur serveur: {str(e)}'}), 500

@comment_likes_bp.route('/api/users/<int:user_id>/comments/<int:comment_id>/like-status', methods=['GET'])
def check_comment_like_status(user_id, comment_id):
    """Vérifier si un utilisateur a liké un commentaire"""
    try:
        like = CommentLike.query.filter_by(user_id=user_id, comment_id=comment_id).first()
        return jsonify({
            'liked': like is not None
        }), 200
    except Exception as e:
        return jsonify({'error': f'Erreur serveur: {str(e)}'}), 500