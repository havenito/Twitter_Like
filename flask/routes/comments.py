from flask import Blueprint, request, jsonify
from models import db
from models.comment import Comment
comments_api = Blueprint('comments_api', __name__)

@comments_api.route('/api/comments', methods=['GET'])
def get_comments():
    try:
        comments = Comment.query.all()
        return jsonify([comment.to_dict() for comment in comments])
    except Exception as e:
        print(f"Erreur lors de la récupération des comments: {e}")
        return jsonify({'error': f'Failed to fetch comments: {str(e)}'}), 500

@comments_api.route('/api/comments/<int:id>', methods=['GET'])
def get_comment(id):
    try:
        comment = Comment.query.get_or_404(id)
        return jsonify(comment.to_dict())
    except Exception as e:
        return jsonify({'error': f'Comment not found: {str(e)}'}), 404

@comments_api.route('/api/comments', methods=['POST'])
def create_comment():
    try:
        data = request.get_json()
        new_comment = Comment(
            content=data['content'],
            created_at=data['created_at'],
            status=data['status'],
            user_id=data['user_id'],
            post_id=data['post_id'],
            comment_id=data.get('comment_id')
        )
        db.session.add(new_comment)
        db.session.commit()
        return jsonify({'message': 'Comment created successfully', 'comment_id': new_comment.id}), 201
    except KeyError as e:
        return jsonify({'error': f'Missing required field: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create comment: {str(e)}'}), 500

@comments_api.route('/api/comments/<int:id>', methods=['PUT'])
def update_comment(id):
    try:
        data = request.get_json()
        comment = Comment.query.get_or_404(id)

        if 'content' in data:
            comment.content = data['content']

        if 'status' in data:
            comment.status = data['status']

        if 'user_id' in data:
            comment.user_id = data['user_id']

        if 'post_id' in data:
            comment.post_id = data['post_id']

        if 'comment_id' in data:
            comment.comment_id = data['comment_id']

        db.session.commit()
        return jsonify({
            'message': 'Comment updated successfully',
            'comment': {
                'id': comment.id,
                'content': comment.content,
                'status': comment.status,
                'user_id': comment.user_id,
                'post_id': comment.post_id,
                'comment_id': comment.comment_id
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update comment: {str(e)}'}), 500

@comments_api.route('/api/comments/<int:id>', methods=['DELETE'])
def delete_comment(id):
    try:
        comment = Comment.query.get_or_404(id)
        db.session.delete(comment)
        db.session.commit()
        return jsonify({'message': 'Comment deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete comment: {str(e)}'}), 500