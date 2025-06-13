from flask import Blueprint, request, jsonify
from models import db
from models.reply import Reply
from models.post import Post
from models.comment import Comment
from models.notification import Notification
from models.user import User
from models.reply_media import ReplyMedia
from models.reply_like import ReplyLike
from models.comment_media import CommentMedia
from models.comment_like import CommentLike
from models.post_media import PostMedia
from models.like import Like
from models.category import Category
from services.file_upload import upload_file, determine_media_type

replies_api = Blueprint('replies_api', __name__)

@replies_api.route('/api/replies', methods=['POST'])
def create_replie():
    try:
        if request.is_json:
            data = request.get_json()
            content = data.get('content')
            comment_id = data.get('comment_id')
            replies_id = data.get('replies_id')
            user_id = data.get('user_id')
            media_files = []
        else:
            content = request.form.get('content')
            comment_id = request.form.get('comment_id')
            replies_id = request.form.get('replies_id')
            user_id = request.form.get('user_id')
            
            media_files = []
            if 'file' in request.files:
                file = request.files['file']
                if file.filename:
                    media_files.append(file)
                    
            if 'files[]' in request.files:
                files = request.files.getlist('files[]')
                media_files.extend(files)

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
            notify_user_on_new_replie(new_replie)
        else:
            notify_user_on_reply_to_reply(new_replie)
        
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
            'reply': {
                'id': new_replie.id,
                'content': new_replie.content,
                'comment_id': new_replie.comment_id,
                'replies_id': new_replie.replies_id,
                'user_id': new_replie.user_id,
                'created_at': new_replie.created_at.isoformat(),
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

        sub_replies = Reply.query.filter_by(replies_id=reply.id).order_by(Reply.created_at.asc()).all()
        sub_replies_data = []
        
        for sub_reply in sub_replies:
            sub_reply_user = User.query.get(sub_reply.user_id)
            sub_reply_media = ReplyMedia.query.filter_by(replies_id=sub_reply.id).all()
            sub_reply_likes = ReplyLike.query.filter_by(replies_id=sub_reply.id).count()
            
            sub_sub_replies = Reply.query.filter_by(replies_id=sub_reply.id).order_by(Reply.created_at.asc()).all()
            sub_sub_replies_data = []
            
            for sub_sub_reply in sub_sub_replies:
                sub_sub_reply_user = User.query.get(sub_sub_reply.user_id)
                sub_sub_reply_media = ReplyMedia.query.filter_by(replies_id=sub_sub_reply.id).all()
                sub_sub_reply_likes = ReplyLike.query.filter_by(replies_id=sub_sub_reply.id).count()
                
                sub_sub_replies_data.append({
                    'id': sub_sub_reply.id,
                    'content': sub_sub_reply.content,
                    'created_at': sub_sub_reply.created_at.isoformat(),
                    'likes_count': sub_sub_reply_likes,
                    'media': [{
                        'id': m.id,
                        'url': m.media_url,
                        'type': m.media_type
                    } for m in sub_sub_reply_media],
                    'user': {
                        'id': sub_sub_reply_user.id if sub_sub_reply_user else None,
                        'pseudo': sub_sub_reply_user.pseudo if sub_sub_reply_user else None,
                        'first_name': sub_sub_reply_user.first_name if sub_sub_reply_user else None,
                        'last_name': sub_sub_reply_user.last_name if sub_sub_reply_user else None,
                        'profile_picture': sub_sub_reply_user.profile_picture if sub_sub_reply_user else None
                    }
                })
            
            sub_replies_data.append({
                'id': sub_reply.id,
                'content': sub_reply.content,
                'created_at': sub_reply.created_at.isoformat(),
                'likes_count': sub_reply_likes,
                'media': [{
                    'id': m.id,
                    'url': m.media_url,
                    'type': m.media_type
                } for m in sub_reply_media],
                'sub_replies': sub_sub_replies_data,
                'user': {
                    'id': sub_reply_user.id if sub_reply_user else None,
                    'pseudo': sub_reply_user.pseudo if sub_reply_user else None,
                    'first_name': sub_reply_user.first_name if sub_reply_user else None,
                    'last_name': sub_reply_user.last_name if sub_reply_user else None,
                    'profile_picture': sub_reply_user.profile_picture if sub_reply_user else None
                }
            })

        replie_data = {
            'id': reply.id,
            'content': reply.content,
            'comment_id': reply.comment_id,
            'replies_id': reply.replies_id,
            'user_id': reply.user_id,
            'created_at': reply.created_at.isoformat(),
            'likes_count': likes_count,
            'media': media,
            'sub_replies': sub_replies_data,
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
        return jsonify({'error': f'Failed to get reply: {str(e)}'}), 500

@replies_api.route('/api/replies/<int:replie_id>/comments', methods=['GET'])
def get_replie_comments(replie_id):
    reply = Reply.query.get(replie_id)
    if not reply:
        return jsonify({'error': 'Reply not found'}), 404

    comments = reply.comments
    comments_list = [{'id': comment.id, 'content': comment.content, 'created_at': comment.created_at} for comment in comments]
    
    return jsonify({'comments': comments_list}), 200

@replies_api.route('/api/replies/<int:reply_id>/thread', methods=['GET'])
def get_reply_thread(reply_id):
    """Récupère le fil complet d'une réponse jusqu'au post d'origine"""
    try:
        main_reply = Reply.query.get(reply_id)
        if not main_reply:
            return jsonify({'error': 'Réponse non trouvée'}), 404

        thread = {
            'reply': None,
            'parent_replies': [],
            'comment': None,
            'post': None
        }

        main_reply_user = User.query.get(main_reply.user_id)
        main_reply_media = ReplyMedia.query.filter_by(replies_id=main_reply.id).all()
        main_reply_likes = ReplyLike.query.filter_by(replies_id=main_reply.id).count()
        sub_replies = Reply.query.filter_by(replies_id=main_reply.id).order_by(Reply.created_at.asc()).all()
        
        sub_replies_data = []
        for sub_reply in sub_replies:
            sub_reply_user = User.query.get(sub_reply.user_id)
            sub_reply_media = ReplyMedia.query.filter_by(replies_id=sub_reply.id).all()
            sub_reply_likes = ReplyLike.query.filter_by(replies_id=sub_reply.id).count()
            
            sub_sub_replies = Reply.query.filter_by(replies_id=sub_reply.id).order_by(Reply.created_at.asc()).all()
            sub_sub_replies_data = []
            
            for sub_sub_reply in sub_sub_replies:
                sub_sub_reply_user = User.query.get(sub_sub_reply.user_id)
                sub_sub_reply_media = ReplyMedia.query.filter_by(replies_id=sub_sub_reply.id).all()
                sub_sub_reply_likes = ReplyLike.query.filter_by(replies_id=sub_sub_reply.id).count()
                
                sub_sub_replies_data.append({
                    'id': sub_sub_reply.id,
                    'content': sub_sub_reply.content,
                    'created_at': sub_sub_reply.created_at.isoformat(),
                    'likes_count': sub_sub_reply_likes,
                    'media': [{
                        'id': m.id,
                        'url': m.media_url,
                        'type': m.media_type
                    } for m in sub_sub_reply_media],
                    'user': {
                        'id': sub_sub_reply_user.id if sub_sub_reply_user else None,
                        'pseudo': sub_sub_reply_user.pseudo if sub_sub_reply_user else None,
                        'first_name': sub_sub_reply_user.first_name if sub_sub_reply_user else None,
                        'last_name': sub_sub_reply_user.last_name if sub_sub_reply_user else None,
                        'profile_picture': sub_sub_reply_user.profile_picture if sub_sub_reply_user else None
                    }
                })
            
            sub_replies_data.append({
                'id': sub_reply.id,
                'content': sub_reply.content,
                'created_at': sub_reply.created_at.isoformat(),
                'likes_count': sub_reply_likes,
                'media': [{
                    'id': m.id,
                    'url': m.media_url,
                    'type': m.media_type
                } for m in sub_reply_media],
                'sub_replies': sub_sub_replies_data,
                'user': {
                    'id': sub_reply_user.id if sub_reply_user else None,
                    'pseudo': sub_reply_user.pseudo if sub_reply_user else None,
                    'first_name': sub_reply_user.first_name if sub_reply_user else None,
                    'last_name': sub_reply_user.last_name if sub_reply_user else None,
                    'profile_picture': sub_reply_user.profile_picture if sub_reply_user else None
                }
            })

        thread['reply'] = {
            'id': main_reply.id,
            'content': main_reply.content,
            'created_at': main_reply.created_at.isoformat(),
            'likes_count': main_reply_likes,
            'comment_id': main_reply.comment_id,
            'replies_id': main_reply.replies_id,
            'media': [{
                'id': m.id,
                'url': m.media_url,
                'type': m.media_type
            } for m in main_reply_media],
            'sub_replies': sub_replies_data,
            'user': {
                'id': main_reply_user.id if main_reply_user else None,
                'pseudo': main_reply_user.pseudo if main_reply_user else None,
                'first_name': main_reply_user.first_name if main_reply_user else None,
                'last_name': main_reply_user.last_name if main_reply_user else None,
                'profile_picture': main_reply_user.profile_picture if main_reply_user else None
            }
        }

        current_reply = main_reply
        parent_replies = []
        
        while current_reply.replies_id:
            parent_reply = Reply.query.get(current_reply.replies_id)
            if not parent_reply:
                break
                
            parent_reply_user = User.query.get(parent_reply.user_id)
            parent_reply_media = ReplyMedia.query.filter_by(replies_id=parent_reply.id).all()
            parent_reply_likes = ReplyLike.query.filter_by(replies_id=parent_reply.id).count()
            
            parent_replies.append({
                'id': parent_reply.id,
                'content': parent_reply.content,
                'created_at': parent_reply.created_at.isoformat(),
                'likes_count': parent_reply_likes,
                'comment_id': parent_reply.comment_id,
                'replies_id': parent_reply.replies_id,
                'media': [{
                    'id': m.id,
                    'url': m.media_url,
                    'type': m.media_type
                } for m in parent_reply_media],
                'user': {
                    'id': parent_reply_user.id if parent_reply_user else None,
                    'pseudo': parent_reply_user.pseudo if parent_reply_user else None,
                    'first_name': parent_reply_user.first_name if parent_reply_user else None,
                    'last_name': parent_reply_user.last_name if parent_reply_user else None,
                    'profile_picture': parent_reply_user.profile_picture if parent_reply_user else None
                }
            })
            
            current_reply = parent_reply

        thread['parent_replies'] = list(reversed(parent_replies))

        if current_reply.comment_id:
            comment = Comment.query.get(current_reply.comment_id)
            if comment:
                comment_user = User.query.get(comment.user_id)
                comment_media = CommentMedia.query.filter_by(comment_id=comment.id).all()
                comment_likes = CommentLike.query.filter_by(comment_id=comment.id).count()
                comment_replies = Reply.query.filter_by(comment_id=comment.id).order_by(Reply.created_at.asc()).all()
                
                thread['comment'] = {
                    'id': comment.id,
                    'content': comment.content,
                    'created_at': comment.created_at.isoformat(),
                    'likes_count': comment_likes,
                    'post_id': comment.post_id,
                    'media': [{
                        'id': m.id,
                        'url': m.media_url,
                        'type': m.media_type
                    } for m in comment_media],
                    'replies': [{
                        'id': r.id,
                        'content': r.content,
                        'created_at': r.created_at.isoformat(),
                        'likes_count': ReplyLike.query.filter_by(replies_id=r.id).count()
                    } for r in comment_replies],
                    'user': {
                        'id': comment_user.id if comment_user else None,
                        'pseudo': comment_user.pseudo if comment_user else None,
                        'first_name': comment_user.first_name if comment_user else None,
                        'last_name': comment_user.last_name if comment_user else None,
                        'profile_picture': comment_user.profile_picture if comment_user else None
                    }
                }

                post = Post.query.get(comment.post_id)
                if post:
                    post_user = User.query.get(post.user_id)
                    post_media = PostMedia.query.filter_by(post_id=post.id).all()
                    post_likes = Like.query.filter_by(post_id=post.id).count()
                    post_comments = Comment.query.filter_by(post_id=post.id).count()
                    category = Category.query.get(post.category_id) if post.category_id else None
                    
                    thread['post'] = {
                        'id': post.id,
                        'title': post.title,
                        'content': post.content,
                        'published_at': post.published_at.isoformat() if post.published_at else None,
                        'likes_count': post_likes,
                        'comments_count': post_comments,
                        'media': [{
                            'id': m.id,
                            'url': m.media_url,
                            'type': m.media_type
                        } for m in post_media],
                        'user': {
                            'id': post_user.id if post_user else None,
                            'pseudo': post_user.pseudo if post_user else None,
                            'first_name': post_user.first_name if post_user else None,
                            'last_name': post_user.last_name if post_user else None,
                            'profile_picture': post_user.profile_picture if post_user else None
                        },
                        'category': {
                            'id': category.id,
                            'name': category.name,
                            'description': category.description
                        } if category else None
                    }

        return jsonify(thread), 200

    except Exception as e:
        print(f"Erreur lors de la récupération du thread: {e}")
        return jsonify({'error': f'Erreur serveur: {str(e)}'}), 500