from flask import Blueprint, request, jsonify
from models import db
from models.post import Post
from models.user import User
from models.notification import Notification
from models.comment import Comment
from models.reply import Reply
from models.comment_media import CommentMedia
from models.reply_media import ReplyMedia
from models.comment_like import CommentLike
from models.reply_like import ReplyLike
from services.file_upload import upload_file, determine_media_type

comments_api = Blueprint('comments_api', __name__)

@comments_api.route('/api/comments', methods=['POST'])
def create_comment():
    try:
        if request.is_json:
            data = request.get_json()
            content = data.get('content')
            post_id = data.get('post_id')
            user_id = data.get('user_id')
            media_files = []
        else:
            content = request.form.get('content')
            post_id = request.form.get('post_id')
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

        new_comment = Comment(content=content, post_id=post_id, user_id=user_id)
        db.session.add(new_comment)
        db.session.commit()

        for file in media_files:
            url, file_type = upload_file(file)
            
            if not url:
                continue 
                
            media_type = determine_media_type(file_type)
            if not media_type:
                continue 
                
            comment_media = CommentMedia(
                comment_id=new_comment.id,
                media_url=url,
                media_type=media_type
            )
            db.session.add(comment_media)

        db.session.commit()

        notify_user_on_new_comment(new_comment)

        user = User.query.get(user_id)
        
        comment_media_list = CommentMedia.query.filter_by(comment_id=new_comment.id).all()
        media = [{
            'id': m.id,
            'url': m.media_url,
            'type': m.media_type,
            'created_at': m.created_at.isoformat()
        } for m in comment_media_list]
        
        return jsonify({
            'message': 'Comment created successfully', 
            'comment': {
                'id': new_comment.id,
                'content': new_comment.content,
                'created_at': new_comment.created_at.isoformat(),
                'post_id': new_comment.post_id,
                'user_id': new_comment.user_id,
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
        return jsonify({'error': f'Failed to create comment: {str(e)}'}), 500

def notify_user_on_new_comment(comment):
    try:
        post = Post.query.get(comment.post_id)
        if post and post.user_id != comment.user_id:
            notification = Notification(
                post_id=post.id,
                comments_id=comment.id,
                user_id=post.user_id,
                replie_id=None, 
                follow_id=None, 
                type="comment"
            )
            db.session.add(notification)
            db.session.commit()

            print(f"Notification envoyée à l'utilisateur {post.user_id} pour un commentaire sur le post {post.id}.")
        else:
            print("Erreur : Impossible de récupérer le post lié au commentaire.")
    except Exception as e:
        print(f"Erreur lors de la notification: {e}")

@comments_api.route('/api/posts/<int:post_id>/comments', methods=['GET'])
def get_post_comments(post_id):
    try:
        comments = Comment.query.filter_by(post_id=post_id).order_by(Comment.created_at.desc()).all()
        result = []
        
        for comment in comments:
            user = User.query.get(comment.user_id)
            
            comment_media_list = CommentMedia.query.filter_by(comment_id=comment.id).all()
            media = [{
                'id': m.id,
                'url': m.media_url,
                'type': m.media_type,
                'created_at': m.created_at.isoformat()
            } for m in comment_media_list]
            
            likes_count = CommentLike.query.filter_by(comment_id=comment.id).count()
            
            replies = Reply.query.filter_by(comment_id=comment.id).order_by(Reply.created_at.asc()).all()
            replies_data = []
            
            for reply in replies:
                reply_user = User.query.get(reply.user_id)
                
                reply_media_list = ReplyMedia.query.filter_by(replies_id=reply.id).all()
                reply_media = [{
                    'id': m.id,
                    'url': m.media_url,
                    'type': m.media_type,
                    'created_at': m.created_at.isoformat()
                } for m in reply_media_list]
                
                reply_likes_count = ReplyLike.query.filter_by(replies_id=reply.id).count()
                
                replies_data.append({
                    'id': reply.id,
                    'content': reply.content,
                    'created_at': reply.created_at.isoformat(),
                    'comment_id': reply.comment_id,
                    'user_id': reply.user_id,
                    'likes_count': reply_likes_count,
                    'media': reply_media,
                    'user': {
                        'id': reply_user.id if reply_user else None,
                        'pseudo': reply_user.pseudo if reply_user else None,
                        'first_name': reply_user.first_name if reply_user else None,
                        'last_name': reply_user.last_name if reply_user else None,
                        'profile_picture': reply_user.profile_picture if reply_user else None
                    }
                })
            
            result.append({
                'id': comment.id,
                'content': comment.content,
                'created_at': comment.created_at.isoformat(),
                'post_id': comment.post_id,
                'user_id': comment.user_id,
                'media': media,
                'likes_count': likes_count,
                'replies': replies_data,
                'user': {
                    'id': user.id if user else None,
                    'pseudo': user.pseudo if user else None,
                    'first_name': user.first_name if user else None,
                    'last_name': user.last_name if user else None,
                    'profile_picture': user.profile_picture if user else None
                }
            })
        
        return jsonify({'comments': result}), 200
    except Exception as e:
        return jsonify({'error': f'Failed to fetch comments: {str(e)}'}), 500

@comments_api.route('/api/comments', methods=['GET'])
def get_comments():
    comments = Comment.query.all()
    comments_list = [{'id': comment.id, 'content': comment.content, 'post_id': comment.post_id, 'user_id': comment.user_id} for comment in comments]
    
    return jsonify({'comments': comments_list}), 200

@comments_api.route('/api/comments/<int:comment_id>', methods=['PUT'])
def update_comment(comment_id):
    data = request.get_json()
    content = data.get('content')

    comment = Comment.query.get(comment_id)
    if not comment:
        return jsonify({'error': 'Comment not found'}), 404

    if content:
        comment.content = content

    db.session.commit()

    return jsonify({'message': 'Comment updated successfully'}), 200

@comments_api.route('/api/comments/<int:comment_id>', methods=['DELETE'])
def delete_comment(comment_id):
    comment = Comment.query.get(comment_id)
    if not comment:
        return jsonify({'error': 'Comment not found'}), 404

    db.session.delete(comment)
    db.session.commit()

    return jsonify({'message': 'Comment deleted successfully'}), 200

@comments_api.route('/api/comments/<int:comment_id>', methods=['GET'])
def get_comment(comment_id):
    try:
        comment = Comment.query.get(comment_id)
        if not comment:
            return jsonify({'error': 'Comment not found'}), 404

        user = User.query.get(comment.user_id)
        
        comment_media_list = CommentMedia.query.filter_by(comment_id=comment.id).all()
        media = [{
            'id': m.id,
            'url': m.media_url,
            'type': m.media_type,
            'created_at': m.created_at.isoformat()
        } for m in comment_media_list]
        
        likes_count = CommentLike.query.filter_by(comment_id=comment.id).count()
        
        replies = Reply.query.filter_by(comment_id=comment.id).order_by(Reply.created_at.asc()).all()
        replies_data = []
        
        for reply in replies:
            reply_user = User.query.get(reply.user_id)
            
            reply_media_list = ReplyMedia.query.filter_by(replies_id=reply.id).all()
            reply_media = [{
                'id': m.id,
                'url': m.media_url,
                'type': m.media_type,
                'created_at': m.created_at.isoformat()
            } for m in reply_media_list]
            
            reply_likes_count = ReplyLike.query.filter_by(replies_id=reply.id).count()
            
            sub_replies = Reply.query.filter_by(replies_id=reply.id).order_by(Reply.created_at.asc()).all()
            sub_replies_data = []
            
            for sub_reply in sub_replies:
                sub_reply_user = User.query.get(sub_reply.user_id)
                
                sub_reply_media_list = ReplyMedia.query.filter_by(replies_id=sub_reply.id).all()
                sub_reply_media = [{
                    'id': m.id,
                    'url': m.media_url,
                    'type': m.media_type,
                    'created_at': m.created_at.isoformat()
                } for m in sub_reply_media_list]
                
                sub_reply_likes_count = ReplyLike.query.filter_by(replies_id=sub_reply.id).count()
                
                sub_replies_data.append({
                    'id': sub_reply.id,
                    'content': sub_reply.content,
                    'created_at': sub_reply.created_at.isoformat(),
                    'comment_id': sub_reply.comment_id,
                    'replies_id': sub_reply.replies_id,
                    'user_id': sub_reply.user_id,
                    'likes_count': sub_reply_likes_count,
                    'media': sub_reply_media,
                    'user': {
                        'id': sub_reply_user.id if sub_reply_user else None,
                        'pseudo': sub_reply_user.pseudo if sub_reply_user else None,
                        'first_name': sub_reply_user.first_name if sub_reply_user else None,
                        'last_name': sub_reply_user.last_name if sub_reply_user else None,
                        'profile_picture': sub_reply_user.profile_picture if sub_reply_user else None
                    }
                })
            
            replies_data.append({
                'id': reply.id,
                'content': reply.content,
                'created_at': reply.created_at.isoformat(),
                'comment_id': reply.comment_id,
                'user_id': reply.user_id,
                'likes_count': reply_likes_count,
                'media': reply_media,
                'sub_replies': sub_replies_data,
                'user': {
                    'id': reply_user.id if reply_user else None,
                    'pseudo': reply_user.pseudo if reply_user else None,
                    'first_name': reply_user.first_name if reply_user else None,
                    'last_name': reply_user.last_name if reply_user else None,
                    'profile_picture': reply_user.profile_picture if reply_user else None
                }
            })

        comment_data = {
            'id': comment.id,
            'content': comment.content,
            'created_at': comment.created_at.isoformat(),
            'post_id': comment.post_id,
            'user_id': comment.user_id,
            'likes_count': likes_count,
            'media': media,
            'replies': replies_data,
            'user': {
                'id': user.id if user else None,
                'pseudo': user.pseudo if user else None,
                'first_name': user.first_name if user else None,
                'last_name': user.last_name if user else None,
                'profile_picture': user.profile_picture if user else None
            }
        }

        return jsonify({'comment': comment_data}), 200
    except Exception as e:
        return jsonify({'error': f'Failed to fetch comment: {str(e)}'}), 500

@comments_api.route('/api/comments/<int:comment_id>/replies', methods=['GET'])
def get_comment_replies(comment_id):
    comment = Comment.query.get(comment_id)
    if not comment:
        return jsonify({'error': 'Comment not found'}), 404

    replies = comment.replies.all()
    replies_list = [{'id': reply.id, 'content': reply.content, 'comment_id': reply.comment_id, 'user_id': reply.user_id} for reply in replies]

    return jsonify({'replies': replies_list}), 200