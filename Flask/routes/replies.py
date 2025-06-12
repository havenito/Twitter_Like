from flask import Blueprint, request, jsonify
from models import db
from models.reply import Reply
from models.post import Post
from models.comment import Comment
from models.notification import Notification
from models.user import User
from models.reply_media import ReplyMedia
from models.reply_like import ReplyLike
from services.file_upload import upload_file, determine_media_type

replies_api = Blueprint('replies_api', __name__)

@replies_api.route('/api/replies', methods=['POST'])
def create_replie():
    try:
        # Gestion des données selon le type de requête
        if request.is_json:
            data = request.get_json()
            content = data.get('content')
            comment_id = data.get('comment_id')  # Pour réponse à un commentaire
            replies_id = data.get('replies_id')  # Pour réponse à une réponse
            user_id = data.get('user_id')
            media_files = []
        else:
            content = request.form.get('content')
            comment_id = request.form.get('comment_id')  # Pour réponse à un commentaire
            replies_id = request.form.get('replies_id')  # Pour réponse à une réponse
            user_id = request.form.get('user_id')
            
            media_files = []
            if 'file' in request.files:
                file = request.files['file']
                if file.filename:
                    media_files.append(file)
                    
            if 'files[]' in request.files:
                files = request.files.getlist('files[]')
                for file in files:
                    if file.filename:
                        media_files.append(file)

        if not content:
            return jsonify({'error': 'Content is required'}), 400
        
        if not comment_id and not replies_id:
            return jsonify({'error': 'Either comment_id or replies_id is required'}), 400
        
        if comment_id and replies_id:
            return jsonify({'error': 'Cannot have both comment_id and replies_id'}), 400
        
        new_replie = Reply(
            content=content, 
            comment_id=comment_id,
            replies_id=replies_id, 
            user_id=user_id
        )
        db.session.add(new_replie)
        db.session.commit()

        for file in media_files:
            url, file_type = upload_file(file)
            
            if not url:
                continue 
                
            media_type = determine_media_type(file_type)
            if not media_type:
                continue 
                
            reply_media = ReplyMedia(
                replies_id=new_replie.id,
                media_url=url,
                media_type=media_type
            )
            db.session.add(reply_media)

        db.session.commit()
        
        # Notification adaptée selon le type de réponse
        if comment_id:
            notify_user_on_new_replie(new_replie)  # Réponse à un commentaire
        else:
            notify_user_on_reply_to_reply(new_replie)  # Réponse à une réponse
        
        user = User.query.get(user_id)
        
        reply_media_list = ReplyMedia.query.filter_by(replies_id=new_replie.id).all()
        media = [{
            'id': m.id,
            'url': m.media_url,
            'type': m.media_type,
            'created_at': m.created_at.isoformat()
        } for m in reply_media_list]

        likes_count = ReplyLike.query.filter_by(replies_id=new_replie.id).count()
        
        return jsonify({
            'message': 'Reply created successfully', 
            'replie_id': new_replie.id,
            'reply': {
                'id': new_replie.id,
                'content': new_replie.content,
                'created_at': new_replie.created_at.isoformat(),
                'comment_id': new_replie.comment_id,
                'replies_id': new_replie.replies_id,
                'user_id': new_replie.user_id,
                'likes_count': likes_count,
                'media': media,
                'user': {
                    'id': user.id if user else None,
                    'pseudo': user.pseudo if user else None,
                    'first_name': user.first_name if user else None,
                    'last_name': user.last_name if user else None,
                    'profile_picture': user.profile_picture if user else None
                }
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create reply: {str(e)}'}), 500

def notify_user_on_new_replie(reply):
    try:
        comment = Comment.query.get(reply.comment_id)
        if comment:
            notification = Notification(
                post_id=comment.post_id,  
                comments_id=comment.id,
                user_id=comment.user_id,
                replie_id=reply.id,
                follow_id=None,
                type="reply"
            )
            db.session.add(notification)
            db.session.commit()

            print(f"Notification envoyée à l'utilisateur {comment.user_id} pour une réponse au commentaire {comment.id}.")
        else:
            print("Erreur : Impossible de récupérer le commentaire lié à la réponse.")
    except Exception as e:
        print(f"Erreur lors de la notification: {e}")

def notify_user_on_reply_to_reply(reply):
    """Notification pour les réponses aux réponses"""
    try:
        # Récupérer la réponse parente
        parent_reply = Reply.query.get(reply.replies_id)
        if parent_reply:
            notification = Notification(
                replie_id=reply.id,
                user_id=parent_reply.user_id,
                type="reply_to_reply"
            )
            db.session.add(notification)
            db.session.commit()

            print(f"Notification envoyée à l'utilisateur {parent_reply.user_id} pour une réponse à sa réponse {parent_reply.id}.")
        else:
            print("Erreur : Impossible de récupérer la réponse parente.")
    except Exception as e:
        print(f"Erreur lors de la notification: {e}")

@replies_api.route('/api/replies', methods=['GET'])
def get_replies():
    replies = Reply.query.all()
    replies_list = [{'id': reply.id, 'content': reply.content, 'comment_id': reply.comment_id, 'user_id': reply.user_id} for reply in replies]
    
    return jsonify({'replies': replies_list}), 200

@replies_api.route('/api/replies/<int:replie_id>', methods=['PUT'])
def update_replie(replie_id):
    data = request.get_json()
    content = data.get('content')

    reply = Reply.query.get(replie_id)
    if not reply:
        return jsonify({'error': 'Reply not found'}), 404

    if content:
        reply.content = content

    db.session.commit()

    return jsonify({'message': 'Reply updated successfully'}), 200

@replies_api.route('/api/replies/<int:replie_id>', methods=['DELETE'])
def delete_replie(replie_id):
    reply = Reply.query.get(replie_id)
    if not reply:
        return jsonify({'error': 'Reply not found'}), 404

    db.session.delete(reply)
    db.session.commit()

    return jsonify({'message': 'Reply deleted successfully'}), 200

@replies_api.route('/api/replies/<int:replie_id>', methods=['GET'])
def get_replie(replie_id):
    try:
        reply = Reply.query.get(replie_id)
        if not reply:
            return jsonify({'error': 'Reply not found'}), 404

        user = User.query.get(reply.user_id)
        
        reply_media_list = ReplyMedia.query.filter_by(replies_id=reply.id).all()
        media = [{
            'id': m.id,
            'url': m.media_url,
            'type': m.media_type,
            'created_at': m.created_at.isoformat()
        } for m in reply_media_list]

        likes_count = ReplyLike.query.filter_by(replies_id=reply.id).count()

        replie_data = {
            'id': reply.id,
            'content': reply.content,
            'comment_id': reply.comment_id,
            'user_id': reply.user_id,
            'created_at': reply.created_at.isoformat(),
            'likes_count': likes_count,
            'media': media,
            'user': {
                'id': user.id if user else None,
                'pseudo': user.pseudo if user else None,
                'first_name': user.first_name if user else None,
                'last_name': user.last_name if user else None,
                'profile_picture': user.profile_picture if user else None
            }
        }

        return jsonify({'reply': replie_data}), 200
    except Exception as e:
        return jsonify({'error': f'Failed to fetch reply: {str(e)}'}), 500

@replies_api.route('/api/replies/<int:replie_id>/comments', methods=['GET'])
def get_replie_comments(replie_id):
    reply = Reply.query.get(replie_id)
    if not reply:
        return jsonify({'error': 'Reply not found'}), 404

    comments = reply.comments
    comments_list = [{'id': comment.id, 'content': comment.content, 'created_at': comment.created_at} for comment in comments]
    
    return jsonify({'comments': comments_list}), 200