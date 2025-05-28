from flask import Blueprint, request, jsonify
from models import db
from models.post import Post
from models.notification import Notification
from models.comment import Comment


comments_api = Blueprint('comments_api', __name__)

@comments_api.route('/api/comments', methods=['POST'])
def create_comment():
    data = request.get_json()
    content = data.get('content')
    post_id = data.get('post_id')
    user_id = data.get('user_id')

    if not content:
        return jsonify({'error': 'Content is required'}), 400

    new_comment = Comment(content=content, post_id=post_id, user_id=user_id)
    db.session.add(new_comment)
    db.session.commit()

    # Notifier l'utilisateur du post
    notify_user_on_new_comment(new_comment)

    return jsonify({'message': 'Comment created successfully', 'comment_id': new_comment.id}), 201

def notify_user_on_new_comment(comment):
    post = Post.query.get(comment.post_id)
    if post:
        notification = Notification(
            post_id=post.id,
            comments_id=comment.id,
            user_id=post.user_id
        )
        db.session.add(notification)
        db.session.commit()


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
    comment = Comment.query.get(comment_id)
    if not comment:
        return jsonify({'error': 'Comment not found'}), 404

    comment_data = {
        'id': comment.id,
        'content': comment.content,
        'post_id': comment.post_id,
        'user_id': comment.user_id
    }

    return jsonify({'comment': comment_data}), 200
@comments_api.route('/api/comments/<int:comment_id>/replies', methods=['GET'])
def get_comment_replies(comment_id):
    comment = Comment.query.get(comment_id)
    if not comment:
        return jsonify({'error': 'Comment not found'}), 404

    replies = comment.replies.all()
    replies_list = [{'id': reply.id, 'content': reply.content, 'comment_id': reply.comment_id, 'user_id': reply.user_id} for reply in replies]

    return jsonify({'replies': replies_list}), 200
