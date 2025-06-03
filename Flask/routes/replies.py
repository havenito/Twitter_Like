from flask import Blueprint, request, jsonify
from models import db
from models.user import User
from models.reply import Reply
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token

replies_api = Blueprint('replies_api', __name__)

@replies_api.route('/api/replies', methods=['POST'])
def create_replie():
    data = request.get_json()
    content = data.get('content')
    comment_id = data.get('comment_id')
    user_id = data.get('user_id')

    if not content:
        return jsonify({'error': 'Content is required'}), 400
    
    new_replie = Reply(content=content, comment_id=comment_id, user_id=user_id)
    db.session.add(new_replie)
    db.session.commit()

    return jsonify({'message': 'Reply created successfully', 'replie_id': new_replie.id}), 201

@replies_api.route('/api/replies', methods=['GET'])
def get_replies():
    replies = Reply.query.all()
    replies_list = [{'id': replie.id, 'content': replie.content, 'comment_id': replie.comment_id, 'user_id': replie.user_id} for replie in replies]
    
    return jsonify({'replies': replies_list}), 200

@replies_api.route('/api/replies/<int:replie_id>', methods=['PUT'])
def update_replie(replie_id):
    data = request.get_json()
    content = data.get('content')

    replie = Reply.query.get(replie_id)
    if not replie:
        return jsonify({'error': 'Reply not found'}), 404

    if content:
        replie.content = content

    db.session.commit()

    return jsonify({'message': 'Reply updated successfully'}), 200

@replies_api.route('/api/replies/<int:replie_id>', methods=['DELETE'])
def delete_replie(replie_id):
    replie = Reply.query.get(replie_id)
    if not replie:
        return jsonify({'error': 'Reply not found'}), 404

    db.session.delete(replie)
    db.session.commit()

    return jsonify({'message': 'Reply deleted successfully'}), 200

@replies_api.route('/api/replies/<int:replie_id>', methods=['GET'])
def get_replie(replie_id):
    replie = Reply.query.get(replie_id)
    if not replie:
        return jsonify({'error': 'Reply not found'}), 404

    replie_data = {
        'id': replie.id,
        'content': replie.content,
        'comment_id': replie.comment_id,
        'user_id': replie.user_id
    }

    return jsonify({'replie': replie_data}), 200

@replies_api.route('/api/replies/<int:replie_id>/comments', methods=['GET'])
def get_replie_comments(replie_id):
    replie = Reply.query.get(replie_id)
    if not replie:
        return jsonify({'error': 'Reply not found'}), 404

    comments = replie.comments
    comments_list = [{'id': comment.id, 'content': comment.content, 'created_at': comment.created_at} for comment in comments]
    
    return jsonify({'comments': comments_list}), 200