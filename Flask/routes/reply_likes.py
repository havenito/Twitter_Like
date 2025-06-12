from flask import Blueprint, request, jsonify
from models import db
from models.reply_like import ReplyLike
from models.reply import Reply
from models.user import User

reply_likes_bp = Blueprint('reply_likes', __name__)

@reply_likes_bp.route('/api/replies/<int:reply_id>/like', methods=['POST'])
def toggle_reply_like(reply_id):
    """Toggle like sur une réponse"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'user_id requis'}), 400
            
        reply = Reply.query.get(reply_id)
        if not reply:
            return jsonify({'error': 'Réponse non trouvée'}), 404
            
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404
            
        existing_like = ReplyLike.query.filter_by(user_id=user_id, replies_id=reply_id).first()
        
        if existing_like:
            db.session.delete(existing_like)
            db.session.commit()
            
            likes_count = ReplyLike.query.filter_by(replies_id=reply_id).count()
            
            return jsonify({
                'message': 'Like retiré',
                'liked': False,
                'likes_count': likes_count
            }), 200
        else:
            new_like = ReplyLike(user_id=user_id, replies_id=reply_id)
            db.session.add(new_like)
            db.session.commit()
            
            likes_count = ReplyLike.query.filter_by(replies_id=reply_id).count()
            
            return jsonify({
                'message': 'Réponse likée',
                'liked': True,
                'likes_count': likes_count
            }), 201
            
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erreur serveur: {str(e)}'}), 500

@reply_likes_bp.route('/api/replies/<int:reply_id>/likes', methods=['GET'])
def get_reply_likes(reply_id):
    """Obtenir les likes d'une réponse"""
    try:
        reply = Reply.query.get(reply_id)
        if not reply:
            return jsonify({'error': 'Réponse non trouvée'}), 404
            
        likes = ReplyLike.query.filter_by(replies_id=reply_id).all()
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
            'reply_id': reply_id,
            'likes_count': likes_count,
            'users': users_who_liked
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Erreur serveur: {str(e)}'}), 500

@reply_likes_bp.route('/api/users/<int:user_id>/replies/<int:reply_id>/like-status', methods=['GET'])
def check_reply_like_status(user_id, reply_id):
    """Vérifier si un utilisateur a liké une réponse"""
    try:
        like = ReplyLike.query.filter_by(user_id=user_id, replies_id=reply_id).first()
        return jsonify({
            'liked': like is not None
        }), 200
    except Exception as e:
        return jsonify({'error': f'Erreur serveur: {str(e)}'}), 500